import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 상품 검색
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'relevance'; // relevance, latest, price_low, price_high
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 40; // 페이지당 40개
    const offset = (page - 1) * limit;

    // 검색 조건 구성
    const conditions: string[] = ["status = 'SALE'"];
    const whereParams: any[] = [];

    if (keyword) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      whereParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      conditions.push('category = ?');
      whereParams.push(category);
    }

    // 정렬 조건
    let orderBy = 'p.created_at DESC'; // 기본값 (최신순)
    const orderParams: any[] = [];

    if (sort === 'relevance' && keyword) {
      // 정확도순: 완전 일치 > 시작 일치 > 제목 포함 > 설명 포함
      orderBy = `
        CASE
          WHEN p.title = ? THEN 1
          WHEN p.title LIKE ? THEN 2
          WHEN p.title LIKE ? THEN 3
          WHEN p.description LIKE ? THEN 4
          ELSE 5
        END,
        p.created_at DESC
      `;
      orderParams.push(
        keyword,           // 완전 일치
        `${keyword}%`,     // 시작 일치
        `%${keyword}%`,    // 제목 포함
        `%${keyword}%`     // 설명 포함
      );
    } else if (sort === 'price_low') {
      orderBy = 'p.price ASC';
    } else if (sort === 'price_high') {
      orderBy = 'p.price DESC';
    }

    // 전체 개수 조회
    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total
      FROM products p
      WHERE ${conditions.join(' AND ')}`,
      whereParams
    );
    const total = countResult[0].total;

    // 상품 조회 (페이지네이션 적용)
    const queryParams = [...whereParams, ...orderParams, limit, offset];
    console.log('Query params:', queryParams);
    console.log('Where params:', whereParams);
    console.log('Order params:', orderParams);
    console.log('Limit:', limit, 'Offset:', offset);

    const sqlQuery = `
      SELECT
        p.product_id, p.title, p.price, p.category, p.status, p.created_at,
        p.seller_id, u.name as seller_name,
        pi.url as thumbnail
      FROM products p
      JOIN users u ON p.seller_id = u.user_id
      LEFT JOIN (
        SELECT product_id, url,
               ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY image_id) as rn
        FROM product_images
      ) pi ON p.product_id = pi.product_id AND pi.rn = 1
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log('Final SQL:', sqlQuery);
    console.log('Final params:', whereParams.concat(orderParams));

    const products = await query<{
      product_id: number;
      title: string;
      price: number;
      category: string;
      status: string;
      created_at: Date;
      seller_id: string;
      seller_name: string;
      thumbnail: string | null;
    }[]>(
      sqlQuery,
      whereParams.concat(orderParams)
    );

    return NextResponse.json({
      products: products.map((p) => ({
        productId: p.product_id,
        title: p.title,
        price: p.price,
        category: p.category,
        status: p.status,
        createdAt: p.created_at,
        sellerId: p.seller_id,
        sellerName: p.seller_name,
        thumbnail: p.thumbnail,
      })),
      total,
      page,
      hasMore: offset + products.length < total,
    });
  } catch (error) {
    console.error('검색 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
