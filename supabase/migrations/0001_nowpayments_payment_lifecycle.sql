-- Migration 0001 — NOWPayments payment lifecycle
-- Apply in the Supabase SQL editor (run the whole file once).
-- Replaces the minimal checkout/credits schema with a real, idempotent
-- payment lifecycle: internal orders, token ledger, and atomic fulfillment.

-- ---------------------------------------------------------------------------
-- Extend checkouts: internal order record per NOWPayments checkout/payment
-- ---------------------------------------------------------------------------
alter table public.checkouts
  add column if not exists credits bigint not null default 0,
  add column if not exists plan text,
  add column if not exists interval_days integer,
  add column if not exists currency text not null default 'usd',
  add column if not exists nowpayments_invoice_id text,
  add column if not exists nowpayments_payment_id text,
  add column if not exists nowpayments_purchase_id text,
  add column if not exists nowpayments_subscription_id text,
  add column if not exists nowpayments_plan_id text,
  add column if not exists nowpayments_status text,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists ipn_count integer not null default 0;

create index if not exists checkouts_user_id_idx on public.checkouts (user_id);
create index if not exists checkouts_invoice_id_idx on public.checkouts (nowpayments_invoice_id);

-- ---------------------------------------------------------------------------
-- Token ledger: every token movement (purchase + usage) is recorded once.
-- ---------------------------------------------------------------------------
create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount bigint not null,
  type text not null,
  reference_id text,
  description text,
  created_at timestamptz not null default now(),
  unique (reference_id, type)
);

create index if not exists token_transactions_user_idx
  on public.token_transactions (user_id, created_at desc);

alter table public.token_transactions enable row level security;

create policy "token_transactions_select_own"
  on public.token_transactions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Extend subscriptions: NOWPayments subscription linkage + billing periods
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists nowpayments_subscription_id text,
  add column if not exists nowpayments_plan_id text,
  add column if not exists interval_days integer not null default 30,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancelled_at timestamptz;

-- ---------------------------------------------------------------------------
-- Atomic token ledger insert + balance credit for Slicky-Chat purchases.
-- Called only by the NOWPayments IPN handler (service role).
-- ---------------------------------------------------------------------------
create or replace function public.credit_tokens(
  p_user_id uuid,
  p_amount bigint,
  p_reference_id text,
  p_description text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    return false;
  end if;

  insert into public.token_transactions (user_id, amount, type, reference_id, description)
  values (p_user_id, p_amount, 'PURCHASE', p_reference_id, p_description)
  on conflict (reference_id, type) do nothing;

  insert into public.credits (user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.credits
     set balance = balance + p_amount,
         updated_at = now()
   where user_id = p_user_id;

  return true;
end;
$$;

revoke execute on function public.credit_tokens(uuid, bigint, text, text) from anon, authenticated;
grant execute on function public.credit_tokens(uuid, bigint, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Atomic, idempotent checkout fulfillment.
-- Only reaches the credit/subscription logic when the order flips to paid;
-- a repeated IPN (same order) returns false and does nothing.
-- ---------------------------------------------------------------------------
create or replace function public.fulfill_checkout(
  p_order_id uuid,
  p_payment_id text,
  p_nowpayments_status text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkout record;
  v_interval integer;
  v_nowpayments_plan text;
  v_nowpayments_sub text;
begin
  select *
    into v_checkout
    from public.checkouts
   where id = p_order_id
     for update;

  if v_checkout is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- Idempotency guard: an order is fulfilled at most once.
  if v_checkout.status = 'paid' then
    return false;
  end if;

  update public.checkouts
     set status = 'paid',
         paid_at = now(),
         fulfilled_at = now(),
         nowpayments_payment_id = coalesce(nullif(p_payment_id, ''), nowpayments_payment_id),
         nowpayments_status = p_nowpayments_status,
         ipn_count = ipn_count + 1
   where id = p_order_id
     and status <> 'paid';

  if not found then
    return false;
  end if;

  if v_checkout.mode = 'credits' and v_checkout.credits > 0 then
    perform public.credit_tokens(
      v_checkout.user_id,
      v_checkout.credits,
      v_checkout.id::text,
      coalesce(v_checkout.item, 'Token purchase')
    );
  elsif v_checkout.mode = 'subscription' and v_checkout.plan is not null then
    v_interval := coalesce(v_checkout.interval_days, 30);
    v_nowpayments_plan := coalesce(
      nullif(v_checkout.nowpayments_plan_id, ''),
      v_checkout.plan
    );
    v_nowpayments_sub := coalesce(
      nullif(v_checkout.nowpayments_subscription_id, ''),
      null::text
    );

    insert into public.subscriptions (
      user_id, plan, status, interval_days, nowpayments_plan_id,
      nowpayments_subscription_id, current_period_start, current_period_end,
      cancelled_at, updated_at
    ) values (
      v_checkout.user_id, v_checkout.plan, 'active', v_interval,
      v_nowpayments_plan, v_nowpayments_sub,
      now(), now() + make_interval(days => v_interval),
      null, now()
    )
    on conflict (user_id) do update
      set plan = excluded.plan,
          status = 'active',
          interval_days = excluded.interval_days,
          nowpayments_plan_id = coalesce(
            excluded.nowpayments_plan_id,
            public.subscriptions.nowpayments_plan_id
          ),
          nowpayments_subscription_id = coalesce(
            excluded.nowpayments_subscription_id,
            public.subscriptions.nowpayments_subscription_id
          ),
          current_period_start = excluded.current_period_start,
          current_period_end = excluded.current_period_end,
          cancelled_at = null,
          updated_at = now();
  end if;

  return true;
end;
$$;

revoke execute on function public.fulfill_checkout(uuid, text, text) from anon, authenticated;
grant execute on function public.fulfill_checkout(uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Server-side token spend (Slicky-Chat consumption).
-- Returns the new balance, or -1 when the user has insufficient tokens.
-- Usage cost is decided server-side, never by the client.
-- ---------------------------------------------------------------------------
create or replace function public.spend_tokens(
  p_user_id uuid,
  p_amount bigint,
  p_type text,
  p_reference_id text,
  p_description text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  update public.credits
     set balance = balance - p_amount,
         updated_at = now()
   where user_id = p_user_id
     and balance >= p_amount;

  if not found then
    return -1;
  end if;

  select balance into v_balance
    from public.credits
   where user_id = p_user_id;

  insert into public.token_transactions (user_id, amount, type, reference_id, description)
  values (p_user_id, -p_amount, p_type, p_reference_id, p_description);

  return v_balance;
end;
$$;

revoke execute on function public.spend_tokens(uuid, bigint, text, text, text) from anon, authenticated;
grant execute on function public.spend_tokens(uuid, bigint, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Recurring renewal: extends the active subscription period.
-- Idempotent per NOWPayments payment id (ledger reference).
-- ---------------------------------------------------------------------------
create or replace function public.renew_subscription(
  p_nowpayments_subscription_id text,
  p_payment_id text,
  p_status text default 'finished'
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  if p_nowpayments_subscription_id is null or p_nowpayments_subscription_id = '' then
    return false;
  end if;

  select *
    into v_sub
    from public.subscriptions
   where nowpayments_subscription_id = p_nowpayments_subscription_id
     for update;

  if v_sub is null then
    return false;
  end if;

  if v_sub.cancelled_at is not null then
    return false;
  end if;

  -- Idempotency: each NOWPayments payment may renew the period only once.
  insert into public.token_transactions (user_id, amount, type, reference_id, description)
  values (v_sub.user_id, 0, 'SUBSCRIPTION_RENEWAL', p_payment_id, v_sub.plan || ' renewal')
  on conflict (reference_id, type) do nothing;

  if not found then
    return true;
  end if;

  update public.subscriptions
     set current_period_start = now(),
         current_period_end = now() + make_interval(days => v_sub.interval_days),
         updated_at = now()
   where user_id = v_sub.user_id;

  return true;
end;
$$;

revoke execute on function public.renew_subscription(text, text, text) from anon, authenticated;
grant execute on function public.renew_subscription(text, text, text) to service_role;