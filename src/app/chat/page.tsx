'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChatRooms();
    }
  }, [isAuthenticated]);

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

  if (authLoading || isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">채팅</h1>
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">채팅</h1>
        <p className="text-sm text-gray-500">진행 중인 대화 {chatRooms.length}개</p>
      </div>

      {chatRooms.length > 0 ? (
        <div className="space-y-2">
          {chatRooms.map((room) => (
            <Link
              key={room.roomId}
              href={`/chat/${room.roomId}`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all hover:border-orange-200 group"
            >
              {/* 상품 이미지 */}
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                {room.productThumbnail ? (
                  <Image
                    src={room.productThumbnail}
                    alt={room.productTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 채팅 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {room.otherUserName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatTime(room.lastMessageTime)}
                  </span>
                </div>
                <p className={`text-sm truncate mb-1 ${room.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {room.lastMessage || '새로운 대화를 시작하세요'}
                </p>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-xs text-gray-500 truncate">
                    {room.productTitle}
                  </p>
                </div>
              </div>

              {/* 안읽은 메시지 & 화살표 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {room.unreadCount > 0 && (
                  <span className="min-w-[22px] h-5 px-1.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">진행 중인 채팅이 없습니다</h3>
          <p className="text-sm text-gray-500 mb-5">상품에서 채팅하기를 눌러 대화를 시작하세요</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            상품 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}
