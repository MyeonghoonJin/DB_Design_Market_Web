'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/types';

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  status: 'SALE' | 'RESERVED' | 'SOLD';
  thumbnail: string | null;
  wishCount: number;
  createdAt: string;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // 검색 조건이 바뀌면 초기화
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1);
  }, [selectedCategory, sortBy]);

  const fetchProducts = async (pageNum: number) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== '전체') {
        params.append('category', selectedCategory);
      }
      params.append('sort', sortBy);
      params.append('page', pageNum.toString());

      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();

        if (pageNum === 1) {
          setProducts(data.products || []);
        } else {
          // 중복 제거: 기존 배열에 없는 상품만 추가
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProducts = (data.products || []).filter((p: Product) => !existingIds.has(p.id));
            return [...prev, ...newProducts];
          });
        }

        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('상품 조회 오류:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    fetchProductsWithSearch();
  };

  const fetchProductsWithSearch = async () => {
    setIsLoading(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== '전체') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('sort', sortBy);
      params.append('page', '1');

      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // ID로 중복 제거
        const uniqueProducts = Array.from(
          new Map((data.products || []).map((p: Product) => [p.id, p])).values()
        ) as Product[];
        setProducts(uniqueProducts);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('상품 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 무한 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 하단에서 200px 이내로 도달하면 다음 페이지 로드
      if (scrollTop + windowHeight >= documentHeight - 200) {
        if (hasMore && !isLoading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadingMore, page]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const statusBadge = {
    SALE: { text: '판매중', color: 'bg-green-500' },
    RESERVED: { text: '예약중', color: 'bg-yellow-500' },
    SOLD: { text: '판매완료', color: 'bg-gray-500' },
  };

  return (
    <div className="w-full py-8">
      <div className="max-w-[1920px] mx-auto px-4 flex gap-6">
        {/* 왼쪽 광고 배너 영역 */}
        <aside className="hidden xl:block flex-1">
          <div className="sticky top-40 space-y-4 ml-10">
            <div className="relative h-96 bg-gray-100 rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/배너1.png"
                alt="광고 배너 1"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-72 bg-gray-100 rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/배너2.png"
                alt="광고 배너 2"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="w-full max-w-7xl">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          안전하고 편리한 중고거래
        </h1>
        <p className="text-lg opacity-90 mb-6">
          누구나 쉽게 사고 팔 수 있는 중고마켓에서<br />
          원하는 물건을 찾아보세요
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="어떤 물건을 찾고 계신가요?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            onClick={handleSearch}
            className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            검색하기
          </button>
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">카테고리</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('전체')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === '전체'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            전체
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* 상품 목록 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {selectedCategory === '전체' ? '전체 상품' : selectedCategory}
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
          >
            <option value="latest">최신순</option>
            <option value="price_low">낮은 가격순</option>
            <option value="price_high">높은 가격순</option>
            <option value="popular">인기순</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-500">
            <p>로딩 중...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative aspect-square bg-gray-200">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <span className={`absolute top-1 left-1 ${statusBadge[product.status].color} text-white text-[10px] px-1.5 py-0.5 rounded`}>
                      {statusBadge[product.status].text}
                    </span>
                  </div>
                  <div className="p-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
                    <p className="text-sm font-bold text-orange-500 mt-0.5">
                      {product.price.toLocaleString()}원
                    </p>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span className="truncate">{product.category}</span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span>{product.wishCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>등록된 상품이 없습니다</p>
          </div>
        )}

        {/* 로딩 인디케이터 (추가 로드 중) */}
        {loadingMore && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-orange-500"></div>
          </div>
        )}

        {/* 더 이상 불러올 상품이 없을 때 */}
        {!isLoading && !hasMore && products.length > 0 && (
          <div className="text-center py-8 text-gray-500">
          </div>
        )}
      </section>
        </div>

        {/* 오른쪽 광고 배너 영역 */}
        <aside className="hidden xl:block flex-1">
          <div className="sticky top-40 space-y-4 mr-10">
            <div className="relative h-96 bg-gray-100 rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/배너3.png"
                alt="광고 배너 3"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-84 bg-gray-100 rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/배너4.png"
                alt="광고 배너 4"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
