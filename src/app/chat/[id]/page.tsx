'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  messageId: number;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  isMine: boolean;
  messageType?: 'TEXT' | 'SYSTEM';
}

interface PurchaseRequestMessage {
  type: 'PURCHASE_REQUEST';
  productId: number;
  productTitle: string;
  productPrice: number;
  requestId: number;
  message: string;
}

interface TransactionCompleteMessage {
  type: 'TRANSACTION_COMPLETE';
  message: string;
}

interface ChatRoom {
  roomId: number;
  productId: number;
  productTitle: string;
  productPrice: number;
  productStatus: 'SALE' | 'RESERVED' | 'SOLD';
  productThumbnail: string | null;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  isBuyer: boolean;
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const roomId = params.id as string;

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 거래 신청 관련 상태
  const [transactionRequest, setTransactionRequest] = useState<{
    requestId: number;
    status: string;
  } | null>(null);
  const [isRejected, setIsRejected] = useState(false);
  const [requestingTransaction, setRequestingTransaction] = useState(false);

  // 채팅방 정보 불러오기
  const fetchChatRoom = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${roomId}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('채팅방을 불러올 수 없습니다.');
      }
      const data = await response.json();
      setChatRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  }, [roomId, router]);

  // 메시지 불러오기
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${roomId}/messages`);
      if (!response.ok) {
        throw new Error('메시지를 불러올 수 없습니다.');
      }
      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      console.error('메시지 로딩 실패:', err);
    }
  }, [roomId]);

  // 거래 신청 상태 불러오기 (채팅방 기반)
  const fetchTransactionRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions/request?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setTransactionRequest(data.request);
        setIsRejected(data.isRejected || false);
      }
    } catch (err) {
      console.error('거래 신청 상태 로딩 실패:', err);
    }
  }, [roomId]);

  // 초기 로딩
  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      setLoading(true);
      await fetchChatRoom();
      await fetchMessages();
      setLoading(false);
    };
    init();
  }, [fetchChatRoom, fetchMessages, isAuthenticated]);

  // 거래 신청 상태 로드 (구매자, 판매자 모두)
  useEffect(() => {
    if (chatRoom) {
      fetchTransactionRequest();
    }
  }, [chatRoom, fetchTransactionRequest]);

  // 주기적으로 메시지 갱신 (폴링)
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // 새 메시지 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) {
        throw new Error('메시지 전송에 실패했습니다.');
      }

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 날짜별 그룹화
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.sentAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const statusBadge = {
    SALE: { text: '판매중', color: 'bg-green-500' },
    RESERVED: { text: '예약중', color: 'bg-yellow-500' },
    SOLD: { text: '판매완료', color: 'bg-gray-500' },
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !chatRoom) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-4">
        <div className="text-gray-500">{error || '채팅방을 찾을 수 없습니다.'}</div>
        <Link href="/chat" className="text-orange-500 hover:underline">
          채팅 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const otherUser = chatRoom.isBuyer
    ? { id: chatRoom.sellerId, name: chatRoom.sellerName }
    : { id: chatRoom.buyerId, name: chatRoom.buyerName };

  const handleLeaveRoom = async () => {
    if (!confirm('채팅방을 나가시겠습니까?\n나가면 대화 내용이 모두 삭제됩니다.')) return;

    try {
      const response = await fetch(`/api/chat/${roomId}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/chat');
      } else {
        const data = await response.json();
        alert(data.error || '채팅방 나가기에 실패했습니다.');
      }
    } catch (err) {
      console.error('채팅방 나가기 오류:', err);
      alert('채팅방 나가기에 실패했습니다.');
    }
  };

  // 거래 신청하기 (구매자) - 채팅방 기반
  const handleRequestTransaction = async () => {
    if (!chatRoom) return;

    if (!confirm('이 상품에 대해 구매를 신청하시겠습니까?')) return;

    setRequestingTransaction(true);
    try {
      const response = await fetch('/api/transactions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: chatRoom.roomId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '거래 신청에 실패했습니다.');
        return;
      }

      alert('구매 신청이 완료되었습니다.');
      await fetchTransactionRequest();
      await fetchMessages();
    } catch (err) {
      console.error('거래 신청 오류:', err);
      alert('거래 신청에 실패했습니다.');
    } finally {
      setRequestingTransaction(false);
    }
  };

  // 거래 신청 취소 (구매자) - 채팅방 기반
  const handleCancelRequest = async () => {
    if (!chatRoom) return;

    if (!confirm('구매 신청을 취소하시겠습니까?')) return;

    setRequestingTransaction(true);
    try {
      const response = await fetch(`/api/transactions/request?roomId=${chatRoom.roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '거래 신청 취소에 실패했습니다.');
        return;
      }

      alert('구매 신청이 취소되었습니다.');
      setTransactionRequest(null);
      await fetchMessages();
    } catch (err) {
      console.error('거래 신청 취소 오류:', err);
      alert('거래 신청 취소에 실패했습니다.');
    } finally {
      setRequestingTransaction(false);
    }
  };

  // 판매자 - 구매 요청 응답 (수락/거절)
  const handleRespondRequest = async (requestId: number, action: 'accept' | 'reject') => {
    const confirmMessage = action === 'accept'
      ? '이 구매 요청을 수락하시겠습니까?\n수락하면 거래가 완료되고 상품이 판매완료 처리됩니다.'
      : '이 구매 요청을 거절하시겠습니까?\n거절하면 해당 구매자는 다시 신청할 수 없습니다.';

    if (!confirm(confirmMessage)) return;

    setRequestingTransaction(true);
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
      await fetchTransactionRequest();
      await fetchMessages();
      // 채팅방 정보도 새로고침 (상품 상태 변경 반영)
      await fetchChatRoom();
    } catch (err) {
      console.error('응답 처리 오류:', err);
      alert('처리에 실패했습니다.');
    } finally {
      setRequestingTransaction(false);
    }
  };

  // 구매 신청 버튼 렌더링 로직
  const renderPurchaseButton = () => {
    // 구매자가 아니거나 판매완료면 표시 안함
    if (!chatRoom.isBuyer || chatRoom.productStatus === 'SOLD') {
      return null;
    }

    // 거절된 경우 비활성화된 버튼 표시
    if (isRejected) {
      return (
        <div className="flex-shrink-0">
          <span className="text-xs text-red-500 font-medium">신청 불가</span>
        </div>
      );
    }

    // 이미 신청한 경우
    if (transactionRequest) {
      return (
        <div className="flex-shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-medium whitespace-nowrap ${
              transactionRequest.status === 'PENDING' ? 'text-yellow-600' :
              transactionRequest.status === 'ACCEPTED' ? 'text-green-600' :
              'text-red-600'
            }`}>
              {transactionRequest.status === 'PENDING' && '대기 중'}
              {transactionRequest.status === 'ACCEPTED' && '확정됨'}
              {transactionRequest.status === 'REJECTED' && '거절됨'}
            </span>
            {transactionRequest.status === 'PENDING' && (
              <button
                onClick={handleCancelRequest}
                disabled={requestingTransaction}
                className="px-2 py-1 text-xs text-red-500 border border-red-500 rounded hover:bg-red-50 disabled:opacity-50"
              >
                {requestingTransaction ? '...' : '취소'}
              </button>
            )}
          </div>
        </div>
      );
    }

    // 신청 가능한 경우
    return (
      <div className="flex-shrink-0">
        <button
          onClick={handleRequestTransaction}
          disabled={requestingTransaction}
          className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 text-xs whitespace-nowrap"
        >
          {requestingTransaction ? '처리중...' : '구매 신청'}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-white hover:text-orange-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="font-bold text-white text-lg">{otherUser.name}</h1>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="text-white hover:text-red-200 p-2 rounded-lg hover:bg-white/10 transition-all"
            title="채팅방 나가기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/products/${chatRoom.productId}`}
            className="flex-1 flex items-center gap-4 hover:bg-gray-100 transition-all rounded-xl p-2 -mx-2 min-w-0 group"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
              {chatRoom.productThumbnail ? (
                <Image
                  src={chatRoom.productThumbnail}
                  alt={chatRoom.productTitle}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`${statusBadge[chatRoom.productStatus].color} text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm`}>
                  {statusBadge[chatRoom.productStatus].text}
                </span>
              </div>
              <p className="font-semibold text-gray-900 truncate">{chatRoom.productTitle}</p>
              <p className="text-orange-600 font-bold text-lg">{chatRoom.productPrice.toLocaleString()}원</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* 구매 신청 버튼 */}
          {renderPurchaseButton()}

          {/* 판매완료 안내 */}
          {chatRoom.productStatus === 'SOLD' && (
            <div className="flex-shrink-0 text-gray-500 text-sm font-medium">
              판매완료
            </div>
          )}
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="font-medium text-gray-500">아직 메시지가 없습니다</p>
            <p className="text-sm mt-1">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center mb-4">
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              <div className="space-y-3">
                {msgs.map((message) => {
                  const isMyMessage = message.isMine;

                  // SYSTEM 메시지 (구매 요청) 특별 렌더링
                  if (message.messageType === 'SYSTEM') {
                    try {
                      const systemData = JSON.parse(message.content) as PurchaseRequestMessage;
                      if (systemData.type === 'PURCHASE_REQUEST') {
                        // 판매자인지 확인 (isBuyer가 false면 판매자)
                        const isSeller = chatRoom && !chatRoom.isBuyer;
                        // 거래 요청 상태 확인 (PENDING일 때만 버튼 표시)
                        const isPending = transactionRequest?.status === 'PENDING';

                        return (
                          <div key={message.messageId} className={`flex my-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-end gap-2 max-w-[80%] ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                              <div className={`bg-orange-50 border border-orange-200 rounded-xl p-4 ${isMyMessage ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-orange-700 font-medium text-sm">구매 요청</span>
                                </div>
                                <p className="text-gray-700 text-sm mb-3">{systemData.message}</p>
                                <div className="bg-white rounded-lg p-3 border border-gray-100 mb-3">
                                  <Link href={`/products/${systemData.productId}`} className="hover:opacity-80">
                                    <p className="font-medium text-gray-900 truncate">{systemData.productTitle}</p>
                                    <p className="text-orange-500 font-bold">{systemData.productPrice.toLocaleString()}원</p>
                                  </Link>
                                </div>
                                {/* 판매자용 수락/거절 버튼 */}
                                {isSeller && isPending && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRespondRequest(systemData.requestId, 'accept')}
                                      disabled={requestingTransaction}
                                      className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-300 font-medium"
                                    >
                                      수락
                                    </button>
                                    <button
                                      onClick={() => handleRespondRequest(systemData.requestId, 'reject')}
                                      disabled={requestingTransaction}
                                      className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:bg-gray-300 font-medium"
                                    >
                                      거절
                                    </button>
                                  </div>
                                )}
                                {/* 거래 완료 상태 표시 */}
                                {transactionRequest?.status === 'ACCEPTED' && (
                                  <div className="text-center py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium">
                                    거래가 완료되었습니다
                                  </div>
                                )}
                                {transactionRequest?.status === 'REJECTED' && (
                                  <div className="text-center py-2 bg-red-100 text-red-700 text-sm rounded-lg font-medium">
                                    거절되었습니다
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">{formatTime(message.sentAt)}</span>
                            </div>
                          </div>
                        );
                      }

                      // 거래 완료 메시지 처리
                      const completeData = systemData as unknown as TransactionCompleteMessage;
                      if (completeData.type === 'TRANSACTION_COMPLETE') {
                        return (
                          <div key={message.messageId} className="flex justify-center my-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-3">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-700 font-medium">{completeData.message}</span>
                              </div>
                              <p className="text-xs text-gray-400 text-center mt-1">{formatTime(message.sentAt)}</p>
                            </div>
                          </div>
                        );
                      }
                    } catch {
                      // JSON 파싱 실패 시 일반 메시지로 표시
                    }
                  }

                  return (
                    <div
                      key={message.messageId}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[75%] ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            isMyMessage
                              ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                          }`}
                        >
                          <p className="break-words leading-relaxed">{message.content}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 mb-1">
                          {isMyMessage && !message.isRead && (
                            <span className="text-xs text-orange-600 font-medium">1</span>
                          )}
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(message.sentAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-5 py-3 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
