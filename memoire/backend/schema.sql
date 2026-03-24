-- ============================================================
-- Waslha Logistics Platform – Supabase Database Schema
-- Run this in the Supabase SQL Editor (or via psql)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. DELIVERY COMPANIES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_companies (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE
);

-- ────────────────────────────────────────────────────────────
-- 2. PROFILES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               TEXT NOT NULL UNIQUE,
    password            TEXT NOT NULL,
    full_name           TEXT NOT NULL,
    role                TEXT NOT NULL CHECK (role IN ('merchant', 'delivery')),
    phone               TEXT,
    address             TEXT,
    preferred_delivery  TEXT,
    delivery_company    TEXT
);

-- ────────────────────────────────────────────────────────────
-- 3. ORDERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    merchant_id       BIGINT NOT NULL REFERENCES profiles(id),
    first_name        TEXT NOT NULL,
    last_name         TEXT NOT NULL,
    customer_address  TEXT NOT NULL,
    product_name      TEXT NOT NULL,
    wilaya            TEXT NOT NULL,
    weight            NUMERIC(10,2) NOT NULL CHECK (weight > 0),
    notes             TEXT DEFAULT '',
    phone             TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','in_progress','delivered','refused','returned','cancelled')),
    delivery_company  TEXT NOT NULL,
    delivery_type     TEXT NOT NULL CHECK (delivery_type IN ('domicile','bureau')),
    delivery_note     TEXT DEFAULT '',
    started_at        BIGINT,                         -- epoch ms (Date.now())
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. ORDER TIMELINES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_timelines (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id  BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status    TEXT NOT NULL,
    date      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_orders_merchant       ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_co    ON orders(delivery_company);
CREATE INDEX IF NOT EXISTS idx_orders_created        ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timelines_order       ON order_timelines(order_id);

-- ────────────────────────────────────────────────────────────
-- 6. ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE delivery_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timelines    ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 7. RLS POLICIES
--    The app uses the anon key (no Supabase Auth), so policies
--    grant access to the anon role for all needed operations.
-- ────────────────────────────────────────────────────────────

-- delivery_companies: read-only for everyone
CREATE POLICY "delivery_companies_select"
    ON delivery_companies FOR SELECT
    TO anon
    USING (true);

-- profiles: full CRUD via anon
CREATE POLICY "profiles_select"
    ON profiles FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "profiles_insert"
    ON profiles FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "profiles_update"
    ON profiles FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- orders: full CRUD via anon
CREATE POLICY "orders_select"
    ON orders FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "orders_insert"
    ON orders FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "orders_update"
    ON orders FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "orders_delete"
    ON orders FOR DELETE
    TO anon
    USING (true);

-- order_timelines: full CRUD via anon
CREATE POLICY "timelines_select"
    ON order_timelines FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "timelines_insert"
    ON order_timelines FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "timelines_delete"
    ON order_timelines FOR DELETE
    TO anon
    USING (true);

-- ────────────────────────────────────────────────────────────
-- 8. ENABLE REALTIME for orders table (delivery dashboard)
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ────────────────────────────────────────────────────────────
-- 9. SEED DATA – Delivery Companies
-- ────────────────────────────────────────────────────────────
INSERT INTO delivery_companies (name) VALUES
    ('Express Livraison'),
    ('Rapid Delivery'),
    ('Alger Post'),
    ('Nord Express'),
    ('Sahara Logistique')
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 10. SEED DATA – Sample Delivery Accounts
--     (Delivery users are pre-created; they cannot self-register)
-- ────────────────────────────────────────────────────────────
INSERT INTO profiles (email, password, full_name, role, phone, delivery_company) VALUES
    ('express@waslha.com',  'express123',  'Express Livraison Team', 'delivery', '+213550000001', 'Express Livraison'),
    ('rapid@waslha.com',    'rapid123',    'Rapid Delivery Team',    'delivery', '+213550000002', 'Rapid Delivery'),
    ('algerpost@waslha.com','algerpost123','Alger Post Team',        'delivery', '+213550000003', 'Alger Post'),
    ('nord@waslha.com',     'nord123',     'Nord Express Team',      'delivery', '+213550000004', 'Nord Express'),
    ('sahara@waslha.com',   'sahara123',   'Sahara Logistique Team', 'delivery', '+213550000005', 'Sahara Logistique')
ON CONFLICT (email) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 11. SEED DATA – Sample Merchant Account (for testing)
-- ────────────────────────────────────────────────────────────
INSERT INTO profiles (email, password, full_name, role, phone, address, preferred_delivery) VALUES
    ('merchant@waslha.com', 'merchant123', 'Test Merchant', 'merchant', '+213550000006', 'Algiers, Centre', 'Express Livraison')
ON CONFLICT (email) DO NOTHING;
