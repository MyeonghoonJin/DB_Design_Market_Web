import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 등급별 적립금 비율 (%)
const GRADE_POINTS_RATE: Record<string, number> = {
  BRONZE: 2.5,
  SILVER: 5.0,
  GOLD: 7.5,
  PLATINUM: 10.0,
};

// 후기 작성
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
    const userId = decoded.userId;

    const body = await request.json();
    const { transactionId, score, content } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: '거래 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (score === undefined || score < 1 || score > 5 || !Number.isInteger(score)) {
      return NextResponse.json(
        { error: '점수는 1~5 사이의 정수여야 합니다.' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: '후기 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 거래 정보 조회
    const transactions = await query<{
      transaction_id: number;
      buyer_id: string;
      seller_id: string;
      product_id: number;
      transaction_date: Date;
      product_price: number;
    }[]>(
      `SELECT t.transaction_id, t.buyer_id, t.seller_id, t.product_id, t.transaction_date, p.price as product_price
       FROM transactions t
       JOIN products p ON t.product_id = p.product_id
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

    // 구매자 확인
    if (transaction.buyer_id !== userId) {
      return NextResponse.json(
        { error: '구매자만 후기를 작성할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 7일 이내 확인
    const transactionDate = new Date(transaction.transaction_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return NextResponse.json(
        { error: '후기는 거래 성사 후 7일 이내에만 작성할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 이미 후기가 있는지 확인
    const existingReviews = await query<{ review_id: number }[]>(
      'SELECT review_id FROM reviews WHERE transaction_id = ?',
      [transactionId]
    );

    if (existingReviews.length > 0) {
      return NextResponse.json(
        { error: '이미 후기를 작성하셨습니다.' },
        { status: 400 }
      );
    }

    // 사용자 등급 조회
    const users = await query<{ grade: string; points: number }[]>(
      'SELECT grade, points FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = users[0];
    const pointsRate = GRADE_POINTS_RATE[user.grade] || 2.5;
    const earnedPoints = Math.floor(transaction.product_price * (pointsRate / 100));

    // 후기 작성
    await query(
      'INSERT INTO reviews (transaction_id, buyer_id, score, content) VALUES (?, ?, ?, ?)',
      [transactionId, userId, score, content.trim()]
    );

    // 적립금 지급
    await query(
      'UPDATE users SET points = points + ? WHERE user_id = ?',
      [earnedPoints, userId]
    );

    return NextResponse.json({
      success: true,
      message: '후기가 작성되었습니다.',
      earnedPoints,
    }, { status: 201 });
  } catch (error) {
    console.error('후기 작성 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 내 후기 목록 조회
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
      seller_id: string;
      seller_name: string;
    }[]>(
      `SELECT
        r.review_id,
        r.transaction_id,
        r.score,
        r.content,
        r.created_at,
        t.product_id,
        p.title as product_title,
        p.price as product_price,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as product_thumbnail,
        t.seller_id,
        u.name as seller_name
      FROM reviews r
      JOIN transactions t ON r.transaction_id = t.transaction_id
      JOIN products p ON t.product_id = p.product_id
      JOIN users u ON t.seller_id = u.user_id
      WHERE r.buyer_id = ?
      ORDER BY r.created_at DESC`,
      [userId]
    );

    const formattedReviews = reviews.map((r) => ({
      reviewId: r.review_id,
      transactionId: r.transaction_id,
      score: r.score,
      content: r.content,
      createdAt: r.created_at,
      productId: r.product_id,
      productTitle: r.product_title,
      productPrice: r.product_price,
      productThumbnail: r.product_thumbnail,
      sellerId: r.seller_id,
      sellerName: r.seller_name,
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('후기 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
