import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 상품에 대해 채팅한 구매자 목록 조회
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
    const sellerId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품 확인 (판매자인지)
    const products = await query<{ seller_id: string }[]>(
      'SELECT seller_id FROM products WHERE product_id = ?',
      [productId]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (products[0].seller_id !== sellerId) {
      return NextResponse.json(
        { error: '본인 상품만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 채팅방에서 구매자 목록 조회 (거래 신청 상태 포함)
    const buyers = await query<{
      buyer_id: string;
      buyer_name: string;
      room_id: number;
      last_message: string | null;
      last_message_time: Date | null;
      request_id: number | null;
      request_status: string | null;
    }[]>(
      `SELECT
        cr.buyer_id,
        u.name as buyer_name,
        cr.room_id,
        (SELECT content FROM messages WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT sent_at FROM messages WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message_time,
        tr.request_id,
        tr.status as request_status
      FROM chat_rooms cr
      JOIN users u ON cr.buyer_id = u.user_id
      LEFT JOIN transaction_requests tr ON tr.product_id = cr.product_id AND tr.buyer_id = cr.buyer_id
      WHERE cr.product_id = ? AND cr.seller_id = ?
      ORDER BY last_message_time DESC`,
      [productId, sellerId]
    );

    const formattedBuyers = buyers.map((b) => ({
      buyerId: b.buyer_id,
      buyerName: b.buyer_name,
      roomId: b.room_id,
      lastMessage: b.last_message,
      lastMessageTime: b.last_message_time,
      requestId: b.request_id,
      requestStatus: b.request_status,
    }));

    return NextResponse.json({ buyers: formattedBuyers });
  } catch (error) {
    console.error('구매자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
