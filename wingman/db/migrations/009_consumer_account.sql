-- Consumer account: persist Stripe TEST customer + receipt hints.
-- last4 / receipt_url come from Stripe after a real paid session. Never store PAN.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS card_last4 text,
  ADD COLUMN IF NOT EXISTS card_brand text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_uidx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payments_request_status_idx
  ON payments (request_id, status);

DROP POLICY IF EXISTS payments_write ON payments;
CREATE POLICY payments_write ON payments FOR INSERT
  WITH CHECK (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM booking_requests r WHERE r.id = request_id AND r.customer_id = app_user_id())
  );

DROP POLICY IF EXISTS payments_update ON payments;
CREATE POLICY payments_update ON payments FOR UPDATE
  USING (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM booking_requests r WHERE r.id = request_id AND r.customer_id = app_user_id())
  )
  WITH CHECK (
    app_is_operator()
    OR EXISTS (SELECT 1 FROM booking_requests r WHERE r.id = request_id AND r.customer_id = app_user_id())
  );
