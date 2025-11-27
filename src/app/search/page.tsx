'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  productId: number;
  title: string;
  price: number;
  category: string;
  status: string;
  createdAt: string;
  sellerId: string;
  sellerName: string;
  thumbnail: string | null;
}

const categories = [
  { value: '', label: '전체' },
  { value: '전자기기', label: '전자기기' },
  { value: '의류', label: '의류' },
  { value: '가구/인테리어', label: '가구/인테리어' },
  { value: '생활용품', label: '생활용품' },
  { value: '스포츠/레저', label: '스포츠/레저' },
  { value: '도서/티켓/문구', label: '도서/티켓/문구' },
  { value: '뷰티/미용', label: '뷰티/미용' },
  { value: '반려동물용품', label: '반려동물용품' },
  { value: '기타', label: '기타' },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('relevance');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [keyword, category, sort]);

  const fetchProducts = async (pageNum: number) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      params.append('page', pageNum.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (pageNum === 1) {
        setProducts(data.products || []);
      } else {
        setProducts(prev => [...prev, ...(data.products || [])]);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 무한 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      // 페이지 하단에 도달했는지 확인
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 하단에서 200px 이내로 도달하면 다음 페이지 로드
      if (scrollTop + windowHeight >= documentHeight - 200) {
        if (hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadingMore, page]);

  const resetFilters = () => {
    setCategory('');
    setSort('relevance');
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
      {/* 검색 결과 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {keyword ? `"${keyword}" 검색 결과` : '전체 상품'}
        </h1>
        <p className="text-gray-500">
          총 {total}개의 상품
        </p>
      </div>

      {/* 필터 영역 */}
      <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-end flex-wrap gap-4">
          {/* 카테고리 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-gray-400"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              정렬
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-gray-400"
            >
              <option value="relevance">정확도순</option>
              <option value="latest">최신순</option>
              <option value="price_low">가격 낮은순</option>
              <option value="price_high">가격 높은순</option>
            </select>
          </div>

          {/* 초기화 버튼 */}
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 mb-2">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-400">다른 검색어를 입력해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {products.map((product) => (
            <Link
              key={product.productId}
              href={`/products/${product.productId}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
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
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {product.title}
                </h3>
                <p className="text-sm font-bold text-orange-500 mt-0.5">
                  {product.price.toLocaleString()}원
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span className="truncate">{product.category}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(product.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 로딩 인디케이터 (추가 로드 중) */}
      {loadingMore && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-orange-500"></div>
          {/* <p className="text-gray-500 mt-2">더 많은 상품을 불러오는 중...</p> */}
        </div>
      )}

      {/* 더 이상 불러올 상품이 없을 때 */}
      {!loading && !hasMore && products.length > 0 && (
        <div className="text-center py-8 text-gray-500">
        </div>
      )}
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
            <div className="relative h-72 bg-gray-100 rounded-xl shadow-lg overflow-hidden">
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16 text-gray-500">로딩 중...</div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
