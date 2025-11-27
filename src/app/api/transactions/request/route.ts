import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 거래 신청 생성 (구매자) - 채팅방 기반
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
    const buyerId = decoded.userId;

    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: '채팅방 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 채팅방 정보 조회
    const chatRooms = await query<{
      room_id: number;
      product_id: number;
      seller_id: string;
      buyer_id: string;
    }[]>(
      'SELECT room_id, product_id, seller_id, buyer_id FROM chat_rooms WHERE room_id = ?',
      [roomId]
    );

    if (chatRooms.length === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const chatRoom = chatRooms[0];

    // 구매자 본인인지 확인
    if (chatRoom.buyer_id !== buyerId) {
      return NextResponse.json(
        { error: '구매자만 거래 신청할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 상품 정보 확인
    const products = await query<{
      status: string;
      title: string;
      price: number;
    }[]>(
      'SELECT status, title, price FROM products WHERE product_id = ?',
      [chatRoom.product_id]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const product = products[0];

    if (product.status === 'SOLD') {
      return NextResponse.json(
        { error: '이미 판매완료된 상품입니다.' },
        { status: 400 }
      );
    }

    // 거절된 적이 있는지 확인 (재신청 불가)
    const rejections = await query<{ rejection_id: number }[]>(
      'SELECT rejection_id FROM rejected_requests WHERE product_id = ? AND buyer_id = ?',
      [chatRoom.product_id, buyerId]
    );

    if (rejections.length > 0) {
      return NextResponse.json(
        { error: '이전에 거절된 상품에는 다시 신청할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 이 채팅방에서 신청했는지 확인
    const existingRequests = await query<{ request_id: number; status: string }[]>(
      'SELECT request_id, status FROM transaction_requests WHERE room_id = ?',
      [roomId]
    );

    if (existingRequests.length > 0) {
      const existing = existingRequests[0];
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { error: '이미 거래 신청 중입니다.' },
          { status: 400 }
        );
      } else if (existing.status === 'ACCEPTED') {
        return NextResponse.json(
          { error: '이미 거래가 수락되었습니다.' },
          { status: 400 }
        );
      }
    }

    // 거래 신청 생성
    const result = await query<{ insertId: number }>(
      'INSERT INTO transaction_requests (room_id, product_id, buyer_id, seller_id) VALUES (?, ?, ?, ?)',
      [roomId, chatRoom.product_id, buyerId, chatRoom.seller_id]
    );
    const requestId = (result as unknown as { insertId: number }).insertId;

    // 채팅방에 구매 요청 시스템 메시지 전송
    const systemMessage = JSON.stringify({
      type: 'PURCHASE_REQUEST',
      productId: chatRoom.product_id,
      productTitle: product.title,
      productPrice: product.price,
      requestId: requestId,
      message: '해당 물품의 구매요청을 하였습니다.'
    });

    await query(
      'INSERT INTO messages (room_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
      [roomId, buyerId, systemMessage, 'SYSTEM']
    );

    return NextResponse.json({
      success: true,
      requestId,
      message: '거래 신청이 완료되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('거래 신청 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 거래 신청 상태 조회 (채팅방 기준)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: '채팅방 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 채팅방 정보 확인
    const chatRooms = await query<{
      product_id: number;
      buyer_id: string;
    }[]>(
      'SELECT product_id, buyer_id FROM chat_rooms WHERE room_id = ?',
      [roomId]
    );

    if (chatRooms.length === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const chatRoom = chatRooms[0];

    // 거절 여부 확인 (구매자인 경우)
    let isRejected = false;
    if (chatRoom.buyer_id === userId) {
      const rejections = await query<{ rejection_id: number }[]>(
        'SELECT rejection_id FROM rejected_requests WHERE product_id = ? AND buyer_id = ?',
        [chatRoom.product_id, userId]
      );
      isRejected = rejections.length > 0;
    }

    // 해당 채팅방의 거래 신청 조회
    const requests = await query<{
      request_id: number;
      status: string;
      created_at: Date;
    }[]>(
      'SELECT request_id, status, created_at FROM transaction_requests WHERE room_id = ?',
      [roomId]
    );

    if (requests.length === 0) {
      return NextResponse.json({
        request: null,
        isRejected,
      });
    }

    return NextResponse.json({
      request: {
        requestId: requests[0].request_id,
        status: requests[0].status,
        createdAt: requests[0].created_at,
      },
      isRejected,
    });
  } catch (error) {
    console.error('거래 신청 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 거래 신청 취소 (구매자)
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const buyerId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: '채팅방 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 거래 신청 확인
    const requests = await query<{ request_id: number; status: string; buyer_id: string }[]>(
      'SELECT request_id, status, buyer_id FROM transaction_requests WHERE room_id = ?',
      [roomId]
    );

    if (requests.length === 0) {
      return NextResponse.json(
        { error: '거래 신청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (requests[0].buyer_id !== buyerId) {
      return NextResponse.json(
        { error: '본인의 신청만 취소할 수 있습니다.' },
        { status: 403 }
      );
    }

    if (requests[0].status !== 'PENDING') {
      return NextResponse.json(
        { error: '대기 중인 신청만 취소할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 거래 신청 삭제
    await query('DELETE FROM transaction_requests WHERE request_id = ?', [requests[0].request_id]);

    return NextResponse.json({ success: true, message: '거래 신청이 취소되었습니다.' });
  } catch (error) {
    console.error('거래 신청 취소 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
