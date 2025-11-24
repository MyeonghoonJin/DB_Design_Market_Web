import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 거래 신청 생성 (구매자)
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품 정보 조회
    const products = await query<{ seller_id: string; status: string }[]>(
      'SELECT seller_id, status FROM products WHERE product_id = ?',
      [productId]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const product = products[0];

    // 본인 상품에 신청 불가
    if (product.seller_id === buyerId) {
      return NextResponse.json(
        { error: '본인 상품에는 거래 신청할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 판매완료 상품에 신청 불가
    if (product.status === 'SOLD') {
      return NextResponse.json(
        { error: '이미 판매완료된 상품입니다.' },
        { status: 400 }
      );
    }

    // 이미 신청했는지 확인
    const existingRequests = await query<{ request_id: number; status: string }[]>(
      'SELECT request_id, status FROM transaction_requests WHERE product_id = ? AND buyer_id = ?',
      [productId, buyerId]
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
      // REJECTED인 경우 다시 신청 가능하도록 기존 신청 삭제
      await query('DELETE FROM transaction_requests WHERE request_id = ?', [existing.request_id]);
    }

    // 거래 신청 생성
    const result = await query<{ insertId: number }>(
      'INSERT INTO transaction_requests (product_id, buyer_id, seller_id) VALUES (?, ?, ?)',
      [productId, buyerId, product.seller_id]
    );
    const requestId = (result as unknown as { insertId: number }).insertId;

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

// 거래 신청 상태 조회 (구매자용 - 특정 상품에 대한 신청 상태)
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
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 해당 상품에 대한 내 거래 신청 조회
    const requests = await query<{
      request_id: number;
      status: string;
      created_at: Date;
    }[]>(
      'SELECT request_id, status, created_at FROM transaction_requests WHERE product_id = ? AND buyer_id = ?',
      [productId, userId]
    );

    if (requests.length === 0) {
      return NextResponse.json({ request: null });
    }

    return NextResponse.json({
      request: {
        requestId: requests[0].request_id,
        status: requests[0].status,
        createdAt: requests[0].created_at,
      },
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
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 거래 신청 확인
    const requests = await query<{ request_id: number; status: string }[]>(
      'SELECT request_id, status FROM transaction_requests WHERE product_id = ? AND buyer_id = ?',
      [productId, buyerId]
    );

    if (requests.length === 0) {
      return NextResponse.json(
        { error: '거래 신청을 찾을 수 없습니다.' },
        { status: 404 }
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
