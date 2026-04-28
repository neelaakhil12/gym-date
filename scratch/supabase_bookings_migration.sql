-- ============================================================
-- GymDate — Razorpay Migration
-- Run this in your Supabase SQL editor if the bookings table
-- already exists from the original setup.
-- ============================================================

-- Add Razorpay payment tracking columns
alter table public.bookings 
  add column if not exists payment_id varchar,
  add column if not exists razorpay_order_id varchar,
  add column if not exists start_date timestamp with time zone default timezone('utc'::text, now()),
  add column if not exists end_date timestamp with time zone;

-- Allow service-role inserts (already bypasses RLS, but good to document)
-- The verify API uses the service-role key so bookings are created safely.

-- (Optional) If you want to test from the client directly:
-- create policy "Users can insert own bookings" on public.bookings
--   for insert with check (auth.uid() = user_id);
