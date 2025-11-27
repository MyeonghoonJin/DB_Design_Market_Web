'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface Transaction {
  transactionId: number;
  productId: number;
  productTitle: string;
  productPrice: number;
  productThumbnail: string | null;
  sellerId: string;
  sellerName: string;
  transactionDate: string;
  canReview: boolean;
  daysLeft: number;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const transactionId = params.transactionId as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [score, setScore] = useState(5);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransaction();
    }
  }, [isAuthenticated, transactionId]);

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '거래 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('후기 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: Number(transactionId),
          score,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '후기 작성에 실패했습니다.');
      }

      alert(`후기가 작성되었습니다!\n적립금 ${data.earnedPoints.toLocaleString()}원이 지급되었습니다.`);
      router.push('/mypage');
    } catch (err) {
      alert(err instanceof Error ? err.message : '후기 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const displayScore = hoveredScore || score;
          const isFilled = value <= displayScore;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              onMouseEnter={() => setHoveredScore(value)}
              onMouseLeave={() => setHoveredScore(0)}
              className="w-12 h-12 transition-transform hover:scale-110"
            >
              <svg
                className={`w-full h-full transition-colors ${
                  isFilled ? 'text-orange-500' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !transaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{error || '거래 정보를 찾을 수 없습니다.'}</p>
          <Link href="/history" className="text-orange-500 hover:underline">
            거래 내역으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!transaction.canReview) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">
            {transaction.daysLeft < 0
              ? '후기 작성 기간(7일)이 지났습니다.'
              : '이미 후기를 작성하셨습니다.'}
          </p>
          <Link href="/history" className="text-orange-500 hover:underline">
            거래 내역으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">후기 작성</h1>

      {/* 상품 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-4">
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
          <div className="flex-1">
            <Link href={`/products/${transaction.productId}`}>
              <h3 className="font-medium text-gray-900 hover:text-orange-500">
                {transaction.productTitle}
              </h3>
            </Link>
            <p className="text-orange-500 font-bold mt-1">
              {transaction.productPrice.toLocaleString()}원
            </p>
            <p className="text-sm text-gray-500 mt-1">
              판매자: {transaction.sellerName}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-sm text-gray-500">
          <p>거래일: {new Date(transaction.transactionDate).toLocaleDateString('ko-KR')}</p>
          <p className="text-orange-500">후기 작성 기한: {transaction.daysLeft}일 남음</p>
        </div>
      </div>

      {/* 후기 작성 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
        {/* 별점 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            별점 (1~5점)
          </label>
          {renderStars()}
          <p className="text-sm text-gray-500 mt-2">
            선택한 별점: <span className="font-bold text-orange-500">{score}점</span>
          </p>
        </div>

        {/* 후기 내용 */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            후기 내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="거래는 어떠셨나요? 솔직한 후기를 남겨주세요."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 적립금 안내 */}
        <div className="bg-orange-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-700">
            후기 작성 시 등급에 따라 구매 금액의 일정 비율이 적립금으로 지급됩니다.
          </p>
          <ul className="text-xs text-orange-600 mt-2 space-y-1">
            <li>브론즈: 2.5% | 실버: 5% | 골드: 7.5% | 플래티넘: 10%</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Link
            href="/history"
            className="flex-1 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300"
          >
            {submitting ? '작성 중...' : '후기 작성'}
          </button>
        </div>
      </form>
    </div>
  );
}
