-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Roles Table
create table public.roles (
  id varchar primary key,
  name varchar not null
);

-- 8. Create Cities Table
create table public.cities (
  id varchar primary key default uuid_generate_v4()::text,
  name varchar not null,
  image varchar,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.roles (id, name) values 
  ('super_admin', 'Super Admin'),
  ('partner', 'Gym Partner'),
  ('user', 'Customer');

-- 2. Create Profiles Table (Linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role_id varchar references public.roles(id) default 'user',
  email varchar not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Gyms Table
create table public.gyms (
  id varchar primary key default uuid_generate_v4()::text,
  partner_id uuid references public.profiles(id),
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
  gym_id varchar references public.gyms(id) on delete cascade, -- null if global plan
  name varchar not null,
  price varchar not null,
  features text[],
  button_text varchar default 'Book Now',
  popular boolean default false
);

-- 6. Create Bookings Table
create table public.bookings (
  id varchar primary key default uuid_generate_v4()::text,
  user_id uuid references public.profiles(id),
  gym_id varchar references public.gyms(id),
  plan_name varchar not null,
  amount numeric not null,
  status varchar default 'completed',
  payment_id varchar,           -- Razorpay payment ID (e.g. pay_xxxx)
  razorpay_order_id varchar,    -- Razorpay order ID (e.g. order_xxxx)
  start_date timestamp with time zone default timezone('utc'::text, now()),
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Run these ALTER statements if the table already exists:
-- alter table public.bookings add column if not exists payment_id varchar;
-- alter table public.bookings add column if not exists razorpay_order_id varchar;
-- alter table public.bookings add column if not exists start_date timestamp with time zone default timezone('utc'::text, now());
-- alter table public.bookings add column if not exists end_date timestamp with time zone;

-- 7. Create Wallet Table
create table public.wallet (
  id varchar primary key default 'platform_wallet',
  balance numeric default 0.0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- INSERT MOCK DATA TO PREVENT UI BREAKAGE
-- ==========================================

-- Insert Default Wallet
insert into public.wallet (id, balance) values ('platform_wallet', 154000.00);

-- Insert Mock Gyms
insert into public.gyms (id, name, location, distance, rating, reviews, price_per_day, image, status, hours, description, tags, gallery, amenities) values
(
  '1', 
  'Iron Paradise Gym', 
  'Road No. 12, Banjara Hills, Hyderabad', 
  '1.2 km away', 
  4.8, 
  234, 
  99, 
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800', 
  'Open', 
  '5:00 AM - 11:00 PM', 
  'Iron Paradise is a premium fitness center in the heart of Banjara Hills. With state-of-the-art equipment, certified trainers, and a motivating environment, we help you achieve your fitness goals.',
  ARRAY['AC', 'Trainer', 'Steam Room'],
  ARRAY['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800'],
  ARRAY['AC', 'Personal Trainer', 'Parking', 'Locker Room', 'WiFi', 'Supplements']
),
(
  '2', 
  'Fit & Flex Studio', 
  'Indiranagar, Bangalore', 
  '2.5 km away', 
  4.5, 
  128, 
  149, 
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800', 
  'Open', 
  '6:00 AM - 10:00 PM', 
  'Fit & Flex Studio offers a unique blend of high-intensity training and mindful movement. Join our vibrant community to get fit in a fun, supportive atmosphere.',
  ARRAY['Yoga', 'Zumba', 'Shower'],
  ARRAY['https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800'],
  ARRAY['AC', 'Shower', 'WiFi', 'Zumba Classes', 'Yoga Mats']
);

-- Insert Global Pricing Plans
insert into public.pricing_plans (id, name, price, features, button_text, popular) values
('plan_1', 'Daily Pack', '₹99', ARRAY['Access to 1 Gym', 'Valid for 24 Hours', 'Locker Access', 'Basic Amenities'], 'Buy Now', false),
('plan_2', '10-Day Pack', '₹799', ARRAY['Access to any Gym', 'Valid for 30 Days', 'Free Trainer Consultation', 'Priority Support'], 'Buy Now', true),
('plan_3', 'Monthly Pack', '₹1,999', ARRAY['Unlimited Access', 'All Cities', 'Personal Trainer (2 Sessions)', 'Free Merchandise'], 'Buy Now', false);

-- Insert Mock Cities
insert into public.cities (name, image) values
('Bangalore', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400'),
('Mumbai',    'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=400'),
('Delhi',     'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=400'),
('Hyderabad', 'https://images.unsplash.com/photo-1574007557239-acf6863bc375?auto=format&fit=crop&q=80&w=400');

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- Basic open read policies so the UI never breaks
-- ==========================================
alter table public.gyms enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.trainers enable row level security;
alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.wallet enable row level security;

create policy "Enable read access for all users" on public.gyms for select using (true);
create policy "Enable read access for all users" on public.pricing_plans for select using (true);
create policy "Enable read access for all users" on public.trainers for select using (true);
create policy "Enable read access for all users" on public.cities for select using (true);
create policy "Enable read access for all users" on public.wallet for select using (true);

-- Profiles: users can only read their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

-- Bookings: users can only read their own bookings
create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
