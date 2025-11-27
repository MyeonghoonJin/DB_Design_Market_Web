import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 거래 확정
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
    const sellerId = decoded.userId;

    const body = await request.json();
    const { productId, buyerId } = body;

    if (!productId || !buyerId) {
      return NextResponse.json(
        { error: '상품 ID와 구매자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품 확인 (판매자인지, 상태가 SOLD가 아닌지)
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

    if (products[0].seller_id !== sellerId) {
      return NextResponse.json(
        { error: '본인 상품만 거래 확정할 수 있습니다.' },
        { status: 403 }
      );
    }

    if (products[0].status === 'SOLD') {
      return NextResponse.json(
        { error: '이미 판매완료된 상품입니다.' },
        { status: 400 }
      );
    }

    // 구매자 존재 확인
    const buyers = await query<{ user_id: string }[]>(
      'SELECT user_id FROM users WHERE user_id = ?',
      [buyerId]
    );

    if (buyers.length === 0) {
      return NextResponse.json(
        { error: '구매자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인에게 판매 방지
    if (buyerId === sellerId) {
      return NextResponse.json(
        { error: '본인에게 판매할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 해당 상품에 대한 거래가 있는지 확인
    const existingTransactions = await query<{ transaction_id: number }[]>(
      'SELECT transaction_id FROM transactions WHERE product_id = ?',
      [productId]
    );

    if (existingTransactions.length > 0) {
      return NextResponse.json(
        { error: '이미 거래가 완료된 상품입니다.' },
        { status: 400 }
      );
    }

    // 거래 생성
    const result = await query<{ insertId: number }>(
      'INSERT INTO transactions (seller_id, buyer_id, product_id) VALUES (?, ?, ?)',
      [sellerId, buyerId, productId]
    );
    const transactionId = (result as unknown as { insertId: number }).insertId;

    // 상품 상태를 SOLD로 변경
    await query(
      'UPDATE products SET status = ? WHERE product_id = ?',
      ['SOLD', productId]
    );

    return NextResponse.json({
      success: true,
      transactionId,
      message: '거래가 확정되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('거래 확정 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 거래 내역 조회 (판매/구매 내역)
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
    const type = searchParams.get('type') || 'all'; // 'sell', 'buy', 'all'

    let whereClause = '';
    const params: string[] = [];

    if (type === 'sell') {
      whereClause = 'WHERE t.seller_id = ?';
      params.push(userId);
    } else if (type === 'buy') {
      whereClause = 'WHERE t.buyer_id = ?';
      params.push(userId);
    } else {
      whereClause = 'WHERE t.seller_id = ? OR t.buyer_id = ?';
      params.push(userId, userId);
    }

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
      has_review: number;
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
        buyer.name as buyer_name,
        (SELECT COUNT(*) FROM reviews WHERE transaction_id = t.transaction_id) as has_review
      FROM transactions t
      JOIN products p ON t.product_id = p.product_id
      JOIN users seller ON t.seller_id = seller.user_id
      JOIN users buyer ON t.buyer_id = buyer.user_id
      ${whereClause}
      ORDER BY t.transaction_date DESC`,
      params
    );

    const formattedTransactions = transactions.map((t) => {
      const transactionDate = new Date(t.transaction_date);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = 7 - diffDays;
      const canReview = t.buyer_id === userId && t.has_review === 0 && daysLeft > 0;

      return {
        transactionId: t.transaction_id,
        sellerId: t.seller_id,
        buyerId: t.buyer_id,
        productId: t.product_id,
        transactionDate: t.transaction_date,
        productTitle: t.product_title,
        productPrice: t.product_price,
        productThumbnail: t.product_thumbnail,
        sellerName: t.seller_name,
        buyerName: t.buyer_name,
        hasReview: t.has_review > 0,
        isSeller: t.seller_id === userId,
        canReview,
        daysLeft,
      };
    });

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('거래 내역 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
