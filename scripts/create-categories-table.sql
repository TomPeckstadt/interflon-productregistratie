-- Maak de categories tabel aan
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Voor hex kleuren zoals #ff0000
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voeg een index toe voor snellere queries
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Voeg een category_id kolom toe aan de products tabel (als deze nog niet bestaat)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Voeg een index toe voor de foreign key
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Voeg wat voorbeeld categorieën toe
INSERT INTO categories (name, description, color) VALUES 
  ('Smeermiddelen', 'Hoogwaardige smeermiddelen voor industriële toepassingen', '#22c55e'),
  ('Reinigingsmiddelen', 'Professionele reinigingsproducten voor machines en onderdelen', '#3b82f6'),
  ('Onderhoudsmiddelen', 'Producten voor preventief en correctief onderhoud', '#f97316'),
  ('Beschermingsmiddelen', 'Coatings en beschermende middelen', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;
