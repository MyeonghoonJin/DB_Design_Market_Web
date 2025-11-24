'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: number;
  title: string;
  price: number;
  status: 'SALE' | 'RESERVED' | 'SOLD';
  thumbnail: string | null;
  sellerId: string;
  sellerName: string;
}

function NewChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId');

  const [product, setProduct] = useState<Product | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    } else {
      setError('상품 정보가 없습니다.');
      setLoading(false);
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('상품을 찾을 수 없습니다.');
      }
      const data = await response.json();

      if (data.isOwner) {
        setError('본인 상품에는 채팅할 수 없습니다.');
        return;
      }

      setProduct({
        id: data.product.id,
        title: data.product.title,
        price: data.product.price,
        status: data.product.status,
        thumbnail: data.product.images?.[0]?.url || null,
        sellerId: data.product.sellerId,
        sellerName: data.product.sellerName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !product) return;

    setSending(true);
    try {
      // 채팅방 생성과 첫 메시지 전송을 동시에
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          firstMessage: newMessage.trim(),
        }),
      });

      if (response.status === 401) {
        alert('로그인이 필요합니다.');
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '채팅방 생성에 실패했습니다.');
      }

      const data = await response.json();
      // 생성된 채팅방으로 이동
      router.replace(`/chat/${data.roomId}`);
    } catch (err) {
      console.error('채팅방 생성 실패:', err);
      alert(err instanceof Error ? err.message : '채팅방 생성에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const statusBadge = {
    SALE: { text: '판매중', color: 'bg-green-500' },
    RESERVED: { text: '예약중', color: 'bg-yellow-500' },
    SOLD: { text: '판매완료', color: 'bg-gray-500' },
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-4">
        <div className="text-gray-500">{error || '상품을 찾을 수 없습니다.'}</div>
        <Link href="/" className="text-orange-500 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">{product.sellerName}</h1>
            <p className="text-xs text-gray-500">새 대화 시작하기</p>
          </div>
        </div>
      </div>

      {/* 상품 정보 */}
      <Link
        href={`/products/${product.id}`}
        className="bg-gray-50 border-b px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors"
      >
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`${statusBadge[product.status].color} text-white text-xs px-2 py-0.5 rounded`}>
              {statusBadge[product.status].text}
            </span>
            <span className="font-medium truncate">{product.title}</span>
          </div>
          <p className="text-orange-500 font-semibold">{product.price.toLocaleString()}원</p>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* 메시지 영역 (빈 상태) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="font-medium">{product.sellerName}님에게 메시지를 보내보세요</p>
          <p className="text-sm mt-1">첫 메시지를 보내면 대화가 시작됩니다</p>
        </div>
      </div>

      {/* 메시지 입력 */}
      <form onSubmit={handleSend} className="bg-white border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewChatPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <NewChatContent />
    </Suspense>
  );
}
