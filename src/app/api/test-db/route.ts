import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'MySQL 데이터베이스 연결 성공!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'MySQL 데이터베이스 연결 실패'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '연결 오류',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
