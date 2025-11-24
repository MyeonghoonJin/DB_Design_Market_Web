import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      name: string;
      grade: string;
    };

    // 최신 사용자 정보 조회
    const users = await query<{
      user_id: string;
      name: string;
      address: string;
      phone: string;
      grade: string;
      points: number;
      created_at: Date;
    }[]>(
      'SELECT user_id, name, address, phone, grade, points, created_at FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      user: {
        userId: user.user_id,
        name: user.name,
        address: user.address,
        phone: user.phone,
        grade: user.grade,
        points: user.points,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('인증 확인 오류:', error);
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 401 }
    );
  }
}
