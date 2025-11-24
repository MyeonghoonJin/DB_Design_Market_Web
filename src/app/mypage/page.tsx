'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  userId: string;
  name: string;
  address: string;
  phone: string;
  grade: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points: number;
  createdAt: string;
}

interface SellingProduct {
  id: number;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  thumbnail: string | null;
  wishCount: number;
}

interface PurchaseHistory {
  transactionId: number;
  productId: number;
  title: string;
  price: number;
  sellerId: string;
  sellerName: string;
  transactionDate: string;
  thumbnail: string | null;
}

interface SalesHistory {
  transactionId: number;
  productId: number;
  title: string;
  price: number;
  buyerId: string;
  buyerName: string;
  transactionDate: string;
  thumbnail: string | null;
}

interface WishlistItem {
  wishlistId: number;
  productId: number;
  title: string;
  price: number;
  status: string;
  category: string;
  thumbnail: string | null;
  sellerName: string;
}

type TabType = 'selling' | 'wishlist' | 'purchase' | 'sales' | 'info';

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('selling');
  const [user, setUser] = useState<User | null>(null);
  const [sellingProducts, setSellingProducts] = useState<SellingProduct[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesHistory[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyPageData();
  }, []);

  const fetchMyPageData = async () => {
    try {
      const response = await fetch('/api/mypage');

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setUser(data.user);
      setSellingProducts(data.sellingProducts);
      setPurchaseHistory(data.purchaseHistory);
      setSalesHistory(data.salesHistory);

      // 찜 목록 조회
      const wishlistResponse = await fetch('/api/wishlist');
      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        setWishlist(wishlistData.wishlists);
      }
    } catch (err) {
      console.error('마이페이지 데이터 조회 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWish = async (productId: number) => {
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWishlist(wishlist.filter((item) => item.productId !== productId));
      } else {
        alert('찜 해제에 실패했습니다.');
      }
    } catch (err) {
      console.error('찜 해제 오류:', err);
      alert('오류가 발생했습니다.');
    }
  };

  const gradeInfo = {
    BRONZE: { text: '브론즈', color: 'bg-amber-700', nextGrade: 'SILVER', requiredTrades: 5 },
    SILVER: { text: '실버', color: 'bg-gray-400', nextGrade: 'GOLD', requiredTrades: 15 },
    GOLD: { text: '골드', color: 'bg-yellow-500', nextGrade: 'PLATINUM', requiredTrades: 30 },
    PLATINUM: { text: '플래티넘', color: 'bg-purple-500', nextGrade: null, requiredTrades: 0 },
  };

  const tabs = [
    { id: 'selling' as const, label: '판매 중' },
    { id: 'wishlist' as const, label: '찜 목록' },
    { id: 'purchase' as const, label: '구매 내역' },
    { id: 'sales' as const, label: '판매 내역' },
    { id: 'info' as const, label: '내 정보' },
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SALE': return '판매중';
      case 'RESERVED': return '예약중';
      case 'SOLD': return '판매완료';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SALE': return 'bg-green-100 text-green-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'SOLD': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-red-500 mb-4">{error || '사용자 정보를 찾을 수 없습니다.'}</div>
          <Link href="/auth/login" className="text-orange-500 hover:underline">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  const currentGrade = gradeInfo[user.grade];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-500">{user.userId}</p>
              <span className={`inline-block mt-2 px-3 py-1 ${currentGrade.color} text-white text-sm rounded-full`}>
                {currentGrade.text} 등급
              </span>
            </div>
          </div>
          <Link
            href="/mypage/edit"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            정보 수정
          </Link>
        </div>

        {/* 적립금 & 등급 정보 */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">보유 적립금</p>
            <p className="text-2xl font-bold text-orange-500">{user.points.toLocaleString()}원</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">가입일</p>
            <p className="text-lg font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* 등급 진행 상태 */}
        {currentGrade.nextGrade && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>{currentGrade.text}</span>
              <span>{gradeInfo[currentGrade.nextGrade as keyof typeof gradeInfo].text}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              다음 등급까지 거래 {currentGrade.requiredTrades - (purchaseHistory.length + salesHistory.length)}회 남음
            </p>
          </div>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'selling' && ` (${sellingProducts.length})`}
              {tab.id === 'wishlist' && ` (${wishlist.length})`}
              {tab.id === 'purchase' && ` (${purchaseHistory.length})`}
              {tab.id === 'sales' && ` (${salesHistory.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'selling' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">판매 중인 상품 {sellingProducts.length}개</p>
            <Link
              href="/products/new"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
            >
              상품 등록
            </Link>
          </div>
          {sellingProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>등록된 상품이 없습니다</p>
              <Link href="/products/new" className="text-orange-500 hover:underline mt-2 inline-block">
                첫 상품을 등록해보세요
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sellingProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-square bg-gray-100">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.title}
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
                      <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{product.title}</h3>
                      <p className="text-orange-500 font-bold mt-1">{product.price.toLocaleString()}원</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{product.wishCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div>
          <p className="text-gray-600 mb-4">찜한 상품 {wishlist.length}개</p>
          {wishlist.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p>찜한 상품이 없습니다</p>
              <Link href="/" className="text-orange-500 hover:underline mt-2 inline-block">
                상품 둘러보기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlist.map((item) => (
                <div key={item.wishlistId} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/products/${item.productId}`}>
                    <div className="relative aspect-square bg-gray-100">
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
                      <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{item.title}</h3>
                      <p className="text-orange-500 font-bold mt-1">{item.price.toLocaleString()}원</p>
                      <p className="text-xs text-gray-500 mt-1">{item.sellerName}</p>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => handleRemoveWish(item.productId)}
                      className="w-full py-2 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      찜 해제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'purchase' && (
        <div>
          {purchaseHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p>구매 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <div key={purchase.transactionId} className="bg-white rounded-lg shadow p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {purchase.thumbnail ? (
                      <Image
                        src={purchase.thumbnail}
                        alt={purchase.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{purchase.title}</h3>
                    <p className="text-orange-500 font-semibold">{purchase.price.toLocaleString()}원</p>
                    <p className="text-sm text-gray-500">
                      판매자: {purchase.sellerName} | {new Date(purchase.transactionDate).toLocaleDateString()} 구매
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors">
                      후기 작성
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div>
          {salesHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>판매 완료된 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {salesHistory.map((sale) => (
                <div key={sale.transactionId} className="bg-white rounded-lg shadow p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {sale.thumbnail ? (
                      <Image
                        src={sale.thumbnail}
                        alt={sale.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{sale.title}</h3>
                    <p className="text-orange-500 font-semibold">{sale.price.toLocaleString()}원</p>
                    <p className="text-sm text-gray-500">
                      구매자: {sale.buyerName} | {new Date(sale.transactionDate).toLocaleDateString()} 판매
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">내 정보</h2>
          <div className="space-y-4">
            <div className="flex border-b pb-4">
              <span className="w-24 text-gray-500">아이디</span>
              <span className="font-medium">{user.userId}</span>
            </div>
            <div className="flex border-b pb-4">
              <span className="w-24 text-gray-500">이름</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex border-b pb-4">
              <span className="w-24 text-gray-500">전화번호</span>
              <span className="font-medium">{user.phone}</span>
            </div>
            <div className="flex border-b pb-4">
              <span className="w-24 text-gray-500">주소</span>
              <span className="font-medium">{user.address}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-500">등급</span>
              <span className="font-medium">{currentGrade.text}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
