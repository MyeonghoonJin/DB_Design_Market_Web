'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface Message {
  messageId: number;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  isMine: boolean;
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

  // 거래 신청 상태 불러오기 (구매자용)
  const fetchTransactionRequest = useCallback(async (productId: number) => {
    try {
      const response = await fetch(`/api/transactions/request?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setTransactionRequest(data.request);
      }
    } catch (err) {
      console.error('거래 신청 상태 로딩 실패:', err);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchChatRoom();
      await fetchMessages();
      setLoading(false);
    };
    init();
  }, [fetchChatRoom, fetchMessages]);

  // 구매자인 경우 거래 신청 상태 로드
  useEffect(() => {
    if (chatRoom?.isBuyer && chatRoom?.productId) {
      fetchTransactionRequest(chatRoom.productId);
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
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

  // 거래 신청하기 (구매자)
  const handleRequestTransaction = async () => {
    if (!chatRoom) return;

    if (!confirm('이 상품에 대해 구매를 확정하시겠습니까?')) return;

    setRequestingTransaction(true);
    try {
      const response = await fetch('/api/transactions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: chatRoom.productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '거래 신청에 실패했습니다.');
        return;
      }

      alert('구매 확정 요청이 완료되었습니다.');
      await fetchTransactionRequest(chatRoom.productId);
    } catch (err) {
      console.error('거래 신청 오류:', err);
      alert('거래 신청에 실패했습니다.');
    } finally {
      setRequestingTransaction(false);
    }
  };

  // 거래 신청 취소 (구매자)
  const handleCancelRequest = async () => {
    if (!chatRoom) return;

    if (!confirm('구매 확정 요청을 취소하시겠습니까?')) return;

    setRequestingTransaction(true);
    try {
      const response = await fetch(`/api/transactions/request?productId=${chatRoom.productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || '거래 신청 취소에 실패했습니다.');
        return;
      }

      alert('구매 확정 요청이 취소되었습니다.');
      setTransactionRequest(null);
    } catch (err) {
      console.error('거래 신청 취소 오류:', err);
      alert('거래 신청 취소에 실패했습니다.');
    } finally {
      setRequestingTransaction(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold">{otherUser.name}</h1>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="text-gray-500 hover:text-red-500 p-1"
            title="채팅방 나가기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/products/${chatRoom.productId}`}
            className="flex-1 flex items-center gap-3 hover:bg-gray-100 transition-colors rounded-lg -mx-1 px-1 min-w-0"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
              {chatRoom.productThumbnail ? (
                <Image
                  src={chatRoom.productThumbnail}
                  alt={chatRoom.productTitle}
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
                <span className={`${statusBadge[chatRoom.productStatus].color} text-white text-xs px-2 py-0.5 rounded`}>
                  {statusBadge[chatRoom.productStatus].text}
                </span>
                <span className="font-medium truncate">{chatRoom.productTitle}</span>
              </div>
              <p className="text-orange-500 font-semibold">{chatRoom.productPrice.toLocaleString()}원</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* 구매 신청 버튼 (구매자용, 판매중인 상품만) */}
          {chatRoom.isBuyer && chatRoom.productStatus !== 'SOLD' && (
            <div className="flex-shrink-0">
              {transactionRequest ? (
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
              ) : (
                <button
                  onClick={handleRequestTransaction}
                  disabled={requestingTransaction}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 text-xs whitespace-nowrap"
                >
                  {requestingTransaction ? '처리중...' : '구매 신청'}
                </button>
              )}
            </div>
          )}

          {/* 판매완료 안내 */}
          {chatRoom.productStatus === 'SOLD' && (
            <div className="flex-shrink-0 text-gray-500 text-xs">
              판매완료
            </div>
          )}
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            아직 메시지가 없습니다.<br />
            첫 메시지를 보내보세요!
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
                  return (
                    <div
                      key={message.messageId}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMyMessage
                              ? 'bg-orange-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isMyMessage && !message.isRead && (
                            <span className="text-xs text-orange-500">1</span>
                          )}
                          <span className="text-xs text-gray-400">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
