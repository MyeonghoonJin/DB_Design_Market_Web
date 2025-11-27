-- reviews 테이블의 score 체크 제약조건 수정 (0~5점으로 변경)
USE market_db;

-- MySQL에서는 CHECK 제약조건 변경을 위해 컬럼을 수정
ALTER TABLE reviews MODIFY COLUMN score INT NOT NULL;
