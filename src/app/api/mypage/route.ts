import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    // 사용자 정보 조회
    const users = await query<{
      user_id: string;
      name: string;
      address: string;
      phone: string;
      grade: string;
      points: number;
      profile_image: string | null;
      created_at: Date;
    }[]>(
      'SELECT user_id, name, address, phone, grade, points, profile_image, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 판매 중인 상품 목록 조회
    const sellingProducts = await query<{
      product_id: number;
      title: string;
      price: number;
      status: string;
      created_at: Date;
      thumbnail: string | null;
      wish_count: number;
    }[]>(
      `SELECT
        p.product_id, p.title, p.price, p.status, p.created_at,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as thumbnail,
        (SELECT COUNT(*) FROM wishlists WHERE product_id = p.product_id) as wish_count
      FROM products p
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC`,
      [userId]
    );

    // 구매 내역 조회
    const purchaseHistory = await query<{
      transaction_id: number;
      product_id: number;
      title: string;
      price: number;
      seller_id: string;
      seller_name: string;
      transaction_date: Date;
      thumbnail: string | null;
      has_review: number;
    }[]>(
      `SELECT
        t.transaction_id, t.product_id, p.title, p.price, t.seller_id, u.name as seller_name, t.transaction_date,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as thumbnail,
        (SELECT COUNT(*) FROM reviews WHERE transaction_id = t.transaction_id) as has_review
      FROM transactions t
      JOIN products p ON t.product_id = p.product_id
      JOIN users u ON t.seller_id = u.user_id
      WHERE t.buyer_id = ?
      ORDER BY t.transaction_date DESC`,
      [userId]
    );

    // 판매 내역 조회
    const salesHistory = await query<{
      transaction_id: number;
      product_id: number;
      title: string;
      price: number;
      buyer_id: string;
      buyer_name: string;
      transaction_date: Date;
      thumbnail: string | null;
    }[]>(
      `SELECT
        t.transaction_id, t.product_id, p.title, p.price, t.buyer_id, u.name as buyer_name, t.transaction_date,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as thumbnail
      FROM transactions t
      JOIN products p ON t.product_id = p.product_id
      JOIN users u ON t.buyer_id = u.user_id
      WHERE t.seller_id = ?
      ORDER BY t.transaction_date DESC`,
      [userId]
    );

    return NextResponse.json({
      user: {
        userId: user.user_id,
        name: user.name,
        address: user.address,
        phone: user.phone,
        grade: user.grade,
        points: user.points,
        profileImage: user.profile_image,
        createdAt: user.created_at,
      },
      sellingProducts: sellingProducts.map((p) => ({
        id: p.product_id,
        title: p.title,
        price: p.price,
        status: p.status,
        createdAt: p.created_at,
        thumbnail: p.thumbnail,
        wishCount: p.wish_count,
      })),
      purchaseHistory: purchaseHistory.map((p) => {
        const transactionDate = new Date(p.transaction_date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = 7 - diffDays;
        const hasReview = p.has_review > 0;
        const canReview = !hasReview && daysLeft > 0;

        return {
          transactionId: p.transaction_id,
          productId: p.product_id,
          title: p.title,
          price: p.price,
          sellerId: p.seller_id,
          sellerName: p.seller_name,
          transactionDate: p.transaction_date,
          thumbnail: p.thumbnail,
          canReview,
          hasReview,
          daysLeft,
        };
      }),
      salesHistory: salesHistory.map((s) => ({
        transactionId: s.transaction_id,
        productId: s.product_id,
        title: s.title,
        price: s.price,
        buyerId: s.buyer_id,
        buyerName: s.buyer_name,
        transactionDate: s.transaction_date,
        thumbnail: s.thumbnail,
      })),
    });
  } catch (error) {
    console.error('마이페이지 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
