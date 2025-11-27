'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface PurchaseRequest {
  requestId: number;
  roomId: number;
  productId: number;
  buyerId: string;
  buyerName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  productTitle: string;
  productPrice: number;
  productThumbnail: string | null;
}

export default function RequestsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/transactions/requests');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('구매 신청 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: number, action: 'accept' | 'reject') => {
    const confirmMessage = action === 'accept'
      ? '이 구매 신청을 수락하시겠습니까?\n수락하면 거래가 완료되고 상품이 판매완료 처리됩니다.'
      : '이 구매 신청을 거절하시겠습니까?\n거절하면 해당 구매자는 다시 신청할 수 없습니다.';

    if (!confirm(confirmMessage)) return;

    setProcessingId(requestId);
    try {
      const response = await fetch('/api/transactions/request/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '처리에 실패했습니다.');
        return;
      }

      alert(data.message);
      fetchRequests();
    } catch (err) {
      console.error('응답 처리 오류:', err);
      alert('처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = {
    PENDING: { text: '대기중', color: 'bg-yellow-500' },
    ACCEPTED: { text: '수락됨', color: 'bg-green-500' },
    REJECTED: { text: '거절됨', color: 'bg-red-500' },
  };

  // 상품별로 그룹화
  const groupedRequests = requests.reduce((groups, request) => {
    const key = request.productId;
    if (!groups[key]) {
      groups[key] = {
        productId: request.productId,
        productTitle: request.productTitle,
        productPrice: request.productPrice,
        productThumbnail: request.productThumbnail,
        requests: [],
      };
    }
    groups[key].requests.push(request);
    return groups;
  }, {} as Record<number, {
    productId: number;
    productTitle: string;
    productPrice: number;
    productThumbnail: string | null;
    requests: PurchaseRequest[];
  }>);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">받은 구매 신청</h1>
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">받은 구매 신청</h1>

      {Object.keys(groupedRequests).length > 0 ? (
        <div className="space-y-6">
          {Object.values(groupedRequests).map((group) => (
            <div key={group.productId} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* 상품 정보 */}
              <Link href={`/products/${group.productId}`}>
                <div className="flex items-center gap-4 p-4 bg-gray-50 border-b hover:bg-gray-100 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden relative flex-shrink-0">
                    {group.productThumbnail ? (
                      <Image
                        src={group.productThumbnail}
                        alt={group.productTitle}
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
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{group.productTitle}</h3>
                    <p className="text-orange-500 font-bold">{group.productPrice.toLocaleString()}원</p>
                  </div>
                  <span className="text-sm text-gray-500">{group.requests.length}건의 신청</span>
                </div>
              </Link>

              {/* 신청 목록 */}
              <div className="divide-y">
                {group.requests.map((request) => (
                  <div key={request.requestId} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.buyerName}</p>
                      <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`${statusBadge[request.status].color} text-white text-xs px-2 py-1 rounded`}>
                        {statusBadge[request.status].text}
                      </span>
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(request.requestId, 'accept')}
                            disabled={processingId === request.requestId}
                            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => handleRespond(request.requestId, 'reject')}
                            disabled={processingId === request.requestId}
                            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:bg-gray-300"
                          >
                            거절
                          </button>
                        </div>
                      )}
                      <Link
                        href={`/chat/${request.roomId}`}
                        className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                      >
                        채팅
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>받은 구매 신청이 없습니다</p>
        </div>
      )}
    </div>
  );
}
