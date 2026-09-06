-- Migration 0004 — Customer sending wallet address on checkouts.
-- The wallet the customer pays FROM, captured on the dedicated pay-in page
-- (used for refunds / records; passed through as payout_address where the
-- NOWPayments endpoint supports it).
alter table public.checkouts
  add column if not exists wallet_address text;
