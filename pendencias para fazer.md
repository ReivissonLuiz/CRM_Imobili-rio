# Setup definitivo (corrigir login de todos os usuários)

Este arquivo substitui o setup antigo. Nao use mais insercao manual em `auth.users`.

## Passo unico: execute todo este SQL no Supabase SQL Editor

```sql
begin;

-- 1) Remover funcao antiga insegura (se existir)
drop function if exists public.criar_usuario_novo(text, text, text, text, text, text);

-- 2) Limpar usuarios criados pelo SQL antigo (instance_id zerado)
--    Esses usuarios costumam gerar "database error querying schema" no login.
delete from public.profiles p
using auth.users u
where p.id = u.id
  and u.instance_id = '00000000-0000-0000-0000-000000000000';

delete from auth.users
where instance_id = '00000000-0000-0000-0000-000000000000';

-- 3) Garantir coluna de email em profiles
alter table public.profiles
add column if not exists email text;

-- 4) Backfill de email para usuarios existentes
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

-- 5) Trigger para criar perfil automaticamente ao nascer usuario no auth
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, role, email, criado_em)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    'corretor',
    new.email,
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      nome = coalesce(public.profiles.nome, excluded.nome);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- 6) RLS + policies minimas para funcionar no CRM
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.mensagens_rapidas enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_insert_authenticated on public.profiles;
drop policy if exists profiles_update_authenticated on public.profiles;
drop policy if exists leads_all_authenticated on public.leads;
drop policy if exists mensagens_all_authenticated on public.mensagens_rapidas;
drop policy if exists leads_select_own on public.leads;
drop policy if exists leads_insert_own on public.leads;
drop policy if exists leads_update_own on public.leads;
drop policy if exists leads_delete_own on public.leads;
drop policy if exists mensagens_select_own on public.mensagens_rapidas;
drop policy if exists mensagens_insert_own on public.mensagens_rapidas;
drop policy if exists mensagens_update_own on public.mensagens_rapidas;
drop policy if exists mensagens_delete_own on public.mensagens_rapidas;

create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (true);

create policy profiles_insert_authenticated
on public.profiles
for insert
to authenticated
with check (true);

create policy profiles_update_authenticated
on public.profiles
for update
to authenticated
using (true)
with check (true);

create policy leads_select_own
on public.leads
for select
to authenticated
using (criado_por = auth.uid());

create policy leads_insert_own
on public.leads
for insert
to authenticated
with check (criado_por = auth.uid());

create policy leads_update_own
on public.leads
for update
to authenticated
using (criado_por = auth.uid())
with check (criado_por = auth.uid());

create policy leads_delete_own
on public.leads
for delete
to authenticated
using (criado_por = auth.uid());

create policy mensagens_select_own
on public.mensagens_rapidas
for select
to authenticated
using (criado_por = auth.uid());

create policy mensagens_insert_own
on public.mensagens_rapidas
for insert
to authenticated
with check (criado_por = auth.uid());

create policy mensagens_update_own
on public.mensagens_rapidas
for update
to authenticated
using (criado_por = auth.uid())
with check (criado_por = auth.uid());

create policy mensagens_delete_own
on public.mensagens_rapidas
for delete
to authenticated
using (criado_por = auth.uid());

commit;
```

## Depois do SQL

1. Crie novamente os usuarios que tinham sido criados pelo metodo antigo.
2. Teste login com cada usuario.
3. Com as policies acima, cada usuario so acessa os proprios leads e mensagens.

## Recuperacao rapida (se perdeu admin ou sumiram leads antigos)

Rode os comandos abaixo trocando `SEU_EMAIL_AQUI` pelo email da sua conta.

```sql
-- 1) Descobrir seu user id (UUID)
select id, email
from auth.users
where lower(email) = lower('SEU_EMAIL_AQUI');

-- 2) Restaurar cargo admin para sua conta
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('SEU_EMAIL_AQUI');

-- 3) Vincular leads antigos sem dono para sua conta
update public.leads l
set criado_por = u.id
from auth.users u
where lower(u.email) = lower('SEU_EMAIL_AQUI')
  and l.criado_por is null;

-- 4) Se necessario, vincular mensagens antigas sem dono para sua conta
update public.mensagens_rapidas m
set criado_por = u.id
from auth.users u
where lower(u.email) = lower('SEU_EMAIL_AQUI')
  and m.criado_por is null;
```

Se os leads antigos estiverem com `criado_por` de outro usuario, troque com cuidado:

```sql
update public.leads l
set criado_por = destino.id
from auth.users origem, auth.users destino
where origem.email = 'EMAIL_ANTIGO_OU_ERRADO'
  and destino.email = 'SEU_EMAIL_AQUI'
  and l.criado_por = origem.id;
```
