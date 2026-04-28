-- Create platform_stats table
create table if not exists public.platform_stats (
  id uuid primary key default gen_random_uuid(),
  label varchar not null,
  value varchar not null,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial hardcoded values
insert into public.platform_stats (label, value, display_order)
values 
  ('Gyms', '500+', 1),
  ('Cities', '25+', 2),
  ('Members', '50k+', 3),
  ('Bookings', '1M+', 4);
