-- Mazad Tech starter schema. Review and test policies before production.
create extension if not exists pgcrypto;

create type public.profile_status as enum ('pending', 'active', 'suspended', 'rejected');
create type public.product_condition as enum ('working', 'known_defect', 'untested');
create type public.product_review_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
create type public.auction_status as enum ('draft', 'pending_review', 'scheduled', 'live', 'ended', 'awaiting_winner_payment', 'reopened', 'closed', 'cancelled');
create type public.payment_kind as enum ('listing_fee', 'winner_fee', 'refund');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone_e164 text not null unique,
  status public.profile_status not null default 'pending',
  is_admin boolean not null default false,
  strike_count integer not null default 0 check (strike_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 5 and 160),
  category text not null,
  description text not null,
  condition public.product_condition not null,
  defect_details text,
  tested_details text,
  specs jsonb not null default '{}'::jsonb,
  image_urls text[] not null default '{}',
  review_status public.product_review_status not null default 'pending',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (condition <> 'known_defect' or nullif(trim(defect_details), '') is not null)
);

create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id),
  seller_id uuid not null references public.profiles(id),
  starting_price numeric(12,2) not null check (starting_price >= 1),
  current_price numeric(12,2) not null check (current_price >= 0),
  min_increment numeric(12,2) not null default 10 check (min_increment >= 10),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.auction_status not null default 'pending_review',
  reopen_count integer not null default 0 check (reopen_count between 0 and 2),
  winner_id uuid references public.profiles(id),
  winner_payment_deadline timestamptz,
  final_winner_fee_paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null check (amount >= 1),
  created_at timestamptz not null default now(),
  is_valid boolean not null default true,
  invalid_reason text
);
create index bids_auction_created_idx on public.bids(auction_id, created_at desc);
create index bids_bidder_idx on public.bids(bidder_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  auction_id uuid references public.auctions(id),
  kind public.payment_kind not null,
  amount numeric(12,2) not null check (amount > 0),
  status public.payment_status not null default 'pending',
  provider text,
  provider_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_user_id uuid references public.profiles(id),
  auction_id uuid references public.auctions(id),
  reason text not null,
  description text not null,
  evidence_urls text[] not null default '{}',
  status text not null default 'open' check (status in ('open','under_review','resolved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- RLS is enabled immediately. Add and test granular policies before enabling client writes.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;
alter table public.payments enable row level security;
alter table public.reports enable row level security;

-- Public read policies intentionally expose only approved product and auction information.
create policy "approved products visible to everyone" on public.products
  for select using (review_status = 'approved');
create policy "live auction summary visible to everyone" on public.auctions
  for select using (status in ('scheduled','live','ended','awaiting_winner_payment','reopened','closed'));

-- NOTE: Do not add broad policies for profiles, bids, or payments. Their sensitive data must
-- be served through carefully scoped server-side functions/RPCs after verifying authorization.
-- Implement bid placement, auction closing, payment webhooks, and winner contact reveal server-side
-- using trusted transactions; never trust a browser-provided winner, amount, or payment status.
