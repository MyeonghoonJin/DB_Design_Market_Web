'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ChatRoom {
  roomId: number;
  productId: number;
  productTitle: string;
  productThumbnail: string | null;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat');

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">채팅</h1>
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">채팅</h1>

      {chatRooms.length > 0 ? (
        <div className="bg-white rounded-lg shadow divide-y">
          {chatRooms.map((room) => (
            <Link
              key={room.roomId}
              href={`/chat/${room.roomId}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* 상품 이미지 */}
              <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                {room.productThumbnail ? (
                  <Image
                    src={room.productThumbnail}
                    alt={room.productTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 채팅 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">{room.otherUserName}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(room.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {room.lastMessage || '새로운 대화를 시작하세요'}
                </p>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {room.productTitle}
                </p>
              </div>

              {/* 안읽은 메시지 */}
              {room.unreadCount > 0 && (
                <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                  {room.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>진행 중인 채팅이 없습니다</p>
          <p className="text-sm mt-2">상품에서 채팅하기를 눌러 대화를 시작하세요</p>
        </div>
      )}
    </div>
  );
}
