import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, password } = body;

    // 유효성 검사
    if (!id || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const users = await query<{
      user_id: string;
      password: string;
      name: string;
      grade: string;
      points: number;
    }[]>(
      'SELECT user_id, password, name, grade, points FROM users WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.user_id,
        name: user.name,
        grade: user.grade,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 응답에 쿠키 설정
    const response = NextResponse.json({
      message: '로그인 성공',
      user: {
        userId: user.user_id,
        name: user.name,
        grade: user.grade,
        points: user.points,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
