-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание enum типов если они еще не существуют
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('RESIDENT', 'CONTRACTOR', 'ADMIN', 'MODERATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создание администратора по умолчанию
INSERT INTO users (id, phone, first_name, last_name, role, status, created_at)
VALUES 
  (uuid_generate_v4(), '+79991234567', 'Admin', 'User', 'ADMIN', 'VERIFIED', NOW())
ON CONFLICT (phone) DO NOTHING;

-- Добавление экстренных контактов
INSERT INTO emergency_contacts (id, name, phone, description, sort_order, created_at)
VALUES 
  (uuid_generate_v4(), 'Газовая служба', '104', 'Аварийная газовая служба', 1, NOW()),
  (uuid_generate_v4(), 'Охрана поселка', '+79991112233', 'Служба безопасности поселка', 2, NOW()),
  (uuid_generate_v4(), 'Управляющая компания', '+79994445566', 'УК НашПоселок', 3, NOW())
ON CONFLICT DO NOTHING;