create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unique(cart_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_number text not null unique,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  order_status text not null default 'Pending' check (order_status in ('Pending','Confirmed','Processing','Shipped','Out for Delivery','Delivered','Cancelled')),
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_reference text not null unique,
  payment_provider text not null default 'paystack',
  amount numeric(12,2) not null,
  payment_status text not null default 'pending',
  gateway_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_tracking (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  description text,
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_created_idx on public.products(is_active, created_at desc);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists tracking_order_idx on public.order_tracking(order_id, updated_at);

-- Automatically create a customer profile when Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Transactional order creation and stock reservation.
create or replace function public.create_order_and_reserve_stock(
  p_user_id uuid,
  p_order_number text,
  p_total_amount numeric,
  p_shipping_address jsonb,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  insert into public.orders(user_id, order_number, total_amount, shipping_address)
  values (p_user_id, p_order_number, p_total_amount, p_shipping_address)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 then raise exception 'Invalid quantity'; end if;

    select * into v_product from public.products
    where id = (v_item->>'product_id')::uuid and is_active = true
    for update;

    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock_quantity < v_qty then raise exception 'Insufficient stock for %', v_product.name; end if;

    update public.products set stock_quantity = stock_quantity - v_qty where id = v_product.id;

    insert into public.order_items(order_id, product_id, quantity, unit_price)
    values (v_order_id, v_product.id, v_qty, v_product.price);
  end loop;

  insert into public.order_tracking(order_id, status, description)
  values (v_order_id, 'Pending', 'Order received and awaiting payment confirmation.');

  return v_order_id;
end;
$$;

revoke all on function public.create_order_and_reserve_stock(uuid,text,numeric,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.create_order_and_reserve_stock(uuid,text,numeric,jsonb,jsonb) to service_role;

-- RLS: browser users can only read/update their own profile; privileged writes go through server.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_tracking enable row level security;

create policy "Profiles are readable by owner" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles can be updated by owner" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Active products are public" on public.products for select to anon, authenticated using (is_active = true);
create policy "Categories are public" on public.categories for select to anon, authenticated using (true);
create policy "Users read own carts" on public.carts for select to authenticated using (user_id = auth.uid());
create policy "Users manage own carts" on public.carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage cart items through own cart" on public.cart_items for all to authenticated
using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy "Users read own orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "Users read own order items" on public.order_items for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Users read own payments" on public.payments for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Users read own tracking" on public.order_tracking for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Product images bucket. Set public read access; uploads should be restricted to admins via backend.
insert into storage.buckets(id, name, public) values ('product-images','product-images',true)
on conflict (id) do nothing;
create policy "Public can view product images" on storage.objects for select using (bucket_id = 'product-images');
