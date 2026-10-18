-- Manager brief: Discover → VIP Table or Wingman Experience → cart → pay once →
-- confirm → admin assigns. Prices live in catalog (admin-editable), not code.

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_min_total;
ALTER TABLE quotes ADD CONSTRAINT quotes_min_total CHECK (total_cents >= 1);

CREATE TABLE IF NOT EXISTS experience_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('wingman_experience', 'vip_table')),
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 1),
  included_copy text NOT NULL,
  extras_copy text NOT NULL,
  drink_options text[] NOT NULL DEFAULT '{}',
  max_guests integer,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO experience_catalog (slug, kind, name, price_cents, included_copy, extras_copy, drink_options, max_guests, sort_order)
VALUES
  (
    'nightclub',
    'wingman_experience',
    'Nightclub',
    50000,
    'A hosted nightclub experience. Includes your Wingman for the night and one drink: Tequila, Vodka, or Cognac. Your Wingman is assigned after you pay.',
    'Extra drinks, bottles, food, upgrades, tables, or other purchases are separate.',
    ARRAY['Tequila', 'Vodka', 'Cognac']::text[],
    NULL,
    1
  ),
  (
    'dinner',
    'wingman_experience',
    'Dinner',
    45000,
    'A hosted dinner experience for up to two guests. Includes your Wingman for the evening. Your Wingman is assigned after you pay.',
    'Extra drinks, bottles, food, upgrades, tables, or other purchases are separate.',
    '{}',
    2,
    2
  ),
  (
    'yacht',
    'wingman_experience',
    'Yacht',
    40000,
    'A hosted yacht experience at the base price. Includes your Wingman for the outing. Your Wingman is assigned after you pay.',
    'Extra drinks, bottles, food, upgrades, tables, or other purchases are separate.',
    '{}',
    NULL,
    3
  )
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_payment',
  total_cents integer NOT NULL CHECK (total_cents >= 1),
  stripe_checkout_session_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  request_id uuid REFERENCES booking_requests(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('vip_table', 'wingman_experience')),
  catalog_id uuid REFERENCES experience_catalog(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES wingman_event_offers(id) ON DELETE SET NULL,
  drink_option text,
  guest_count integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 1),
  venue_name text,
  experience_name text NOT NULL,
  starts_at timestamptz,
  status text NOT NULL DEFAULT 'pending_payment',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS catalog_id uuid REFERENCES experience_catalog(id) ON DELETE SET NULL;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS drink_option text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS booking_kind text;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS booking_requests_order_idx ON booking_requests (order_id);

ALTER TABLE experience_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_catalog FORCE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_select ON experience_catalog;
CREATE POLICY catalog_select ON experience_catalog FOR SELECT USING (true);
DROP POLICY IF EXISTS catalog_write ON experience_catalog;
CREATE POLICY catalog_write ON experience_catalog FOR ALL
  USING (app_is_operator()) WITH CHECK (app_is_operator());

DROP POLICY IF EXISTS orders_select ON orders;
CREATE POLICY orders_select ON orders FOR SELECT
  USING (customer_id = app_user_id() OR app_is_operator());
DROP POLICY IF EXISTS orders_insert ON orders;
CREATE POLICY orders_insert ON orders FOR INSERT
  WITH CHECK (customer_id = app_user_id() OR app_is_operator());
DROP POLICY IF EXISTS orders_update ON orders;
CREATE POLICY orders_update ON orders FOR UPDATE
  USING (customer_id = app_user_id() OR app_is_operator());

DROP POLICY IF EXISTS order_items_select ON order_items;
CREATE POLICY order_items_select ON order_items FOR SELECT
  USING (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = app_user_id())
  );
DROP POLICY IF EXISTS order_items_write ON order_items;
CREATE POLICY order_items_write ON order_items FOR ALL
  USING (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = app_user_id())
  )
  WITH CHECK (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = app_user_id())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON
  experience_catalog, orders, order_items
TO wingman_rls;
