-- Chhikara Industries platform schema
-- Apply in the Supabase SQL editor (or via `supabase db push`).

-- ---------------------------------------------------------------------------
-- Profiles (one per auth.uid)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  insert into public.credits (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Products catalog (read-only to the public)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  slug text primary key,
  name text not null,
  tagline text,
  description text,
  status text not null default 'public',
  api boolean not null default true,
  access text not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_read_public"
  on public.products for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- User product entitlements
-- ---------------------------------------------------------------------------
create table if not exists public.user_products (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null references public.products (slug) on delete cascade,
  enabled boolean not null default true,
  quota jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

alter table public.user_products enable row level security;

create policy "user_products_select_own"
  on public.user_products for select
  using (auth.uid() = user_id);

create policy "user_products_update_own"
  on public.user_products for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- API keys (secret stored as SHA-256 hash only)
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  prefix text not null,
  secret_hash text not null,
  scopes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_keys_secret_hash_idx on public.api_keys (secret_hash);

alter table public.api_keys enable row level security;

create policy "api_keys_select_own"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "api_keys_insert_own"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "api_keys_update_own"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Usage accounting
-- ---------------------------------------------------------------------------
create table if not exists public.api_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  api text not null,
  key_id uuid references public.api_keys (id) on delete set null,
  day date not null default current_date,
  requests bigint not null default 0,
  tokens bigint not null default 0,
  errors bigint not null default 0,
  unique (user_id, api, day)
);

alter table public.api_usage enable row level security;

create policy "api_usage_select_own"
  on public.api_usage for select
  using (auth.uid() = user_id);

create policy "api_usage_insert_own"
  on public.api_usage for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Subscriptions & billing
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  interval_days integer not null default 30,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "subscriptions_upsert_own"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_no text not null,
  amount text,
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

alter table public.billing_records enable row level security;

create policy "billing_records_select_own"
  on public.billing_records for select
  using (auth.uid() = user_id);

-- Checkouts created via a Shieldz invoice (crypto or subscription).
create table if not exists public.checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null,
  mode text not null default 'credits',
  crypto text not null default 'btc',
  amount_usd numeric not null,
  credits bigint not null default 0,
  plan text,
  interval_days integer,
  currency text not null default 'usd',
  status text not null default 'pending',
  shieldz_invoice_id text,
  shieldz_status text,
  payment_url text,
  wallet_address text,
  fulfilled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists checkouts_user_id_idx on public.checkouts (user_id);
create index if not exists checkouts_shieldz_invoice_idx on public.checkouts (shieldz_invoice_id);

alter table public.checkouts enable row level security;

create policy "checkouts_select_own"
  on public.checkouts for select
  using (auth.uid() = user_id);

create policy "checkouts_insert_own"
  on public.checkouts for insert
  with check (auth.uid() = user_id);

create policy "checkouts_update_own"
  on public.checkouts for update
  using (auth.uid() = user_id);

-- Shieldz webhook deliveries (at-least-once delivery dedup on X-Shieldz-Delivery).
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

-- Prepaid credit balances.
create table if not exists public.credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.credits enable row level security;

create policy "credits_select_own"
  on public.credits for select
  using (auth.uid() = user_id);

create policy "credits_insert_own"
  on public.credits for insert
  with check (auth.uid() = user_id);

create policy "credits_update_own"
  on public.credits for update
  using (auth.uid() = user_id);

-- Token ledger: every token movement (purchase + usage) is recorded once.
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
-- Support tickets
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  subject text not null,
  product text,
  priority text not null default 'normal',
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

create policy "support_tickets_insert_anon"
  on public.support_tickets for insert
  with check (true);

create policy "support_tickets_select_own"
  on public.support_tickets for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Contact form (public insert, never listed)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "contact_messages_insert_anon"
  on public.contact_messages for insert
  to anon
  with check (true);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic token ledger insert + balance credit (used by the IPN handler).
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
-- Atomic, idempotent checkout fulfillment. Fulfills at most once per order.
-- Granting credits / activating the plan only happens on a fully paid event.
-- ---------------------------------------------------------------------------
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
-- Server-side token spend (Slicky-Chat consumption). Returns new balance,
-- or -1 when the balance is insufficient. Usage cost is decided server-side.
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