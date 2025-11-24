import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 기존 채팅방 확인
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

    // 상품 정보 조회
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

    const sellerId = products[0].seller_id;

    // 본인 상품인지 확인
    if (sellerId === userId) {
      return NextResponse.json(
        { error: '본인 상품에는 채팅할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 기존 채팅방 확인
    const existingRooms = await query<{ room_id: number }[]>(
      'SELECT room_id FROM chat_rooms WHERE product_id = ? AND buyer_id = ? AND seller_id = ?',
      [productId, userId, sellerId]
    );

    if (existingRooms.length > 0) {
      return NextResponse.json({ roomId: existingRooms[0].room_id });
    }

    // 기존 채팅방이 없음
    return NextResponse.json({ roomId: null });
  } catch (error) {
    console.error('채팅방 확인 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
