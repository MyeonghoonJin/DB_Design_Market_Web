import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 찜 목록 조회
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

    const wishlists = await query<{
      wishlist_id: number;
      product_id: number;
      title: string;
      price: number;
      status: string;
      category: string;
      thumbnail: string | null;
      seller_name: string;
    }[]>(
      `SELECT
        w.wishlist_id,
        p.product_id,
        p.title,
        p.price,
        p.status,
        p.category,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as thumbnail,
        u.name as seller_name
      FROM wishlists w
      JOIN products p ON w.product_id = p.product_id
      JOIN users u ON p.seller_id = u.user_id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC`,
      [userId]
    );

    const items = wishlists.map((w) => ({
      wishlistId: w.wishlist_id,
      productId: w.product_id,
      title: w.title,
      price: w.price,
      status: w.status,
      category: w.category,
      thumbnail: w.thumbnail,
      sellerName: w.seller_name,
    }));

    return NextResponse.json({ wishlists: items });
  } catch (error) {
    console.error('찜 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 찜 추가
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품 존재 여부 확인
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

    // 본인 상품은 찜할 수 없음
    if (products[0].seller_id === userId) {
      return NextResponse.json(
        { error: '본인의 상품은 찜할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 찜한 상품인지 확인
    const existing = await query<{ wishlist_id: number }[]>(
      'SELECT wishlist_id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: '이미 찜한 상품입니다.' },
        { status: 400 }
      );
    }

    // 찜 추가
    await query(
      'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );

    return NextResponse.json(
      { message: '찜 목록에 추가되었습니다.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('찜 추가 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 찜 삭제
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
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 찜 삭제
    await query(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    return NextResponse.json({ message: '찜이 해제되었습니다.' });
  } catch (error) {
    console.error('찜 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
