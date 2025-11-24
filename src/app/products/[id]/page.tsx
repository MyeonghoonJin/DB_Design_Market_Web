'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ProductImage {
  id: number;
  url: string;
}

interface Product {
  id: number;
  sellerId: string;
  sellerName: string;
  sellerGrade: string;
  title: string;
  price: number;
  description: string;
  category: string;
  status: 'SALE' | 'RESERVED' | 'SOLD';
  createdAt: string;
  images: ProductImage[];
  wishCount: number;
}

interface Buyer {
  buyerId: string;
  buyerName: string;
  roomId: number;
  lastMessage: string | null;
  lastMessageTime: string | null;
  requestId: number | null;
  requestStatus: string | null;
}

const CATEGORIES = [
  '전자기기', '의류', '가구/인테리어', '도서', '스포츠/레저',
  '게임/취미', '뷰티/미용', '식품', '유아동', '기타'
];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWished, setIsWished] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    price: 0,
    description: '',
    category: '',
    status: 'SALE' as 'SALE' | 'RESERVED' | 'SOLD',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 거래 확정 관련 상태
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [confirmingTransaction, setConfirmingTransaction] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('상품을 찾을 수 없습니다.');
        } else {
          setError('상품 정보를 불러오는데 실패했습니다.');
        }
        return;
      }

      const data = await response.json();
      setProduct(data.product);
      setIsOwner(data.isOwner);
      setIsWished(data.isWished || false);
      setEditForm({
        title: data.product.title,
        price: data.product.price,
        description: data.product.description,
        category: data.product.category,
        status: data.product.status,
      });
    } catch (err) {
      console.error('상품 조회 오류:', err);
      setError('상품 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '수정에 실패했습니다.');
        return;
      }

      // 수정 성공 후 새로고침
      await fetchProduct();
      setIsEditing(false);
      alert('상품이 수정되었습니다.');
    } catch (err) {
      console.error('상품 수정 오류:', err);
      alert('수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '삭제에 실패했습니다.');
        return;
      }

      alert('상품이 삭제되었습니다.');
      router.push('/mypage');
    } catch (err) {
      console.error('상품 삭제 오류:', err);
      alert('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 거래 확정을 위한 구매자 목록 조회
  const fetchBuyers = async () => {
    if (!product) return;

    setLoadingBuyers(true);
    try {
      const response = await fetch(`/api/transactions/buyers?productId=${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setBuyers(data.buyers);
      }
    } catch (err) {
      console.error('구매자 목록 조회 오류:', err);
    } finally {
      setLoadingBuyers(false);
    }
  };

  // 거래 확정 버튼 클릭
  const handleConfirmTransaction = async () => {
    if (!product) return;

    setShowBuyerModal(true);
    await fetchBuyers();
  };

  // 구매자 선택하여 거래 확정
  const confirmWithBuyer = async (buyerId: string) => {
    if (!product) return;

    if (!confirm('이 구매자와 거래를 확정하시겠습니까?\n확정 후에는 취소할 수 없습니다.')) {
      return;
    }

    setConfirmingTransaction(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          buyerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '거래 확정에 실패했습니다.');
        return;
      }

      alert('거래가 확정되었습니다.');
      setShowBuyerModal(false);
      await fetchProduct(); // 상품 정보 새로고침
    } catch (err) {
      console.error('거래 확정 오류:', err);
      alert('거래 확정에 실패했습니다.');
    } finally {
      setConfirmingTransaction(false);
    }
  };

  // 구매 확정 수락/거절 (판매자)
  const handleRespondToRequest = async (requestId: number, action: 'accept' | 'reject') => {
    const actionText = action === 'accept' ? '수락' : '거절';
    if (!confirm(`구매 확정을 ${actionText}하시겠습니까?${action === 'accept' ? '\n수락 후에는 취소할 수 없습니다.' : ''}`)) {
      return;
    }

    setConfirmingTransaction(true);
    try {
      const response = await fetch('/api/transactions/request/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || `거래 ${actionText}에 실패했습니다.`);
        return;
      }

      alert(`거래가 ${actionText}되었습니다.`);
      if (action === 'accept') {
        setShowBuyerModal(false);
        await fetchProduct();
      } else {
        await fetchBuyers(); // 목록 새로고침
      }
    } catch (err) {
      console.error(`거래 ${actionText} 오류:`, err);
      alert(`거래 ${actionText}에 실패했습니다.`);
    } finally {
      setConfirmingTransaction(false);
    }
  };

  const statusBadge = {
    SALE: { text: '판매중', color: 'bg-green-500' },
    RESERVED: { text: '예약중', color: 'bg-yellow-500' },
    SOLD: { text: '판매완료', color: 'bg-gray-500' },
  };

  const gradeInfo: Record<string, { text: string; color: string }> = {
    BRONZE: { text: '브론즈', color: 'text-amber-700' },
    SILVER: { text: '실버', color: 'text-gray-500' },
    GOLD: { text: '골드', color: 'text-yellow-500' },
    PLATINUM: { text: '플래티넘', color: 'text-purple-500' },
  };

  const handleChat = async () => {
    if (!product) return;

    try {
      // 기존 채팅방이 있는지 확인
      const response = await fetch(`/api/chat/check?productId=${product.id}`);

      if (response.status === 401) {
        alert('로그인이 필요합니다.');
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.roomId) {
          // 기존 채팅방이 있으면 해당 채팅방으로 이동
          router.push(`/chat/${data.roomId}`);
        } else {
          // 기존 채팅방이 없으면 새 채팅 페이지로 이동 (productId만 전달)
          router.push(`/chat/new?productId=${product.id}`);
        }
      }
    } catch (err) {
      console.error('채팅방 확인 오류:', err);
      alert('채팅방을 열 수 없습니다.');
    }
  };

  const handleWish = async () => {
    if (!product) return;

    try {
      if (isWished) {
        // 찜 해제
        const response = await fetch(`/api/wishlist?productId=${product.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsWished(false);
          setProduct({ ...product, wishCount: product.wishCount - 1 });
        } else {
          const data = await response.json();
          alert(data.error || '찜 해제에 실패했습니다.');
        }
      } else {
        // 찜 추가
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });

        if (response.ok) {
          setIsWished(true);
          setProduct({ ...product, wishCount: product.wishCount + 1 });
        } else {
          const data = await response.json();
          if (response.status === 401) {
            alert('로그인이 필요합니다.');
            router.push('/auth/login');
          } else {
            alert(data.error || '찜하기에 실패했습니다.');
          }
        }
      }
    } catch (err) {
      console.error('찜하기 오류:', err);
      alert('오류가 발생했습니다.');
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

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-red-500 mb-4">{error || '상품을 찾을 수 없습니다.'}</div>
          <Link href="/" className="text-orange-500 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const currentGrade = gradeInfo[product.sellerGrade] || gradeInfo.BRONZE;

  // 판매자 뷰 (본인 상품)
  if (isOwner) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">내 상품 관리</h1>
          <Link href="/mypage" className="text-gray-500 hover:text-gray-700">
            ← 마이페이지로 돌아가기
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이미지 섹션 */}
          <div>
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[currentImageIndex]?.url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* 썸네일 */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-4">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 relative ${
                      currentImageIndex === index ? 'border-orange-500' : 'border-transparent'
                    }`}
                  >
                    <Image src={image.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 상품 정보/편집 섹션 */}
          <div>
            {isEditing ? (
              /* 편집 모드 */
              <div className="space-y-4">
                {/* 판매 상태 변경 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">판매 상태</label>
                  <div className="flex gap-2">
                    {(['SALE', 'RESERVED', 'SOLD'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, status })}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          editForm.status === status
                            ? `${statusBadge[status].color} text-white`
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {statusBadge[status].text}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        title: product.title,
                        price: product.price,
                        description: product.description,
                        category: product.category,
                        status: product.status,
                      });
                    }}
                    className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              /* 보기 모드 */
              <>
                {/* 현재 판매 상태 표시 */}
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${statusBadge[product.status].color}`}>
                    {statusBadge[product.status].text}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-sm text-gray-500">{product.category}</span>
                  <h2 className="text-2xl font-bold mt-1">{product.title}</h2>
                </div>

                <div className="text-3xl font-bold text-orange-500 mb-6">
                  {product.price.toLocaleString()}원
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">상품 설명</h3>
                  <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <span>등록일 {new Date(product.createdAt).toLocaleDateString()}</span>
                  <span>관심 {product.wishCount}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    정보 수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-6 py-3 border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>

                {/* 거래 완료 버튼 (판매완료가 아닌 경우만) */}
                {product.status !== 'SOLD' && (
                  <button
                    onClick={handleConfirmTransaction}
                    className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  >
                    거래 완료
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 구매자 선택 모달 */}
        {showBuyerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">구매자 선택</h3>
                <button
                  onClick={() => setShowBuyerModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-96">
                {loadingBuyers ? (
                  <div className="text-center py-8 text-gray-500">로딩 중...</div>
                ) : buyers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>채팅한 구매자가 없습니다.</p>
                    <p className="text-sm mt-2">구매자와 채팅을 통해 거래를 진행해주세요.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buyers.map((buyer) => (
                      <div
                        key={buyer.buyerId}
                        className={`border rounded-lg p-4 transition-colors ${
                          buyer.requestStatus === 'PENDING' ? 'border-yellow-500 bg-yellow-50' : 'hover:border-orange-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{buyer.buyerName}</p>
                              {buyer.requestStatus === 'PENDING' && (
                                <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
                                  구매 확정
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                              {buyer.lastMessage || '메시지 없음'}
                            </p>
                            {buyer.lastMessageTime && (
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(buyer.lastMessageTime).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {buyer.requestStatus === 'PENDING' && buyer.requestId ? (
                              <>
                                <button
                                  onClick={() => handleRespondToRequest(buyer.requestId!, 'accept')}
                                  disabled={confirmingTransaction}
                                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors text-sm"
                                >
                                  수락
                                </button>
                                <button
                                  onClick={() => handleRespondToRequest(buyer.requestId!, 'reject')}
                                  disabled={confirmingTransaction}
                                  className="px-3 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                                >
                                  거절
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => confirmWithBuyer(buyer.buyerId)}
                                disabled={confirmingTransaction}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
                              >
                                {confirmingTransaction ? '처리중...' : '선택'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 구매자 뷰 (다른 사람 상품)
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 이미지 섹션 */}
        <div>
          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[currentImageIndex]?.url}
                alt={product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <span className={`absolute top-4 left-4 ${statusBadge[product.status].color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
              {statusBadge[product.status].text}
            </span>
          </div>

          {/* 썸네일 */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 relative ${
                    currentImageIndex === index ? 'border-orange-500' : 'border-transparent'
                  }`}
                >
                  <Image src={image.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 섹션 */}
        <div>
          <div className="mb-4">
            <span className="text-sm text-gray-500">{product.category}</span>
            <h1 className="text-2xl font-bold mt-1">{product.title}</h1>
          </div>

          <div className="text-3xl font-bold text-orange-500 mb-6">
            {product.price.toLocaleString()}원
          </div>

          {/* 판매자 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{product.sellerName}</p>
                  <p className={`text-sm ${currentGrade.color}`}>
                    {currentGrade.text} 등급
                  </p>
                </div>
              </div>
              <Link
                href={`/user/${product.sellerId}`}
                className="text-sm text-orange-500 hover:underline"
              >
                판매자 프로필
              </Link>
            </div>
          </div>

          {/* 상품 설명 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">상품 설명</h3>
            <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
          </div>

          {/* 추가 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>등록일 {new Date(product.createdAt).toLocaleDateString()}</span>
            <span>관심 {product.wishCount}</span>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleWish}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg border ${
                isWished
                  ? 'bg-red-50 border-red-500 text-red-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              <svg className="w-5 h-5" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isWished ? '찜 해제' : '찜하기'}
            </button>
            <button
              onClick={handleChat}
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              채팅하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
