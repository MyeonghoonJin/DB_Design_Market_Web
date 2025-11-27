-- users 테이블에 프로필 사진 컬럼 추가
ALTER TABLE users
ADD COLUMN profile_image VARCHAR(500) NULL COMMENT '프로필 이미지 URL';
