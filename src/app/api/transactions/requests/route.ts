import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 판매자의 구매 신청 목록 조회
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

    let sql = `
      SELECT
        tr.request_id,
        tr.room_id,
        tr.product_id,
        tr.buyer_id,
        tr.status,
        tr.created_at,
        p.title as product_title,
        p.price as product_price,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as product_thumbnail,
        u.name as buyer_name
      FROM transaction_requests tr
      JOIN products p ON tr.product_id = p.product_id
      JOIN users u ON tr.buyer_id = u.user_id
      WHERE tr.seller_id = ?
    `;
    const params: unknown[] = [sellerId];

    if (productId) {
      sql += ' AND tr.product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY tr.created_at DESC';

    const results = await query<{
      request_id: number;
      room_id: number;
      product_id: number;
      buyer_id: string;
      status: string;
      created_at: Date;
      product_title: string;
      product_price: number;
      product_thumbnail: string | null;
      buyer_name: string;
    }[]>(sql, params);

    const requests = results.map((r) => ({
      requestId: r.request_id,
      roomId: r.room_id,
      productId: r.product_id,
      buyerId: r.buyer_id,
      buyerName: r.buyer_name,
      status: r.status,
      createdAt: r.created_at,
      productTitle: r.product_title,
      productPrice: r.product_price,
      productThumbnail: r.product_thumbnail,
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('구매 신청 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
