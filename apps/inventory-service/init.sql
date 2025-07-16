CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Index for price-based sorting or filtering
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
