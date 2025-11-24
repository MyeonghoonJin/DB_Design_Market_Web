import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 메시지 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const roomIdNum = parseInt(roomId);

    if (isNaN(roomIdNum)) {
      return NextResponse.json(
        { error: '유효하지 않은 채팅방 ID입니다.' },
        { status: 400 }
      );
    }

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // 채팅방 참여자인지 확인
    const rooms = await query<{ buyer_id: string; seller_id: string }[]>(
      'SELECT buyer_id, seller_id FROM chat_rooms WHERE room_id = ?',
      [roomIdNum]
    );

    if (rooms.length === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const room = rooms[0];
    if (room.buyer_id !== userId && room.seller_id !== userId) {
      return NextResponse.json(
        { error: '이 채팅방에 접근할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 메시지 조회
    const messages = await query<{
      message_id: number;
      sender_id: string;
      content: string;
      is_read: boolean;
      sent_at: Date;
      sender_name: string;
    }[]>(
      `SELECT
        m.message_id,
        m.sender_id,
        m.content,
        m.is_read,
        m.sent_at,
        u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.room_id = ?
      ORDER BY m.sent_at ASC`,
      [roomIdNum]
    );

    // 읽음 처리
    await query(
      'UPDATE messages SET is_read = TRUE WHERE room_id = ? AND sender_id != ?',
      [roomIdNum, userId]
    );

    const formattedMessages = messages.map((m) => ({
      messageId: m.message_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      content: m.content,
      isRead: m.is_read,
      sentAt: m.sent_at,
      isMine: m.sender_id === userId,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 메시지 전송
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const roomIdNum = parseInt(roomId);

    if (isNaN(roomIdNum)) {
      return NextResponse.json(
        { error: '유효하지 않은 채팅방 ID입니다.' },
        { status: 400 }
      );
    }

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // 채팅방 참여자인지 확인
    const rooms = await query<{ buyer_id: string; seller_id: string }[]>(
      'SELECT buyer_id, seller_id FROM chat_rooms WHERE room_id = ?',
      [roomIdNum]
    );

    if (rooms.length === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const room = rooms[0];
    if (room.buyer_id !== userId && room.seller_id !== userId) {
      return NextResponse.json(
        { error: '이 채팅방에 접근할 수 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: '메시지 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 메시지 저장
    const result = await query<{ insertId: number }>(
      'INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?)',
      [roomIdNum, userId, content.trim()]
    );

    const messageId = (result as unknown as { insertId: number }).insertId;

    // 사용자 이름 조회
    const users = await query<{ name: string }[]>(
      'SELECT name FROM users WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      message: {
        messageId,
        senderId: userId,
        senderName: users[0]?.name || '',
        content: content.trim(),
        isRead: false,
        sentAt: new Date(),
        isMine: true,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
