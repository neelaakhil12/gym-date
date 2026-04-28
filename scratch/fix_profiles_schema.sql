-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Add missing columns to profiles table
alter table public.profiles 
add column if not exists full_name varchar,
add column if not exists phone varchar;

-- Verification
select * from public.profiles limit 1;
