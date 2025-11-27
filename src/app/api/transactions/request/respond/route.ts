import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 거래 신청 수락/거절 (판매자)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const sellerId = decoded.userId;

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: '신청 ID와 액션이 필요합니다.' },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다.' },
        { status: 400 }
      );
    }

    // 거래 신청 조회
    const requests = await query<{
      request_id: number;
      room_id: number;
      product_id: number;
      buyer_id: string;
      seller_id: string;
      status: string;
    }[]>(
      'SELECT request_id, room_id, product_id, buyer_id, seller_id, status FROM transaction_requests WHERE request_id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return NextResponse.json(
        { error: '거래 신청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const transactionRequest = requests[0];

    // 판매자 확인
    if (transactionRequest.seller_id !== sellerId) {
      return NextResponse.json(
        { error: '이 거래 신청에 대한 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 처리된 신청인지 확인
    if (transactionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: '이미 처리된 거래 신청입니다.' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // 상품 상태 확인
      const products = await query<{ status: string }[]>(
        'SELECT status FROM products WHERE product_id = ?',
        [transactionRequest.product_id]
      );

      if (products.length === 0 || products[0].status === 'SOLD') {
        return NextResponse.json(
          { error: '이미 판매완료된 상품입니다.' },
          { status: 400 }
        );
      }

      // 거래 생성
      await query(
        'INSERT INTO transactions (seller_id, buyer_id, product_id) VALUES (?, ?, ?)',
        [sellerId, transactionRequest.buyer_id, transactionRequest.product_id]
      );

      // 상품 상태를 SOLD로 변경
      await query(
        'UPDATE products SET status = ? WHERE product_id = ?',
        ['SOLD', transactionRequest.product_id]
      );

      // 거래 신청 상태를 ACCEPTED로 변경
      await query(
        'UPDATE transaction_requests SET status = ? WHERE request_id = ?',
        ['ACCEPTED', requestId]
      );

      // 다른 대기 중인 신청들은 REJECTED로 변경하고 거절 기록 추가
      const otherPendingRequests = await query<{ request_id: number; buyer_id: string }[]>(
        'SELECT request_id, buyer_id FROM transaction_requests WHERE product_id = ? AND request_id != ? AND status = ?',
        [transactionRequest.product_id, requestId, 'PENDING']
      );

      for (const req of otherPendingRequests) {
        // 거절 기록 추가
        await query(
          'INSERT IGNORE INTO rejected_requests (product_id, buyer_id) VALUES (?, ?)',
          [transactionRequest.product_id, req.buyer_id]
        );
      }

      // 다른 대기 중인 신청들 REJECTED로 변경
      await query(
        'UPDATE transaction_requests SET status = ? WHERE product_id = ? AND request_id != ? AND status = ?',
        ['REJECTED', transactionRequest.product_id, requestId, 'PENDING']
      );

      // 거래 완료 시스템 메시지 전송
      const completeMessage = JSON.stringify({
        type: 'TRANSACTION_COMPLETE',
        message: '거래가 완료되었습니다!'
      });

      await query(
        'INSERT INTO messages (room_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
        [transactionRequest.room_id, sellerId, completeMessage, 'SYSTEM']
      );

      return NextResponse.json({
        success: true,
        message: '거래가 수락되었습니다.',
      });
    } else {
      // 거절 기록 추가 (재신청 방지)
      await query(
        'INSERT IGNORE INTO rejected_requests (product_id, buyer_id) VALUES (?, ?)',
        [transactionRequest.product_id, transactionRequest.buyer_id]
      );

      // 거래 신청 삭제 (채팅방에서 다시 신청 버튼이 보이지만, 거절 기록으로 인해 신청 불가)
      await query(
        'DELETE FROM transaction_requests WHERE request_id = ?',
        [requestId]
      );

      return NextResponse.json({
        success: true,
        message: '거래가 거절되었습니다.',
      });
    }
  } catch (error) {
    console.error('거래 신청 응답 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
