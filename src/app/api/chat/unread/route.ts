import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 읽지 않은 메시지 총 개수 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // 내가 참여한 채팅방에서 내가 보낸 게 아닌 읽지 않은 메시지 수
    const result = await query<{ unread_count: number }[]>(
      `SELECT COUNT(*) as unread_count
       FROM messages m
       JOIN chat_rooms cr ON m.room_id = cr.room_id
       WHERE (cr.buyer_id = ? OR cr.seller_id = ?)
         AND m.sender_id != ?
         AND m.is_read = FALSE`,
      [userId, userId, userId]
    );

    return NextResponse.json({ unreadCount: result[0]?.unread_count || 0 });
  } catch (error) {
    console.error('읽지 않은 메시지 조회 오류:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
