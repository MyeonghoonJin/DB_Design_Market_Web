import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 채팅방 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const rooms = await query<{
      room_id: number;
      product_id: number;
      buyer_id: string;
      seller_id: string;
      created_at: Date;
      product_title: string;
      product_thumbnail: string | null;
      other_user_id: string;
      other_user_name: string;
      last_message: string | null;
      last_message_type: string | null;
      last_message_time: Date | null;
      unread_count: number;
    }[]>(
      `SELECT
        cr.room_id,
        cr.product_id,
        cr.buyer_id,
        cr.seller_id,
        cr.created_at,
        p.title as product_title,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as product_thumbnail,
        CASE WHEN cr.buyer_id = ? THEN cr.seller_id ELSE cr.buyer_id END as other_user_id,
        CASE WHEN cr.buyer_id = ? THEN seller.name ELSE buyer.name END as other_user_name,
        (SELECT content FROM messages WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT message_type FROM messages WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message_type,
        (SELECT sent_at FROM messages WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE room_id = cr.room_id AND sender_id != ? AND is_read = FALSE) as unread_count
      FROM chat_rooms cr
      JOIN products p ON cr.product_id = p.product_id
      JOIN users buyer ON cr.buyer_id = buyer.user_id
      JOIN users seller ON cr.seller_id = seller.user_id
      WHERE cr.buyer_id = ? OR cr.seller_id = ?
      ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId]
    );

    const chatRooms = rooms.map((r) => {
      let lastMessage = r.last_message;

      // SYSTEM 메시지인 경우 JSON 파싱해서 메시지 추출
      if (r.last_message_type === 'SYSTEM' && r.last_message) {
        try {
          const systemData = JSON.parse(r.last_message);
          if (systemData.message) {
            lastMessage = systemData.message;
          }
        } catch {
          // 파싱 실패 시 원본 메시지 유지
        }
      }

      return {
        roomId: r.room_id,
        productId: r.product_id,
        productTitle: r.product_title,
        productThumbnail: r.product_thumbnail,
        otherUserId: r.other_user_id,
        otherUserName: r.other_user_name,
        lastMessage,
        lastMessageTime: r.last_message_time,
        unreadCount: r.unread_count,
      };
    });

    return NextResponse.json({ chatRooms });
  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 채팅방 생성 (첫 메시지와 함께)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const buyerId = decoded.userId;

    const body = await request.json();
    const { productId, firstMessage } = body;

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!firstMessage || firstMessage.trim() === '') {
      return NextResponse.json(
        { error: '첫 메시지를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 상품 정보 조회
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

    const sellerId = products[0].seller_id;

    // 본인 상품에는 채팅 불가
    if (sellerId === buyerId) {
      return NextResponse.json(
        { error: '본인 상품에는 채팅할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 기존 채팅방 확인
    const existingRooms = await query<{ room_id: number }[]>(
      'SELECT room_id FROM chat_rooms WHERE product_id = ? AND buyer_id = ? AND seller_id = ?',
      [productId, buyerId, sellerId]
    );

    let roomId: number;

    if (existingRooms.length > 0) {
      // 기존 채팅방이 있으면 메시지만 추가
      roomId = existingRooms[0].room_id;
    } else {
      // 새 채팅방 생성
      const result = await query<{ insertId: number }>(
        'INSERT INTO chat_rooms (product_id, buyer_id, seller_id) VALUES (?, ?, ?)',
        [productId, buyerId, sellerId]
      );
      roomId = (result as unknown as { insertId: number }).insertId;
    }

    // 첫 메시지 저장
    await query(
      'INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?)',
      [roomId, buyerId, firstMessage.trim()]
    );

    return NextResponse.json({ roomId }, { status: 201 });
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
