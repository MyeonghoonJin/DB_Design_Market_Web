'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  userId: string;
  name: string;
  grade: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  profileImage: string | null;
  createdAt: string;
  productCount: number;
}

interface Product {
  productId: number;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  thumbnail: string | null;
}

interface Review {
  reviewId: number;
  transactionId: number;
  score: number;
  content: string;
  createdAt: string;
  productId: number;
  productTitle: string;
  productPrice: number;
  productThumbnail: string | null;
  buyerId: string;
  buyerName: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로필을 불러올 수 없습니다.');
      }

      const data = await response.json();
      setUser(data.user);
      setProducts(data.products);
      setReviews(data.reviews);
      setAvgScore(data.avgScore);
      setReviewCount(data.reviewCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const gradeInfo = {
    BRONZE: { text: '브론즈', color: 'bg-amber-700' },
    SILVER: { text: '실버', color: 'bg-gray-400' },
    GOLD: { text: '골드', color: 'bg-yellow-500' },
    PLATINUM: { text: '플래티넘', color: 'bg-purple-500' },
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{error || '판매자를 찾을 수 없습니다.'}</p>
          <Link href="/" className="text-orange-500 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const currentGrade = gradeInfo[user.grade];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
        <div className="flex items-start gap-6">
          {/* 프로필 이미지 */}
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt={user.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
            <p className="text-gray-500 mb-3">{user.userId}</p>
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-block px-4 py-1.5 ${currentGrade.color} text-white text-sm font-medium rounded-full`}>
                {currentGrade.text} 등급
              </span>
              <span className="text-gray-600">
                판매 중인 상품 {user.productCount}개
              </span>
            </div>
            <p className="text-sm text-gray-500">
              가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        {/* 평균 별점 */}
        {reviewCount > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-3xl font-bold text-orange-500">{avgScore}</span>
                  <span className="text-gray-400 text-lg">/ 5</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">평균 별점</p>
              </div>
              <div className="text-center pl-6 border-l">
                <p className="text-2xl font-bold text-gray-800">{reviewCount}</p>
                <p className="text-sm text-gray-500 mt-1">후기 개수</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'products'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            판매 중인 상품 ({user.productCount})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            받은 후기 ({reviewCount})
          </button>
        </div>
      </div>

      {/* 판매 중인 상품 목록 */}
      {activeTab === 'products' && (
        <div>
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>판매 중인 상품이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.productId}
                  href={`/products/${product.productId}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate mb-2">{product.title}</h3>
                    <p className="text-orange-500 font-bold text-lg">{product.price.toLocaleString()}원</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(product.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 받은 후기 목록 */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p>아직 받은 후기가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.reviewId} className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-4">
                  <Link href={`/products/${review.productId}`}>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {review.productThumbnail ? (
                        <Image
                          src={review.productThumbnail}
                          alt={review.productTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${review.productId}`}>
                      <h3 className="font-medium text-gray-900 truncate hover:text-orange-500">
                        {review.productTitle}
                      </h3>
                    </Link>
                    <p className="text-orange-500 font-bold mt-1">
                      {review.productPrice.toLocaleString()}원
                    </p>
                    <p className="text-sm text-gray-500">
                      구매자: {review.buyerName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-lg font-bold text-orange-500">{review.score}</span>
                      <span className="text-gray-400 text-sm">/ 5</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{review.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
