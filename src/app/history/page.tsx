'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface Transaction {
  transactionId: number;
  sellerId: string;
  buyerId: string;
  productId: number;
  transactionDate: string;
  productTitle: string;
  productPrice: number;
  productThumbnail: string | null;
  sellerName: string;
  buyerName: string;
  hasReview: boolean;
  isSeller: boolean;
  canReview: boolean;
  daysLeft: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [activeTab, isAuthenticated]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/transactions?type=${activeTab}`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('거래 내역 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">거래 내역</h1>

      {/* 탭 */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'buy'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          구매 내역
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'sell'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          판매 내역
        </button>
      </div>

      {/* 거래 목록 */}
      {authLoading || loading ? (
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      ) : !isAuthenticated ? null : transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.transactionId}
              className="bg-white rounded-lg shadow-sm border p-4"
            >
              <div className="flex gap-4">
                <Link href={`/products/${transaction.productId}`}>
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    {transaction.productThumbnail ? (
                      <Image
                        src={transaction.productThumbnail}
                        alt={transaction.productTitle}
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
                  <Link href={`/products/${transaction.productId}`}>
                    <h3 className="font-medium text-gray-900 truncate hover:text-orange-500">
                      {transaction.productTitle}
                    </h3>
                  </Link>
                  <p className="text-orange-500 font-bold mt-1">
                    {transaction.productPrice.toLocaleString()}원
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    <p>
                      {activeTab === 'buy' ? '판매자' : '구매자'}:{' '}
                      <span className="text-gray-700">
                        {activeTab === 'buy' ? transaction.sellerName : transaction.buyerName}
                      </span>
                    </p>
                    <p>거래일: {formatDate(transaction.transactionDate)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                    거래완료
                  </span>
                  {activeTab === 'buy' && transaction.canReview && (
                    <div className="flex flex-col items-end">
                      <Link
                        href={`/review/${transaction.transactionId}`}
                        className="text-sm text-orange-500 hover:underline"
                      >
                        후기 작성
                      </Link>
                      <span className="text-xs text-gray-400">{transaction.daysLeft}일 남음</span>
                    </div>
                  )}
                  {activeTab === 'buy' && !transaction.hasReview && !transaction.canReview && transaction.daysLeft <= 0 && (
                    <span className="text-sm text-gray-400">기간 만료</span>
                  )}
                  {transaction.hasReview && (
                    <span className="text-sm text-gray-400">후기 작성됨</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>{activeTab === 'buy' ? '구매' : '판매'} 내역이 없습니다</p>
        </div>
      )}
    </div>
  );
}
