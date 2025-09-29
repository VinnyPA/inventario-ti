-- Extensões úteis
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;


-- Perfis (opcional, para guardar metadados do usuário)
create table if not exists public.profiles (
id uuid primary key references auth.users(id) on delete cascade,
email text unique,
created_at timestamptz default now()
);


-- Inventário
create table if not exists public.inventory (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
name text not null,
description text,
quantity int not null default 0 check (quantity >= 0),
location text,
tags text[] default '{}',
created_at timestamptz default now(),
updated_at timestamptz default now()
);


create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
new.updated_at = now();
return new;
end;$$;


create trigger inventory_updated_at
before update on public.inventory
for each row execute procedure public.set_updated_at();

-- Movimentações


-- Políticas: cada usuário enxerga e altera apenas seus próprios registros
create policy if not exists "inventory_select_own"
on public.inventory for select
using (user_id = auth.uid());


create policy if not exists "inventory_insert_own"
on public.inventory for insert
with check (user_id = auth.uid());


create policy if not exists "inventory_update_own"
on public.inventory for update
using (user_id = auth.uid())
with check (user_id = auth.uid());


create policy if not exists "inventory_delete_own"
on public.inventory for delete
using (user_id = auth.uid());


create policy if not exists "mov_select_own"
on public.movements for select
using (user_id = auth.uid());


create policy if not exists "mov_insert_own"
on public.movements for insert
with check (user_id = auth.uid());


create policy if not exists "mov_delete_own"
on public.movements for delete
using (user_id = auth.uid());


create policy if not exists "profiles_select_self"
on public.profiles for select
using (id = auth.uid());


create policy if not exists "profiles_insert_self"
on public.profiles for insert
with check (id = auth.uid());


-- Popula profile automaticamente quando usuário confirma email (opcional)
create or replace function public.handle_new_user()
returns trigger as $$
begin
insert into public.profiles (id, email) values (new.id, new.email);
return new;
end;
$$ language plpgsql security definer;


create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();