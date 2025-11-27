import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 판매자 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // 사용자 정보 조회
    const users = await query<{
      user_id: string;
      name: string;
      grade: string;
      profile_image: string | null;
      created_at: Date;
    }[]>(
      'SELECT user_id, name, grade, profile_image, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 판매 중인 상품 수 조회
    const productCountResult = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status = "SALE"',
      [userId]
    );
    const productCount = productCountResult[0].count;

    // 판매 중인 상품 조회
    const products = await query<{
      product_id: number;
      title: string;
      price: number;
      status: string;
      created_at: Date;
      thumbnail: string | null;
    }[]>(
      `SELECT
        p.product_id, p.title, p.price, p.status, p.created_at,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as thumbnail
      FROM products p
      WHERE p.seller_id = ? AND p.status = 'SALE'
      ORDER BY p.created_at DESC`,
      [userId]
    );

    // 받은 후기 조회
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

    // 평균 별점 계산
    const avgScore = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
      : 0;

    return NextResponse.json({
      user: {
        userId: user.user_id,
        name: user.name,
        grade: user.grade,
        profileImage: user.profile_image,
        createdAt: user.created_at,
        productCount,
      },
      products: products.map((p) => ({
        productId: p.product_id,
        title: p.title,
        price: p.price,
        status: p.status,
        createdAt: p.created_at,
        thumbnail: p.thumbnail,
      })),
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
      avgScore: Math.round(avgScore * 10) / 10, // 소수점 첫째자리까지
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error('판매자 프로필 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
