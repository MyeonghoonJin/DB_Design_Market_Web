import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { CATEGORIES } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 상품 등록
export async function POST(request: NextRequest) {
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
    const sellerId = decoded.userId;

    // 등록 상품 수 제한 확인 (최대 10개)
    const existingProducts = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status != "SOLD"',
      [sellerId]
    );

    if (existingProducts[0].count >= 10) {
      return NextResponse.json(
        { error: '최대 10개의 물품만 등록할 수 있습니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, price, category, description, images } = body;

    // 유효성 검사
    if (!title || !price || !category || !description) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 카테고리 유효성 검사
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    // 상품 등록
    const result = await query<{ insertId: number }>(
      `INSERT INTO products (seller_id, title, price, description, category, status)
       VALUES (?, ?, ?, ?, ?, 'SALE')`,
      [sellerId, title, Number(price), description, category]
    );

    const productId = (result as unknown as { insertId: number }).insertId;

    // 이미지 등록
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        await query(
          'INSERT INTO product_images (product_id, url) VALUES (?, ?)',
          [productId, imageUrl]
        );
      }
    }

    return NextResponse.json(
      { message: '상품이 등록되었습니다.', productId },
      { status: 201 }
    );
  } catch (error) {
    console.error('상품 등록 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'latest';
    const sellerId = searchParams.get('sellerId');

    let sql = `
      SELECT
        p.product_id,
        p.title,
        p.price,
        p.category,
        p.status,
        p.created_at,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as thumbnail,
        (SELECT COUNT(*) FROM wishlists WHERE product_id = p.product_id) as wish_count
      FROM products p
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (category && category !== 'all') {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sellerId) {
      sql += ' AND p.seller_id = ?';
      params.push(sellerId);
    }

    // 정렬
    switch (sort) {
      case 'price_low':
        sql += ' ORDER BY p.price ASC';
        break;
      case 'price_high':
        sql += ' ORDER BY p.price DESC';
        break;
      case 'popular':
        sql += ' ORDER BY wish_count DESC';
        break;
      default:
        sql += ' ORDER BY p.created_at DESC';
    }

    const results = await query<{
      product_id: number;
      title: string;
      price: number;
      category: string;
      status: string;
      created_at: Date;
      thumbnail: string | null;
      wish_count: number;
    }[]>(sql, params);

    const products = results.map((p) => ({
      id: p.product_id,
      title: p.title,
      price: p.price,
      category: p.category,
      status: p.status,
      createdAt: p.created_at,
      thumbnail: p.thumbnail,
      wishCount: p.wish_count,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
