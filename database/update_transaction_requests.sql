-- 거래 신청 테이블 업데이트 (채팅방 기반으로 변경)
-- 기존 테이블 삭제 후 재생성

USE market_db;

-- 기존 transaction_requests 테이블 삭제
DROP TABLE IF EXISTS transaction_requests;

-- 거절 기록 테이블 생성 (재신청 방지용)
CREATE TABLE IF NOT EXISTS rejected_requests (
    rejection_id INT AUTO_INCREMENT PRIMARY KEY,        -- 거절 기록 번호 (PK)
    product_id INT NOT NULL,                            -- 물품 번호 (FK)
    buyer_id VARCHAR(50) NOT NULL,                      -- 구매자 아이디 (FK)
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 거절 일시
    UNIQUE KEY unique_rejection (product_id, buyer_id), -- 중복 방지
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 거래 신청 테이블 재생성 (채팅방 기반)
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

-- 확인
DESCRIBE transaction_requests;
DESCRIBE rejected_requests;
