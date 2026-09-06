-- Migration 0003 — Subscription lifecycle mirrors
-- Adds a NOWPayments subscription-state mirror column and keeps the
-- subscription row in sync when the paid period renews. Apply in the Supabase
-- SQL editor (run the whole file once), after migrations 0001 and 0002.

alter table public.subscriptions
  add column if not exists nowpayments_status text;

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
      nowpayments_subscription_id, nowpayments_status,
      current_period_start, current_period_end, cancelled_at, updated_at
    ) values (
      v_checkout.user_id, v_checkout.plan, 'active', v_interval,
      v_nowpayments_plan, v_nowpayments_sub, 'finished',
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
          nowpayments_status = 'finished',
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
         nowpayments_status = p_status,
         updated_at = now()
   where user_id = v_sub.user_id;

  return true;
end;
$$;

revoke execute on function public.renew_subscription(text, text, text) from anon, authenticated;
grant execute on function public.renew_subscription(text, text, text) to service_role;