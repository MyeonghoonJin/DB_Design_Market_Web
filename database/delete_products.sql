-- 모든 상품 삭제 SQL
-- 주의: 이 스크립트를 실행하면 모든 상품과 관련 데이터가 삭제됩니다!

-- 관련 테이블 데이터도 CASCADE로 자동 삭제됨:
-- - product_images (상품 이미지)
-- - wishlists (찜 목록)
-- - chat_rooms (채팅방) -> messages (메시지)
-- - transaction_requests (거래 신청)
-- - transactions (거래 내역) -> reviews (후기)

-- Safe update mode 비활성화
SET SQL_SAFE_UPDATES = 0;

-- 모든 상품 삭제
DELETE FROM products;

-- Safe update mode 다시 활성화
SET SQL_SAFE_UPDATES = 1;

-- Auto Increment 리셋 (선택사항)
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE product_images AUTO_INCREMENT = 1;

-- 확인
SELECT COUNT(*) as remaining_products FROM products;
SELECT COUNT(*) as remaining_images FROM product_images;
