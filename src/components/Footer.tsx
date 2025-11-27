import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-orange-500 mb-4">중고마켓</h3>
            <p className="text-sm">
              안전하고 편리한 중고거래 플랫폼<br />
              누구나 쉽게 사고 팔 수 있는 마켓
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-500">물품 검색</Link></li>
              <li><Link href="/products/new" className="hover:text-orange-500">판매하기</Link></li>
              <li><Link href="/chat" className="hover:text-orange-500">채팅</Link></li>
              <li><Link href="/history" className="hover:text-orange-500">거래 내역</Link></li>
              <li><Link href="/requests" className="hover:text-orange-500">받은 구매 신청</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-orange-500">공지사항</Link></li>
              <li><Link href="#" className="hover:text-orange-500">자주 묻는 질문</Link></li>
              <li><Link href="#" className="hover:text-orange-500">1:1 문의</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">정책</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-orange-500">이용약관</Link></li>
              <li><Link href="#" className="hover:text-orange-500">개인정보처리방침</Link></li>
              <li><Link href="#" className="hover:text-orange-500">거래 정책</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 중고마켓. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
