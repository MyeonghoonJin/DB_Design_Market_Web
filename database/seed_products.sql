-- 100개 상품 데이터 삽입
-- 실행 전 사용자가 존재해야 합니다. 없으면 아래 주석 해제하여 테스트 사용자 생성
-- INSERT INTO users (user_id, password, name, address, phone) VALUES ('jtvy123', '$2b$10$hashedpassword', '테스트유저', '서울시 강남구', '010-1234-5678');

-- 사용 가능한 이미지 목록 (14개):
-- /uploads/1763889036972-vaws0s.jpg
-- /uploads/1763890807965-5quxq6.png
-- /uploads/1763890807971-20nuo.png
-- /uploads/1763890807978-00z13.jpg
-- /uploads/1763909888022-yk9qre.png
-- /uploads/1763927417004-0xllby.jpg
-- /uploads/ian-dooley-hpTH5b6mo2s-unsplash.jpg
-- /uploads/land-o-lakes-inc-rKdG42oAfSY-unsplash.jpg
-- /uploads/다운로드.jpg
-- /uploads/다운로드 (1).jpg
-- /uploads/다운로드 (2).jpg
-- /uploads/다운로드.png
-- /uploads/images.jpg
-- /uploads/images (1).jpg

-- 카테고리 목록: 전자기기, 의류, 가구/인테리어, 생활용품, 스포츠/레저, 도서/티켓/문구, 뷰티/미용, 반려동물용품, 기타

-- 기존 테스트 상품 삭제 (선택사항)
-- DELETE FROM products WHERE title LIKE '물품%';

-- 상품 100개 삽입
SET @seller_id = 'jtvy123';  -- 실제 존재하는 사용자 ID

-- 물품 1~10 (전자기기)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품1', 10000, '물품1', '전자기기', 'SALE'),
(@seller_id, '물품2', 10000, '물품2', '전자기기', 'SALE'),
(@seller_id, '물품3', 10000, '물품3', '전자기기', 'SALE'),
(@seller_id, '물품4', 10000, '물품4', '전자기기', 'SALE'),
(@seller_id, '물품5', 10000, '물품5', '전자기기', 'SALE'),
(@seller_id, '물품6', 10000, '물품6', '전자기기', 'SALE'),
(@seller_id, '물품7', 10000, '물품7', '전자기기', 'SALE'),
(@seller_id, '물품8', 10000, '물품8', '전자기기', 'SALE'),
(@seller_id, '물품9', 10000, '물품9', '전자기기', 'SALE'),
(@seller_id, '물품10', 10000, '물품10', '전자기기', 'SALE');

-- 물품 11~20 (의류)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품11', 10000, '물품11', '의류', 'SALE'),
(@seller_id, '물품12', 10000, '물품12', '의류', 'SALE'),
(@seller_id, '물품13', 10000, '물품13', '의류', 'SALE'),
(@seller_id, '물품14', 10000, '물품14', '의류', 'SALE'),
(@seller_id, '물품15', 10000, '물품15', '의류', 'SALE'),
(@seller_id, '물품16', 10000, '물품16', '의류', 'SALE'),
(@seller_id, '물품17', 10000, '물품17', '의류', 'SALE'),
(@seller_id, '물품18', 10000, '물품18', '의류', 'SALE'),
(@seller_id, '물품19', 10000, '물품19', '의류', 'SALE'),
(@seller_id, '물품20', 10000, '물품20', '의류', 'SALE');

-- 물품 21~30 (가구/인테리어)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품21', 10000, '물품21', '가구/인테리어', 'SALE'),
(@seller_id, '물품22', 10000, '물품22', '가구/인테리어', 'SALE'),
(@seller_id, '물품23', 10000, '물품23', '가구/인테리어', 'SALE'),
(@seller_id, '물품24', 10000, '물품24', '가구/인테리어', 'SALE'),
(@seller_id, '물품25', 10000, '물품25', '가구/인테리어', 'SALE'),
(@seller_id, '물품26', 10000, '물품26', '가구/인테리어', 'SALE'),
(@seller_id, '물품27', 10000, '물품27', '가구/인테리어', 'SALE'),
(@seller_id, '물품28', 10000, '물품28', '가구/인테리어', 'SALE'),
(@seller_id, '물품29', 10000, '물품29', '가구/인테리어', 'SALE'),
(@seller_id, '물품30', 10000, '물품30', '가구/인테리어', 'SALE');

-- 물품 31~40 (생활용품)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품31', 10000, '물품31', '생활용품', 'SALE'),
(@seller_id, '물품32', 10000, '물품32', '생활용품', 'SALE'),
(@seller_id, '물품33', 10000, '물품33', '생활용품', 'SALE'),
(@seller_id, '물품34', 10000, '물품34', '생활용품', 'SALE'),
(@seller_id, '물품35', 10000, '물품35', '생활용품', 'SALE'),
(@seller_id, '물품36', 10000, '물품36', '생활용품', 'SALE'),
(@seller_id, '물품37', 10000, '물품37', '생활용품', 'SALE'),
(@seller_id, '물품38', 10000, '물품38', '생활용품', 'SALE'),
(@seller_id, '물품39', 10000, '물품39', '생활용품', 'SALE'),
(@seller_id, '물품40', 10000, '물품40', '생활용품', 'SALE');

-- 물품 41~50 (스포츠/레저)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품41', 10000, '물품41', '스포츠/레저', 'SALE'),
(@seller_id, '물품42', 10000, '물품42', '스포츠/레저', 'SALE'),
(@seller_id, '물품43', 10000, '물품43', '스포츠/레저', 'SALE'),
(@seller_id, '물품44', 10000, '물품44', '스포츠/레저', 'SALE'),
(@seller_id, '물품45', 10000, '물품45', '스포츠/레저', 'SALE'),
(@seller_id, '물품46', 10000, '물품46', '스포츠/레저', 'SALE'),
(@seller_id, '물품47', 10000, '물품47', '스포츠/레저', 'SALE'),
(@seller_id, '물품48', 10000, '물품48', '스포츠/레저', 'SALE'),
(@seller_id, '물품49', 10000, '물품49', '스포츠/레저', 'SALE'),
(@seller_id, '물품50', 10000, '물품50', '스포츠/레저', 'SALE');

-- 물품 51~60 (도서/티켓/문구)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품51', 10000, '물품51', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품52', 10000, '물품52', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품53', 10000, '물품53', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품54', 10000, '물품54', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품55', 10000, '물품55', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품56', 10000, '물품56', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품57', 10000, '물품57', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품58', 10000, '물품58', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품59', 10000, '물품59', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품60', 10000, '물품60', '도서/티켓/문구', 'SALE');

-- 물품 61~70 (뷰티/미용)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품61', 10000, '물품61', '뷰티/미용', 'SALE'),
(@seller_id, '물품62', 10000, '물품62', '뷰티/미용', 'SALE'),
(@seller_id, '물품63', 10000, '물품63', '뷰티/미용', 'SALE'),
(@seller_id, '물품64', 10000, '물품64', '뷰티/미용', 'SALE'),
(@seller_id, '물품65', 10000, '물품65', '뷰티/미용', 'SALE'),
(@seller_id, '물품66', 10000, '물품66', '뷰티/미용', 'SALE'),
(@seller_id, '물품67', 10000, '물품67', '뷰티/미용', 'SALE'),
(@seller_id, '물품68', 10000, '물품68', '뷰티/미용', 'SALE'),
(@seller_id, '물품69', 10000, '물품69', '뷰티/미용', 'SALE'),
(@seller_id, '물품70', 10000, '물품70', '뷰티/미용', 'SALE');

-- 물품 71~80 (반려동물용품)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품71', 10000, '물품71', '반려동물용품', 'SALE'),
(@seller_id, '물품72', 10000, '물품72', '반려동물용품', 'SALE'),
(@seller_id, '물품73', 10000, '물품73', '반려동물용품', 'SALE'),
(@seller_id, '물품74', 10000, '물품74', '반려동물용품', 'SALE'),
(@seller_id, '물품75', 10000, '물품75', '반려동물용품', 'SALE'),
(@seller_id, '물품76', 10000, '물품76', '반려동물용품', 'SALE'),
(@seller_id, '물품77', 10000, '물품77', '반려동물용품', 'SALE'),
(@seller_id, '물품78', 10000, '물품78', '반려동물용품', 'SALE'),
(@seller_id, '물품79', 10000, '물품79', '반려동물용품', 'SALE'),
(@seller_id, '물품80', 10000, '물품80', '반려동물용품', 'SALE');

-- 물품 81~90 (기타)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품81', 10000, '물품81', '기타', 'SALE'),
(@seller_id, '물품82', 10000, '물품82', '기타', 'SALE'),
(@seller_id, '물품83', 10000, '물품83', '기타', 'SALE'),
(@seller_id, '물품84', 10000, '물품84', '기타', 'SALE'),
(@seller_id, '물품85', 10000, '물품85', '기타', 'SALE'),
(@seller_id, '물품86', 10000, '물품86', '기타', 'SALE'),
(@seller_id, '물품87', 10000, '물품87', '기타', 'SALE'),
(@seller_id, '물품88', 10000, '물품88', '기타', 'SALE'),
(@seller_id, '물품89', 10000, '물품89', '기타', 'SALE'),
(@seller_id, '물품90', 10000, '물품90', '기타', 'SALE');

-- 물품 91~100 (혼합 카테고리)
INSERT INTO products (seller_id, title, price, description, category, status) VALUES
(@seller_id, '물품91', 10000, '물품91', '전자기기', 'SALE'),
(@seller_id, '물품92', 10000, '물품92', '의류', 'SALE'),
(@seller_id, '물품93', 10000, '물품93', '가구/인테리어', 'SALE'),
(@seller_id, '물품94', 10000, '물품94', '생활용품', 'SALE'),
(@seller_id, '물품95', 10000, '물품95', '스포츠/레저', 'SALE'),
(@seller_id, '물품96', 10000, '물품96', '도서/티켓/문구', 'SALE'),
(@seller_id, '물품97', 10000, '물품97', '뷰티/미용', 'SALE'),
(@seller_id, '물품98', 10000, '물품98', '반려동물용품', 'SALE'),
(@seller_id, '물품99', 10000, '물품99', '기타', 'SALE'),
(@seller_id, '물품100', 10000, '물품100', '전자기기', 'SALE');

-- 이미지 삽입 (각 상품에 랜덤 이미지 1개씩) - 14개 이미지 사용
INSERT INTO product_images (product_id, url)
SELECT p.product_id,
  CASE (p.product_id % 14)
    WHEN 0 THEN '/uploads/1763889036972-vaws0s.jpg'
    WHEN 1 THEN '/uploads/1763890807965-5quxq6.png'
    WHEN 2 THEN '/uploads/1763890807971-20nuo.png'
    WHEN 3 THEN '/uploads/1763890807978-00z13.jpg'
    WHEN 4 THEN '/uploads/1763909888022-yk9qre.png'
    WHEN 5 THEN '/uploads/1763927417004-0xllby.jpg'
    WHEN 6 THEN '/uploads/ian-dooley-hpTH5b6mo2s-unsplash.jpg'
    WHEN 7 THEN '/uploads/land-o-lakes-inc-rKdG42oAfSY-unsplash.jpg'
    WHEN 8 THEN '/uploads/다운로드.jpg'
    WHEN 9 THEN '/uploads/다운로드 (1).jpg'
    WHEN 10 THEN '/uploads/다운로드 (2).jpg'
    WHEN 11 THEN '/uploads/다운로드.png'
    WHEN 12 THEN '/uploads/images.jpg'
    WHEN 13 THEN '/uploads/images (1).jpg'
  END as url
FROM products p
WHERE p.title LIKE '물품%' AND p.title REGEXP '^물품[0-9]+$';

-- 확인
SELECT COUNT(*) as total_products FROM products WHERE title LIKE '물품%';
SELECT COUNT(*) as total_images FROM product_images pi JOIN products p ON pi.product_id = p.product_id WHERE p.title LIKE '물품%';
