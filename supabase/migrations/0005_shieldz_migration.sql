-- Migration 0005 — Replace NOWPayments with Shieldz.
-- Apply in the Supabase SQL editor (run the whole file once), after 0001–0004.
--
-- Removes the NOWPayments-specific columns, keeps the processor-neutral order
-- lifecycle, and adds the Shieldz invoice fields plus a webhook-delivery
-- idempotency table (X-Shieldz-Delivery dedup).

-- ---------------------------------------------------------------------------
-- Shieldz webhook deliveries (at-least-once delivery dedup)
-- ---------------------------------------------------------------------------
create table if not exists public.shieldz_webhook_deliveries (
  delivery_id text primary key,
  event_type text not null,
  invoice_id text not null,
  raw_body text,
  handled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists shieldz_deliveries_invoice_idx
  on public.shieldz_webhook_deliveries (invoice_id);

-- Only the service role (RLS-bypassing) reads/writes deliveries. No anon or
-- authenticated policies exist, so those roles are denied entirely — raw
-- webhook bodies are sensitive and must never be exposed to the app.
alter table public.shieldz_webhook_deliveries enable row level security;

-- ---------------------------------------------------------------------------
-- Drop provider-specific functions before their columns are removed
-- ---------------------------------------------------------------------------
drop function if exists public.renew_subscription(text, text, text);

create or replace function public.fulfill_checkout(
  p_order_id uuid,
  p_payment_id text,
  p_payment_status text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkout record;
  v_interval integer;
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
         shieldz_invoice_id = coalesce(nullif(p_payment_id, ''), shieldz_invoice_id),
         shieldz_status = p_payment_status,
         updated_at = now()
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

    insert into public.subscriptions (
      user_id, plan, status, interval_days,
      current_period_start, current_period_end, cancelled_at, updated_at
    ) values (
      v_checkout.user_id, v_checkout.plan, 'active', v_interval,
      now(), now() + make_interval(days => v_interval),
      null, now()
    )
    on conflict (user_id) do update
      set plan = excluded.plan,
          status = 'active',
          interval_days = excluded.interval_days,
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
-- Checkouts: Shieldz invoice fields
-- ---------------------------------------------------------------------------
alter table public.checkouts
  add column if not exists shieldz_invoice_id text,
  add column if not exists shieldz_status text,
  add column if not exists payment_url text;

create index if not exists checkouts_shieldz_invoice_idx
  on public.checkouts (shieldz_invoice_id);

-- ---------------------------------------------------------------------------
-- Checkouts: drop NOWPayments-only columns
-- ---------------------------------------------------------------------------
alter table public.checkouts
  drop column if exists nowpayments_invoice_id,
  drop column if exists nowpayments_payment_id,
  drop column if exists nowpayments_purchase_id,
  drop column if exists nowpayments_subscription_id,
  drop column if exists nowpayments_plan_id,
  drop column if exists nowpayments_status,
  drop column if exists pay_address,
  drop column if exists pay_currency,
  drop column if exists pay_amount,
  drop column if exists ipn_count;

drop index if exists public.checkouts_invoice_id_idx;

-- ---------------------------------------------------------------------------
-- Subscriptions: drop NOWPayments-only columns
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  drop column if exists nowpayments_subscription_id,
  drop column if exists nowpayments_plan_id,
  drop column if exists nowpayments_status;