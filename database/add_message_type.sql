-- messages 테이블에 message_type 컬럼 추가
USE market_db;

ALTER TABLE messages
ADD COLUMN message_type ENUM('TEXT', 'SYSTEM') DEFAULT 'TEXT' AFTER content;
