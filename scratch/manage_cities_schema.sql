-- Ensure cities table exists and has necessary columns
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name varchar not null unique,
  image varchar,
  is_featured boolean default false,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial cities if table is empty
insert into public.cities (name, image, is_featured, display_order)
select 'Bangalore', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=1000', true, 1
where not exists (select 1 from public.cities where name = 'Bangalore');

insert into public.cities (name, image, is_featured, display_order)
select 'Mumbai', 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80&w=1000', true, 2
where not exists (select 1 from public.cities where name = 'Mumbai');

insert into public.cities (name, image, is_featured, display_order)
select 'Delhi', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=1000', true, 3
where not exists (select 1 from public.cities where name = 'Delhi');

insert into public.cities (name, image, is_featured, display_order)
select 'Hyderabad', 'https://images.unsplash.com/photo-1572431441023-c0529c9d4694?auto=format&fit=crop&q=80&w=1000', true, 4
where not exists (select 1 from public.cities where name = 'Hyderabad');

insert into public.cities (name, image, is_featured, display_order)
select 'Chennai', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=1000', true, 5
where not exists (select 1 from public.cities where name = 'Chennai');

insert into public.cities (name, image, is_featured, display_order)
select 'Kolkata', 'https://images.unsplash.com/photo-1558431382-27e30cb14bc4?auto=format&fit=crop&q=80&w=1000', true, 6
where not exists (select 1 from public.cities where name = 'Kolkata');
