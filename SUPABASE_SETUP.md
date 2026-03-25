# Setup Supabase (leads por usuário + contato)

Execute no SQL Editor do Supabase:

```sql
begin;

-- Perfis
alter table public.profiles add column if not exists email text;

-- Contato no lead
alter table public.leads
add column if not exists email text,
add column if not exists telefone text;

-- RLS
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.mensagens_rapidas enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_insert_authenticated on public.profiles;
drop policy if exists profiles_update_authenticated on public.profiles;

drop policy if exists leads_all_authenticated on public.leads;
drop policy if exists leads_select_own on public.leads;
drop policy if exists leads_insert_own on public.leads;
drop policy if exists leads_update_own on public.leads;
drop policy if exists leads_delete_own on public.leads;

drop policy if exists mensagens_all_authenticated on public.mensagens_rapidas;
drop policy if exists mensagens_select_own on public.mensagens_rapidas;
drop policy if exists mensagens_insert_own on public.mensagens_rapidas;
drop policy if exists mensagens_update_own on public.mensagens_rapidas;
drop policy if exists mensagens_delete_own on public.mensagens_rapidas;

create policy profiles_select_authenticated
on public.profiles for select to authenticated
using (true);

create policy profiles_insert_authenticated
on public.profiles for insert to authenticated
with check (true);

create policy profiles_update_authenticated
on public.profiles for update to authenticated
using (true)
with check (true);

create policy leads_select_own
on public.leads for select to authenticated
using (criado_por = auth.uid());

create policy leads_insert_own
on public.leads for insert to authenticated
with check (criado_por = auth.uid());

create policy leads_update_own
on public.leads for update to authenticated
using (criado_por = auth.uid())
with check (criado_por = auth.uid());

create policy leads_delete_own
on public.leads for delete to authenticated
using (criado_por = auth.uid());

create policy mensagens_select_own
on public.mensagens_rapidas for select to authenticated
using (criado_por = auth.uid());

create policy mensagens_insert_own
on public.mensagens_rapidas for insert to authenticated
with check (criado_por = auth.uid());

create policy mensagens_update_own
on public.mensagens_rapidas for update to authenticated
using (criado_por = auth.uid())
with check (criado_por = auth.uid());

create policy mensagens_delete_own
on public.mensagens_rapidas for delete to authenticated
using (criado_por = auth.uid());

commit;
```

## Recuperar admin e leads antigos

Troque `SEU_EMAIL_AQUI`:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
	and lower(u.email) = lower('SEU_EMAIL_AQUI');

update public.leads l
set criado_por = u.id
from auth.users u
where lower(u.email) = lower('SEU_EMAIL_AQUI')
	and l.criado_por is null;
```
