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
    const includeSold = searchParams.get('includeSold') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 40; // 페이지당 40개
    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    const conditions: string[] = ['1=1'];
    const whereParams: unknown[] = [];

    // 메인 페이지에서는 판매완료 상품 제외 (includeSold가 false이거나 없을 때)
    if (!includeSold) {
      conditions.push('p.status != ?');
      whereParams.push('SOLD');
    }

    if (category && category !== 'all') {
      conditions.push('p.category = ?');
      whereParams.push(category);
    }

    if (search) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ?)');
      whereParams.push(`%${search}%`, `%${search}%`);
    }

    if (sellerId) {
      conditions.push('p.seller_id = ?');
      whereParams.push(sellerId);
    }

    // 정렬 조건
    let orderBy = 'p.created_at DESC';
    switch (sort) {
      case 'price_low':
        orderBy = 'p.price ASC';
        break;
      case 'price_high':
        orderBy = 'p.price DESC';
        break;
      case 'popular':
        orderBy = 'wish_count DESC';
        break;
    }

    // 전체 개수 조회
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await query<{ total: number }[]>(countSql, whereParams);
    const total = countResult[0].total;

    // 상품 조회 (페이지네이션 적용)
    const sql = `
      SELECT
        p.product_id,
        p.title,
        p.price,
        p.category,
        p.status,
        p.created_at,
        pi.url as thumbnail,
        (SELECT COUNT(*) FROM wishlists WHERE product_id = p.product_id) as wish_count
      FROM products p
      LEFT JOIN (
        SELECT product_id, url,
               ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY image_id) as rn
        FROM product_images
      ) pi ON p.product_id = pi.product_id AND pi.rn = 1
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const results = await query<{
      product_id: number;
      title: string;
      price: number;
      category: string;
      status: string;
      created_at: Date;
      thumbnail: string | null;
      wish_count: number;
    }[]>(sql, whereParams);

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

    return NextResponse.json({
      products,
      total,
      page,
      hasMore: offset + products.length < total,
    });
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
