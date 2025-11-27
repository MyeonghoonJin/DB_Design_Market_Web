import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 받은 후기 조회 (내가 판매한 상품에 대한 후기)
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // 내가 판매한 상품에 대한 후기 조회
    const reviews = await query<{
      review_id: number;
      transaction_id: number;
      score: number;
      content: string;
      created_at: Date;
      product_id: number;
      product_title: string;
      product_price: number;
      product_thumbnail: string | null;
      buyer_id: string;
      buyer_name: string;
    }[]>(
      `SELECT
        r.review_id, r.transaction_id, r.score, r.content, r.created_at,
        p.product_id, p.title as product_title, p.price as product_price,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as product_thumbnail,
        t.buyer_id, u.name as buyer_name
      FROM reviews r
      JOIN transactions t ON r.transaction_id = t.transaction_id
      JOIN products p ON t.product_id = p.product_id
      JOIN users u ON t.buyer_id = u.user_id
      WHERE t.seller_id = ?
      ORDER BY r.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        reviewId: r.review_id,
        transactionId: r.transaction_id,
        score: r.score,
        content: r.content,
        createdAt: r.created_at,
        productId: r.product_id,
        productTitle: r.product_title,
        productPrice: r.product_price,
        productThumbnail: r.product_thumbnail,
        buyerId: r.buyer_id,
        buyerName: r.buyer_name,
      })),
    });
  } catch (error) {
    console.error('받은 후기 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
