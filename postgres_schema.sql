-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Roles Table
create table public.roles (
  id varchar primary key,
  name varchar not null
);

insert into public.roles (id, name) values 
  ('super_admin', 'Super Admin'),
  ('partner', 'Gym Partner'),
  ('user', 'Customer');

-- 2. Create Standalone Users Table (Replaces Supabase Auth)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  role_id varchar references public.roles(id) default 'user',
  email varchar unique not null,
  full_name varchar,
  phone varchar,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Gyms Table
create table public.gyms (
  id varchar primary key default uuid_generate_v4()::text,
  partner_id uuid references public.users(id),
  name varchar not null,
  location varchar not null,
  distance varchar,
  rating numeric(3,1) default 0.0,
  reviews integer default 0,
  price_per_day numeric default 0,
  image varchar,
  status varchar default 'Closed',
  hours varchar,
  description text,
  tags text[],
  gallery text[],
  amenities text[],
  has_offer boolean default false,
  offer_percentage numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.5 Create Partner Requests Table
create table public.partner_requests (
  id varchar primary key default uuid_generate_v4()::text,
  gym_name varchar not null,
  owner_name varchar not null,
  email varchar not null,
  phone varchar not null,
  city varchar not null,
  address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Trainers Table
create table public.trainers (
  id varchar primary key default uuid_generate_v4()::text,
  gym_id varchar references public.gyms(id) on delete cascade,
  name varchar not null,
  specialty varchar,
  avatar varchar
);

-- 5. Create Pricing Plans Table
create table public.pricing_plans (
  id varchar primary key default uuid_generate_v4()::text,
  gym_id varchar references public.gyms(id) on delete cascade,
  name varchar not null,
  price varchar not null,
  features text[],
  button_text varchar default 'Book Now',
  popular boolean default false
);

-- 6. Create Bookings Table
create table public.bookings (
  id varchar primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id),
  gym_id varchar references public.gyms(id),
  plan_name varchar not null,
  amount numeric not null,
  status varchar default 'completed',
  payment_id varchar,
  razorpay_order_id varchar,
  start_date timestamp with time zone default timezone('utc'::text, now()),
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create Wallet Table
create table public.wallet (
  id varchar primary key default 'platform_wallet',
  balance numeric default 0.0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create Cities Table
create table public.cities (
  id varchar primary key default uuid_generate_v4()::text,
  name varchar not null,
  image varchar,
  is_featured boolean default false,
  is_coming_soon boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create Platform Stats Table
create table public.platform_stats (
  id varchar primary key,
  label varchar not null,
  value varchar not null,
  display_order integer default 0
);

-- 10. Create Amenities Table
create table public.amenities (
  id varchar primary key default uuid_generate_v4()::text,
  name varchar not null
);

-- ==========================================
-- INSERT MOCK DATA 
-- ==========================================

insert into public.wallet (id, balance) values ('platform_wallet', 154000.00);

insert into public.platform_stats (id, label, value, display_order) values 
('00000000-0000-0000-0000-000000000000', 'Visibility', 'true', 0),
('1', 'Total Users', '50K+', 1),
('2', 'Active Gyms', '200+', 2),
('3', 'Cities', '15+', 3);

insert into public.cities (name, image) values
('Bangalore', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400'),
('Mumbai',    'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=400');
