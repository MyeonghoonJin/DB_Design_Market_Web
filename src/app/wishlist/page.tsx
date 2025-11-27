'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface WishlistItem {
  wishlistId: number;
  productId: number;
  title: string;
  price: number;
  status: 'SALE' | 'RESERVED' | 'SOLD';
  category: string;
  thumbnail: string | null;
  sellerName: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlists();
    }
  }, [isAuthenticated]);

  const fetchWishlists = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setWishlists(data.wishlists);
      }
    } catch (err) {
      console.error('찜 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWishlist = async (productId: number) => {
    if (!confirm('찜 목록에서 삭제하시겠습니까?')) return;

    setRemovingId(productId);
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWishlists((prev) => prev.filter((item) => item.productId !== productId));
      } else {
        const data = await response.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('찜 삭제 오류:', err);
      alert('삭제에 실패했습니다.');
    } finally {
      setRemovingId(null);
    }
  };

  const statusBadge = {
    SALE: { text: '판매중', color: 'bg-green-500' },
    RESERVED: { text: '예약중', color: 'bg-yellow-500' },
    SOLD: { text: '판매완료', color: 'bg-gray-500' },
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">찜 목록</h1>
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">찜 목록</h1>

      {wishlists.length > 0 ? (
        <>
          <p className="text-gray-600 mb-4">총 {wishlists.length}개의 상품</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlists.map((item) => (
              <div key={item.wishlistId} className="bg-white rounded-lg shadow-sm overflow-hidden border hover:shadow-md transition-shadow">
                <Link href={`/products/${item.productId}`}>
                  <div className="aspect-square bg-gray-100 relative">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {item.status !== 'SALE' && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className={`${statusBadge[item.status].color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                          {statusBadge[item.status].text}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                    <p className="text-orange-500 font-bold mt-1">{item.price.toLocaleString()}원</p>
                    <p className="text-xs text-gray-500 mt-1">{item.sellerName}</p>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <button
                    onClick={() => handleRemoveWishlist(item.productId)}
                    disabled={removingId === item.productId}
                    className="w-full py-2 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {removingId === item.productId ? '삭제 중...' : '찜 해제'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p>찜한 상품이 없습니다</p>
          <p className="text-sm mt-2">관심있는 상품을 찜해보세요!</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            상품 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}
