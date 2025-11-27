-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS market_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE market_db;

-- 1. 회원 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,                    -- 아이디 (PK)
    password VARCHAR(255) NOT NULL,                     -- 비밀번호
    name VARCHAR(50) NOT NULL,                          -- 이름
    address VARCHAR(255) NOT NULL,                      -- 주소지
    phone VARCHAR(20) NOT NULL,                         -- 전화번호
    grade ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') DEFAULT 'BRONZE',  -- 등급
    points INT DEFAULT 1000,                            -- 적립금 (가입 시 1000원)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP      -- 가입일
);

-- 2. 물품 테이블
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,          -- 물품 번호 (PK)
    seller_id VARCHAR(50) NOT NULL,                     -- 판매자 아이디 (FK)
    title VARCHAR(100) NOT NULL,                        -- 물품명
    price INT NOT NULL,                                 -- 물품 가격
    description TEXT,                                   -- 물품 설명
    category VARCHAR(50) NOT NULL,                      -- 카테고리
    status ENUM('SALE', 'RESERVED', 'SOLD') DEFAULT 'SALE',  -- 판매 상태
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 등록일자
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. 물품 이미지 테이블
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,            -- 이미지 번호 (PK)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    url VARCHAR(500) NOT NULL,                          -- 이미지 URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 4. 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,      -- 거래 번호 (PK)
    seller_id VARCHAR(50) NOT NULL,                     -- 판매자 아이디 (FK)
    buyer_id VARCHAR(50) NOT NULL,                      -- 구매자 아이디 (FK)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 거래 일시
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 5. 거래 후기 테이블
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,           -- 후기 번호 (PK)
    transaction_id INT NOT NULL UNIQUE,                 -- 거래 번호 (FK, 1:1 관계)
    buyer_id VARCHAR(50) NOT NULL,                      -- 구매자 아이디 (FK)
    score INT NOT NULL CHECK (score >= 1 AND score <= 5), -- 평점 (1-5)
    content TEXT,                                       -- 후기 내용
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 작성 일시
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. 찜하기 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS wishlists (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,         -- 찜하기 번호 (PK)
    user_id VARCHAR(50) NOT NULL,                       -- 회원 아이디 (FK)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 관심 등록 일자
    UNIQUE KEY unique_wishlist (user_id, product_id),   -- 중복 찜 방지
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 7. 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,             -- 채팅방 번호 (PK)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    seller_id VARCHAR(50) NOT NULL,                     -- 판매자 아이디 (FK)
    buyer_id VARCHAR(50) NOT NULL,                      -- 구매자 아이디 (FK)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 생성 일시
    UNIQUE KEY unique_chatroom (product_id, seller_id, buyer_id), -- 중복 채팅방 방지
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 8. 메세지 테이블
CREATE TABLE IF NOT EXISTS messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,          -- 메세지 번호 (PK)
    room_id INT NOT NULL,                               -- 채팅방 번호 (FK)
    sender_id VARCHAR(50) NOT NULL,                     -- 작성자 아이디 (FK)
    content TEXT NOT NULL,                              -- 메세지 내용
    message_type ENUM('TEXT', 'SYSTEM') DEFAULT 'TEXT', -- 메세지 타입
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        -- 전송 일시
    is_read BOOLEAN DEFAULT FALSE,                      -- 읽음 여부
    FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. 거래 신청 테이블 (채팅방 기반)
CREATE TABLE IF NOT EXISTS transaction_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,          -- 신청 번호 (PK)
    room_id INT NOT NULL UNIQUE,                        -- 채팅방 번호 (FK, 1:1 관계)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    buyer_id VARCHAR(50) NOT NULL,                      -- 구매자 아이디 (FK)
    seller_id VARCHAR(50) NOT NULL,                     -- 판매자 아이디 (FK)
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',  -- 신청 상태
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 신청 일시
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. 거절 기록 테이블 (재신청 방지용)
CREATE TABLE IF NOT EXISTS rejected_requests (
    rejection_id INT AUTO_INCREMENT PRIMARY KEY,        -- 거절 기록 번호 (PK)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    buyer_id VARCHAR(50) NOT NULL,                      -- 구매자 아이디 (FK)
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 거절 일시
    UNIQUE KEY unique_rejection (product_id, buyer_id), -- 중복 방지
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_transaction_requests_product ON transaction_requests(product_id);
CREATE INDEX idx_transaction_requests_buyer ON transaction_requests(buyer_id);
CREATE INDEX idx_transaction_requests_seller ON transaction_requests(seller_id);
CREATE INDEX idx_transaction_requests_room ON transaction_requests(room_id);
CREATE INDEX idx_rejected_requests_product ON rejected_requests(product_id);
CREATE INDEX idx_rejected_requests_buyer ON rejected_requests(buyer_id);
