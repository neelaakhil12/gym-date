-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Add missing columns to bookings table to store customer details
alter table public.bookings 
add column if not exists customer_name varchar,
add column if not exists customer_phone varchar,
add column if not exists customer_email varchar;

-- Verification
select * from public.bookings limit 5;
