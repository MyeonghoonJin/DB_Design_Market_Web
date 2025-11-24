import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 채팅방 상세 정보 조회
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

    // 채팅방 정보 조회
    const rooms = await query<{
      room_id: number;
      product_id: number;
      buyer_id: string;
      seller_id: string;
      product_title: string;
      product_price: number;
      product_status: string;
      product_thumbnail: string | null;
      buyer_name: string;
      seller_name: string;
    }[]>(
      `SELECT
        cr.room_id,
        cr.product_id,
        cr.buyer_id,
        cr.seller_id,
        p.title as product_title,
        p.price as product_price,
        p.status as product_status,
        (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY image_id LIMIT 1) as product_thumbnail,
        buyer.name as buyer_name,
        seller.name as seller_name
      FROM chat_rooms cr
      JOIN products p ON cr.product_id = p.product_id
      JOIN users buyer ON cr.buyer_id = buyer.user_id
      JOIN users seller ON cr.seller_id = seller.user_id
      WHERE cr.room_id = ?`,
      [roomIdNum]
    );

    if (rooms.length === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const room = rooms[0];

    // 채팅방 참여자인지 확인
    if (room.buyer_id !== userId && room.seller_id !== userId) {
      return NextResponse.json(
        { error: '이 채팅방에 접근할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 메시지 읽음 처리
    await query(
      'UPDATE messages SET is_read = TRUE WHERE room_id = ? AND sender_id != ?',
      [roomIdNum, userId]
    );

    return NextResponse.json({
      room: {
        roomId: room.room_id,
        productId: room.product_id,
        productTitle: room.product_title,
        productPrice: room.product_price,
        productStatus: room.product_status,
        productThumbnail: room.product_thumbnail,
        buyerId: room.buyer_id,
        sellerId: room.seller_id,
        buyerName: room.buyer_name,
        sellerName: room.seller_name,
        isBuyer: room.buyer_id === userId,
      },
    });
  } catch (error) {
    console.error('채팅방 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 채팅방 나가기
export async function DELETE(
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

    // 채팅방 확인
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

    // 채팅방 참여자인지 확인
    if (room.buyer_id !== userId && room.seller_id !== userId) {
      return NextResponse.json(
        { error: '이 채팅방에 접근할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 채팅방 삭제 (관련 메시지도 CASCADE로 삭제됨)
    await query('DELETE FROM chat_rooms WHERE room_id = ?', [roomIdNum]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('채팅방 나가기 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
