// 회원 타입
export interface User {
  id: string;
  password: string;
  name: string;
  address: string;
  phone: string;
  grade: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points: number;
  createdAt: Date;
}

// 물품 타입
export interface Product {
  id: number;
  sellerId: string;
  title: string;
  price: number;
  description: string;
  category: string;
  status: 'SALE' | 'RESERVED' | 'SOLD';
  createdAt: Date;
  images: ProductImage[];
  wishCount: number;
}

// 물품 이미지 타입
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
}

// 거래 내역 타입
export interface Transaction {
  id: number;
  sellerId: string;
  buyerId: string;
  productId: number;
  transactionDate: Date;
}

// 거래 후기 타입
export interface Review {
  id: number;
  transactionId: number;
  buyerId: string;
  score: number;
  content: string;
  createdAt: Date;
}

// 찜하기 타입
export interface Wishlist {
  id: number;
  userId: string;
  productId: number;
  createdAt: Date;
}

// 채팅방 타입
export interface ChatRoom {
  id: number;
  productId: number;
  sellerId: string;
  buyerId: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

// 메세지 타입
export interface Message {
  id: number;
  chatRoomId: number;
  senderId: string;
  content: string;
  sentAt: Date;
  isRead: boolean;
}

// 카테고리 목록
export const CATEGORIES = [
  '전자기기',
  '의류',
  '가구/인테리어',
  '생활용품',
  '스포츠/레저',
  '도서/티켓/문구',
  '뷰티/미용',
  '반려동물용품',
  '기타',
] as const;

// 등급별 적립률
export const GRADE_POINTS_RATE = {
  BRONZE: 0.01,
  SILVER: 0.02,
  GOLD: 0.03,
  PLATINUM: 0.05,
} as const;
