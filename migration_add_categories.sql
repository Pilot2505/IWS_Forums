-- Thêm cột categories vào bảng users
-- Chạy lệnh này trong MySQL để migrate DB hiện tại
ALTER TABLE users ADD COLUMN IF NOT EXISTS categories JSON DEFAULT NULL;
