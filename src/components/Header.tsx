'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  userId: string;
  name: string;
  grade: string;
  points: number;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  // 읽지 않은 메시지 수 조회
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // 10초마다 갱신
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/chat/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('읽지 않은 메시지 조회 오류:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('인증 확인 오류:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const isLoggedIn = !!user;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-orange-500">중고마켓</span>
          </Link>

          {/* 검색바 */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/products/new" className="text-gray-600 hover:text-orange-500 font-medium">
              상품등록
            </Link>
            {isLoading ? (
              // 로딩 중 스켈레톤
              <div className="flex items-center space-x-6">
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isLoggedIn ? (
              <>
                <Link href="/chat" className="text-gray-600 hover:text-orange-500 font-medium relative">
                  채팅
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/wishlist" className="text-gray-600 hover:text-orange-500 font-medium">
                  찜목록
                </Link>
                <Link href="/mypage" className="text-gray-600 hover:text-orange-500 font-medium">
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-orange-500 font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-orange-500 font-medium">
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="mb-4">
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <nav className="flex flex-col space-y-3">
              <Link href="/products/new" className="text-gray-600 hover:text-orange-500 font-medium">
                상품등록
              </Link>
              {isLoading ? (
                // 로딩 중 스켈레톤
                <div className="space-y-3">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : isLoggedIn ? (
                <>
                  <Link href="/chat" className="text-gray-600 hover:text-orange-500 font-medium flex items-center gap-2">
                    채팅
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/wishlist" className="text-gray-600 hover:text-orange-500 font-medium">
                    찜목록
                  </Link>
                  <Link href="/mypage" className="text-gray-600 hover:text-orange-500 font-medium">
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-orange-500 font-medium text-left"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-600 hover:text-orange-500 font-medium">
                    로그인
                  </Link>
                  <Link href="/auth/register" className="text-gray-600 hover:text-orange-500 font-medium">
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
