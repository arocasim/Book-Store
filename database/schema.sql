-- ============================================
-- Книжковий Світ — PostgreSQL Database Schema
-- ============================================

-- 1. Користувачі
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    theme       VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Категорії книг
CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Видавництва
CREATE TABLE publishers (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL
);

-- 4. Автори
CREATE TABLE authors (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL
);

-- 5. Книги
CREATE TABLE books (
    id             SERIAL PRIMARY KEY,
    title          VARCHAR(300) NOT NULL,
    author_id      INT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    category_id    INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    publisher_id   INT REFERENCES publishers(id) ON DELETE SET NULL,
    isbn           VARCHAR(20) UNIQUE,
    price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2) CHECK (original_price >= 0),
    discount       NUMERIC(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    description    TEXT,
    image          VARCHAR(500),
    rating         NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    pages          INT CHECK (pages > 0),
    language       VARCHAR(50) DEFAULT 'Українська',
    year           INT CHECK (year > 0),
    featured       BOOLEAN DEFAULT FALSE,
    special        BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Відгуки
CREATE TABLE reviews (
    id         SERIAL PRIMARY KEY,
    book_id    INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (book_id, user_id)
);

-- 7. Кошик
CREATE TABLE cart_items (
    id       SERIAL PRIMARY KEY,
    user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id  INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (user_id, book_id)
);

-- 8. Список читання
CREATE TABLE reading_list (
    id      SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, book_id)
);

-- 9. Замовлення
CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total          NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    status         VARCHAR(50) DEFAULT 'Підтверджено',
    customer_name  VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    city           VARCHAR(100),
    address        VARCHAR(300),
    postal_code    VARCHAR(10),
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Позиції замовлення
CREATE TABLE order_items (
    id        SERIAL PRIMARY KEY,
    order_id  INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id   INT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    quantity  INT NOT NULL CHECK (quantity > 0),
    price     NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- 11. Спеціальні пропозиції
CREATE TABLE special_offers (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    original_price   NUMERIC(10, 2) NOT NULL,
    discounted_price NUMERIC(10, 2) NOT NULL,
    discount         NUMERIC(5, 2) NOT NULL CHECK (discount >= 0 AND discount <= 100),
    active           BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Книги у спеціальних пропозиціях (зв'язок M:N)
CREATE TABLE special_offer_books (
    offer_id INT NOT NULL REFERENCES special_offers(id) ON DELETE CASCADE,
    book_id  INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    PRIMARY KEY (offer_id, book_id)
);

-- ============================================
-- Індекси для оптимізації запитів
-- ============================================

CREATE INDEX idx_books_author      ON books(author_id);
CREATE INDEX idx_books_category    ON books(category_id);
CREATE INDEX idx_books_price       ON books(price);
CREATE INDEX idx_books_rating      ON books(rating DESC);
CREATE INDEX idx_books_year        ON books(year);
CREATE INDEX idx_reviews_book      ON reviews(book_id);
CREATE INDEX idx_reviews_user      ON reviews(user_id);
CREATE INDEX idx_cart_user         ON cart_items(user_id);
CREATE INDEX idx_reading_list_user ON reading_list(user_id);
CREATE INDEX idx_orders_user       ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_users_firebase    ON users(firebase_uid);

-- ============================================
-- Тригер: автоматичне оновлення рейтингу книги
-- ============================================

CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE books
    SET rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM reviews
        WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    ), 0)
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_book_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_book_rating();
