-- Migration 0002 — Direct-payment deposit details on checkouts.
-- Store the NOWPayments deposit address/amount so our checkout UI can render
-- "pay exactly this amount to this address" without a hosted redirect.
alter table public.checkouts
  add column if not exists pay_address text,
  add column if not exists pay_currency text,
  add column if not exists pay_amount numeric;