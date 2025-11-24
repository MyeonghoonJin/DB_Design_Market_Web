import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, password, name, address, phone } = body;

    // 유효성 검사
    if (!id || !password || !name || !address || !phone) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (id.length < 4) {
      return NextResponse.json(
        { error: '아이디는 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 아이디 중복 확인
    const existingUsers = await query<{ user_id: string }[]>(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 등록
    await query(
      `INSERT INTO users (user_id, password, name, address, phone, grade, points)
       VALUES (?, ?, ?, ?, ?, 'BRONZE', 1000)`,
      [id, hashedPassword, name, address, phone]
    );

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', userId: id },
      { status: 201 }
    );
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
