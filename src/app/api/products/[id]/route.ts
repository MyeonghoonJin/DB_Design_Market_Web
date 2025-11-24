import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: '유효하지 않은 상품 ID입니다.' },
        { status: 400 }
      );
    }

    // 상품 정보 조회
    const products = await query<{
      product_id: number;
      seller_id: string;
      title: string;
      price: number;
      description: string;
      category: string;
      status: string;
      created_at: Date;
      seller_name: string;
      seller_grade: string;
    }[]>(
      `SELECT
        p.product_id, p.seller_id, p.title, p.price, p.description, p.category, p.status, p.created_at,
        u.name as seller_name, u.grade as seller_grade
      FROM products p
      JOIN users u ON p.seller_id = u.user_id
      WHERE p.product_id = ?`,
      [productId]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const product = products[0];

    // 상품 이미지 조회
    const images = await query<{ image_id: number; url: string }[]>(
      'SELECT image_id, url FROM product_images WHERE product_id = ? ORDER BY image_id',
      [productId]
    );

    // 찜 개수 조회
    const wishCountResult = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM wishlists WHERE product_id = ?',
      [productId]
    );
    const wishCount = wishCountResult[0]?.count || 0;

    // 현재 로그인한 사용자 확인
    let currentUserId: string | null = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        currentUserId = decoded.userId;
      } catch {
        // 토큰이 유효하지 않으면 무시
      }
    }

    const isOwner = currentUserId === product.seller_id;

    // 현재 사용자가 찜했는지 확인
    let isWished = false;
    if (currentUserId && !isOwner) {
      const wishCheck = await query<{ wishlist_id: number }[]>(
        'SELECT wishlist_id FROM wishlists WHERE user_id = ? AND product_id = ?',
        [currentUserId, productId]
      );
      isWished = wishCheck.length > 0;
    }

    return NextResponse.json({
      product: {
        id: product.product_id,
        sellerId: product.seller_id,
        sellerName: product.seller_name,
        sellerGrade: product.seller_grade,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        status: product.status,
        createdAt: product.created_at,
        images: images.map(img => ({ id: img.image_id, url: img.url })),
        wishCount,
      },
      isOwner,
      isWished,
    });
  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상품 수정 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: '유효하지 않은 상품 ID입니다.' },
        { status: 400 }
      );
    }

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

    // 상품 소유자 확인
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

    if (products[0].seller_id !== userId) {
      return NextResponse.json(
        { error: '본인의 상품만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, price, description, category, status } = body;

    // 수정할 필드들 구성
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }

    values.push(productId);
    await query(
      `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`,
      values
    );

    return NextResponse.json({ message: '상품이 수정되었습니다.' });
  } catch (error) {
    console.error('상품 수정 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상품 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: '유효하지 않은 상품 ID입니다.' },
        { status: 400 }
      );
    }

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

    // 상품 소유자 확인
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

    if (products[0].seller_id !== userId) {
      return NextResponse.json(
        { error: '본인의 상품만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 관련 이미지 삭제
    await query('DELETE FROM product_images WHERE product_id = ?', [productId]);

    // 관련 찜 삭제
    await query('DELETE FROM wishlists WHERE product_id = ?', [productId]);

    // 상품 삭제
    await query('DELETE FROM products WHERE product_id = ?', [productId]);

    return NextResponse.json({ message: '상품이 삭제되었습니다.' });
  } catch (error) {
    console.error('상품 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
