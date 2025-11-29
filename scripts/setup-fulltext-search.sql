-- Скрипт для настройки полнотекстового поиска PostgreSQL
-- Запустить в базе данных для улучшения поиска

-- 1. Устанавливаем расширение для триграмм (поддержка частичных совпадений)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Создаем функцию для создания tsvector из заголовка и описания
-- Используем русскую конфигурацию 'russian' для учета морфологии
CREATE OR REPLACE FUNCTION listing_search_vector(listing listings)
RETURNS tsvector AS $$
BEGIN
  RETURN 
    setweight(to_tsvector('russian', coalesce(listing.title, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(listing.category, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(listing.description, '')), 'C');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Создаем GIN индекс для быстрого поиска
-- Это ускорит поиск, но замедлит вставку/обновление
CREATE INDEX IF NOT EXISTS idx_listings_search_vector 
ON listings USING GIN (listing_search_vector(listings.*));

-- 4. Создаем индекс для триграмм (для поиска по частичным совпадениям)
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm 
ON listings USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_category_trgm 
ON listings USING GIN (category gin_trgm_ops);

-- Пример использования в запросе:
-- SELECT * FROM listings 
-- WHERE listing_search_vector(listings.*) @@ to_tsquery('russian', 'бытовка')
-- ORDER BY ts_rank(listing_search_vector(listings.*), to_tsquery('russian', 'бытовка')) DESC;

