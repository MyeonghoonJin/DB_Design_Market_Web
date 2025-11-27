'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    loadSearchHistory();
  }, []);

  // 검색 기록 로드
  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('검색 기록 로드 오류:', error);
    }
  };

  // 검색 기록 저장
  const saveSearchHistory = (keyword: string) => {
    try {
      const trimmedKeyword = keyword.trim();
      if (!trimmedKeyword) return;

      let history = [...searchHistory];

      // 중복 제거
      history = history.filter(item => item !== trimmedKeyword);

      // 최상단에 추가
      history.unshift(trimmedKeyword);

      // 최대 10개까지만 저장
      history = history.slice(0, 10);

      setSearchHistory(history);
      localStorage.setItem('searchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('검색 기록 저장 오류:', error);
    }
  };

  // 검색 기록 삭제
  const deleteSearchItem = (keyword: string) => {
    try {
      const history = searchHistory.filter(item => item !== keyword);
      setSearchHistory(history);
      localStorage.setItem('searchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('검색 기록 삭제 오류:', error);
    }
  };

  // 전체 검색 기록 삭제
  const clearAllHistory = () => {
    try {
      setSearchHistory([]);
      localStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('검색 기록 전체 삭제 오류:', error);
    }
  };

  // 외부 클릭 및 포커스 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    const handleFocusChange = () => {
      // 검색창이 포커스를 잃으면 드롭다운 숨김
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isSearchInput =
          searchRef.current?.contains(activeElement as Node) ||
          mobileSearchRef.current?.contains(activeElement as Node);

        if (!isSearchInput) {
          setShowHistory(false);
        }
      }, 100);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleFocusChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleFocusChange);
    };
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      saveSearchHistory(searchKeyword);
      setShowHistory(false);
      router.push(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const handleHistoryClick = (keyword: string) => {
    setSearchKeyword(keyword);
    setShowHistory(false);
    router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  const isLoggedIn = !!user;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">중고마켓</span>
          </Link>

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div ref={searchRef} className="relative w-full">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => {
                  // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록 함
                  setTimeout(() => setShowHistory(false), 200);
                }}
                placeholder="검색어를 입력하세요"
                className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* 검색 기록 드롭다운 */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <span className="text-xs font-semibold text-gray-500">최근 검색어</span>
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      전체삭제
                    </button>
                  </div>
                  <ul>
                    {searchHistory.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                      >
                        <button
                          type="button"
                          onClick={() => handleHistoryClick(item)}
                          className="flex-1 text-left text-sm text-gray-700 hover:text-orange-500"
                        >
                          <svg className="w-3.5 h-3.5 inline mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSearchItem(item)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* <Link href="/products/new" className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
              상품등록
            </Link> */}
            {isLoading ? (
              // 로딩 중 스켈레톤
              <div className="flex items-center space-x-1">
                <div className="w-12 h-7 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="w-12 h-7 bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            ) : isLoggedIn ? (
              <>
                <Link href="/products/new" className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                  상품등록
                </Link>
                <Link href="/chat" className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium relative">
                  중고톡
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/wishlist" className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                  찜목록
                </Link>
                <Link href="/mypage" className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="ml-1 px-4 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t">
            <form onSubmit={handleSearch} className="mb-3">
              <div ref={mobileSearchRef} className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => {
                    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록 함
                    setTimeout(() => setShowHistory(false), 200);
                  }}
                  placeholder="검색어를 입력하세요"
                  className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />

                {/* 모바일 검색 기록 드롭다운 */}
                {showHistory && searchHistory.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <span className="text-xs font-semibold text-gray-500">최근 검색어</span>
                      <button
                        type="button"
                        onClick={clearAllHistory}
                        className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                      >
                        전체삭제
                      </button>
                    </div>
                    <ul>
                      {searchHistory.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => handleHistoryClick(item)}
                            className="flex-1 text-left text-sm text-gray-700 hover:text-orange-500"
                          >
                            <svg className="w-3.5 h-3.5 inline mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSearchItem(item)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </form>
            <nav className="flex flex-col space-y-1">
              <Link href="/products/new" className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                상품등록
              </Link>
              {isLoading ? (
                // 로딩 중 스켈레톤
                <div className="space-y-1">
                  <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ) : isLoggedIn ? (
                <>
                  <Link href="/chat" className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium flex items-center gap-2">
                    중고톡
                    {unreadCount > 0 && (
                      <span className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/wishlist" className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                    찜목록
                  </Link>
                  <Link href="/mypage" className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium text-left"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
                    로그인
                  </Link>
                  <Link href="/auth/register" className="px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all font-medium">
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
