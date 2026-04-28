-- Add offer columns to gyms table
alter table public.gyms 
add column if not exists has_offer boolean default false,
add column if not exists offer_percentage integer default 0;
