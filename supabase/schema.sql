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

-- Checkouts created via NOWPayments invoice (crypto or subscription).
create table if not exists public.checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null,
  mode text not null default 'credits',
  crypto text not null default 'btc',
  amount_usd numeric not null,
  credits integer not null default 0,
  plan text,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

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