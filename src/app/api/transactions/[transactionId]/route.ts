import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 거래 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
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

    const { transactionId } = await params;

    const transactions = await query<{
      transaction_id: number;
      seller_id: string;
      buyer_id: string;
      product_id: number;
      transaction_date: Date;
      product_title: string;
      product_price: number;
      product_thumbnail: string | null;
      seller_name: string;
      buyer_name: string;
    }[]>(
      `SELECT
        t.transaction_id,
        t.seller_id,
        t.buyer_id,
        t.product_id,
        t.transaction_date,
        p.title as product_title,
        p.price as product_price,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as product_thumbnail,
        seller.name as seller_name,
        buyer.name as buyer_name
      FROM transactions t
      JOIN products p ON t.product_id = p.product_id
      JOIN users seller ON t.seller_id = seller.user_id
      JOIN users buyer ON t.buyer_id = buyer.user_id
      WHERE t.transaction_id = ?`,
      [transactionId]
    );

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: '거래를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const transaction = transactions[0];

    // 구매자 또는 판매자인지 확인
    if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
      return NextResponse.json(
        { error: '이 거래에 대한 접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 후기가 작성되었는지 확인
    const existingReviews = await query<{ review_id: number }[]>(
      'SELECT review_id FROM reviews WHERE transaction_id = ?',
      [transactionId]
    );

    const hasReview = existingReviews.length > 0;

    // 7일 이내인지 확인
    const transactionDate = new Date(transaction.transaction_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = 7 - diffDays;

    // 구매자만 후기 작성 가능
    const canReview = transaction.buyer_id === userId && !hasReview && daysLeft > 0;

    return NextResponse.json({
      transaction: {
        transactionId: transaction.transaction_id,
        sellerId: transaction.seller_id,
        buyerId: transaction.buyer_id,
        productId: transaction.product_id,
        transactionDate: transaction.transaction_date,
        productTitle: transaction.product_title,
        productPrice: transaction.product_price,
        productThumbnail: transaction.product_thumbnail,
        sellerName: transaction.seller_name,
        buyerName: transaction.buyer_name,
        hasReview,
        canReview,
        daysLeft,
      },
    });
  } catch (error) {
    console.error('거래 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
