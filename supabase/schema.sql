-- Monedero — esquema de base de datos y seguridad (RLS)
-- Ejecuta este script completo en: Supabase Dashboard → SQL Editor → New query → Run

create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('usd_wallet','ves_bank','cash_usd','cash_ves','vault')),
  currency text not null check (currency in ('USD','VES')),
  balance numeric not null default 0,
  account_number text,
  holder text,
  phone text,
  ci text,
  bank_code text,
  is_default boolean default false,
  status_text text,
  icon text not null default 'wallet',
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  category_emoji text,
  account_id text references public.accounts(id) on delete set null,
  account_name text not null,
  type text not null check (type in ('expense','income','exchange')),
  currency text not null check (currency in ('USD','VES')),
  amount numeric not null,
  secondary_amount numeric not null,
  rate numeric not null,
  date_label text not null,
  group_date text not null,
  reference text not null,
  sudeban_code text,
  status text not null,
  icon text not null,
  note text,
  beneficiary jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  position text not null,
  ci text not null,
  phone text not null,
  monthly_salary numeric not null,
  payment_frequency text not null check (payment_frequency in ('quincenal','mensual')),
  payment_method text not null check (payment_method in ('pago_movil','cash_usd','zinli')),
  pago_movil_bank text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.employee_loans (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  type text not null check (type in ('advance','loan')),
  description text not null,
  total_amount numeric not null,
  remaining_amount numeric not null,
  deduction_per_payment numeric not null,
  date_label text not null,
  status text not null default 'active' check (status in ('active','paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.payroll_history (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  employee_name text not null,
  period text not null,
  date_label text not null,
  base_amount numeric not null,
  deducted_amount numeric not null default 0,
  net_amount_usd numeric not null,
  net_amount_ves numeric not null,
  rate numeric not null,
  paid_from_account_id text references public.accounts(id) on delete set null,
  reference text not null,
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_expenses (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  category_emoji text,
  amount numeric not null,
  currency text not null check (currency in ('USD','VES')),
  frequency text not null check (frequency in ('mensual','quincenal','semanal')),
  due_day integer not null,
  is_paid boolean not null default false,
  last_paid_date text,
  account_id text references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices para consultas rápidas por usuario
create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists employees_user_id_idx on public.employees(user_id);
create index if not exists employee_loans_user_id_idx on public.employee_loans(user_id);
create index if not exists employee_loans_employee_id_idx on public.employee_loans(employee_id);
create index if not exists payroll_history_user_id_idx on public.payroll_history(user_id);
create index if not exists recurring_expenses_user_id_idx on public.recurring_expenses(user_id);

-- Seguridad a nivel de fila: cada persona solo ve y modifica sus propios datos
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.employees enable row level security;
alter table public.employee_loans enable row level security;
alter table public.payroll_history enable row level security;
alter table public.recurring_expenses enable row level security;

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own employees" on public.employees;
create policy "own employees" on public.employees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own employee_loans" on public.employee_loans;
create policy "own employee_loans" on public.employee_loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own payroll_history" on public.payroll_history;
create policy "own payroll_history" on public.payroll_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own recurring_expenses" on public.recurring_expenses;
create policy "own recurring_expenses" on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Comprobantes de gastos (fotos de factura)
-- Antes de correr esta sección: crea el bucket de Storage manualmente en
-- Supabase Dashboard → Storage → New bucket → nombre "receipts" → Public: OFF
-- ============================================================================

alter table public.transactions add column if not exists receipt_path text;

drop policy if exists "own receipts read" on storage.objects;
create policy "own receipts read" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own receipts insert" on storage.objects;
create policy "own receipts insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own receipts update" on storage.objects;
create policy "own receipts update" on storage.objects
  for update to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own receipts delete" on storage.objects;
create policy "own receipts delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Cuentas de empleados con acceso limitado + Tareas
-- ============================================================================

-- Un empleado (fila de public.employees) puede opcionalmente tener su propio
-- login (auth_user_id) y una cuenta de dinero asignada para trabajar.
alter table public.employees add column if not exists auth_user_id uuid references auth.users(id);
alter table public.employees add column if not exists assigned_account_id text references public.accounts(id);
alter table public.employees add column if not exists exchange_counterpart_account_id text references public.accounts(id);

create index if not exists employees_auth_user_id_idx on public.employees(auth_user_id);

-- Un empleado necesita leer su propia fila (para saber su cuenta asignada y
-- su nombre) pero nunca las de sus compañeros, y no puede modificarla.
drop policy if exists "employee reads own employee row" on public.employees;
create policy "employee reads own employee row" on public.employees
  for select
  using (auth_user_id = auth.uid());

-- Helpers usados por las políticas de abajo (security definer: pueden leer
-- employees aunque quien llama no tenga permiso directo sobre esa tabla).
create or replace function public.current_employee()
returns public.employees
language sql security definer stable
as $$
  select * from public.employees where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.effective_owner_id()
returns uuid
language sql security definer stable
as $$
  select coalesce((select user_id from public.current_employee()), auth.uid());
$$;

-- accounts: el dueño mantiene control total (política "own accounts" ya
-- existente). Un empleado solo puede LEER su cuenta asignada (y la
-- contraparte de cambios, si tiene una) — nunca crear/editar/borrar.
drop policy if exists "employee reads assigned account" on public.accounts;
create policy "employee reads assigned account" on public.accounts
  for select
  using (
    id = (select assigned_account_id from public.current_employee())
    or id = (select exchange_counterpart_account_id from public.current_employee())
  );

-- transactions: el dueño mantiene control total (política "own transactions"
-- ya existente). Un empleado puede LEER los movimientos de su(s) cuenta(s)
-- y solo puede INSERTAR (nunca editar ni borrar) ingresos/egresos en su
-- cuenta asignada, o cambios entre su cuenta y su contraparte.
drop policy if exists "employee reads own account transactions" on public.transactions;
create policy "employee reads own account transactions" on public.transactions
  for select
  using (
    account_id = (select assigned_account_id from public.current_employee())
    or account_id = (select exchange_counterpart_account_id from public.current_employee())
  );

drop policy if exists "employee inserts own account transactions" on public.transactions;
create policy "employee inserts own account transactions" on public.transactions
  for insert
  with check (
    user_id = (select user_id from public.current_employee())
    and (
      (type in ('income', 'expense') and account_id = (select assigned_account_id from public.current_employee()))
      or (
        type = 'exchange'
        and account_id in (
          (select assigned_account_id from public.current_employee()),
          (select exchange_counterpart_account_id from public.current_employee())
        )
      )
    )
  );

-- Invitaciones: el dueño las crea y administra; el canje se hace únicamente
-- a través de la función redeem_employee_invite (nunca por update directo).
create table if not exists public.employee_invites (
  code text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz
);

create index if not exists employee_invites_owner_id_idx on public.employee_invites(owner_id);

alter table public.employee_invites enable row level security;

drop policy if exists "owner manages invites" on public.employee_invites;
create policy "owner manages invites" on public.employee_invites
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace function public.redeem_employee_invite(p_code text)
returns void
language plpgsql
security definer
as $$
declare
  v_invite public.employee_invites;
begin
  select * into v_invite from public.employee_invites where code = p_code for update;

  if v_invite is null then
    raise exception 'invalid_code';
  end if;

  if v_invite.used_at is not null then
    raise exception 'code_already_used';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'code_expired';
  end if;

  update public.employees
    set auth_user_id = auth.uid()
    where id = v_invite.employee_id;

  update public.employee_invites
    set used_at = now()
    where code = p_code;
end;
$$;

grant execute on function public.redeem_employee_invite(text) to authenticated;

-- Tareas: el dueño administra todas las suyas; un empleado solo ve las que
-- le asignaron y solo puede cambiar su estado (nunca el resto de campos).
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assigned_employee_id text references public.employees(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completada')),
  due_date text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_assigned_employee_id_idx on public.tasks(assigned_employee_id);

alter table public.tasks enable row level security;

drop policy if exists "owner manages tasks" on public.tasks;
create policy "owner manages tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "employee reads assigned tasks" on public.tasks;
create policy "employee reads assigned tasks" on public.tasks
  for select
  using (assigned_employee_id = (select id from public.current_employee()));

drop policy if exists "employee updates status of assigned tasks" on public.tasks;
create policy "employee updates status of assigned tasks" on public.tasks
  for update
  using (assigned_employee_id = (select id from public.current_employee()))
  with check (assigned_employee_id = (select id from public.current_employee()));

-- Un empleado solo puede cambiar la columna status de sus tareas asignadas;
-- este trigger rechaza cualquier otro cambio cuando quien edita no es el
-- dueño de la tarea (RLS es por fila, no por columna, así que esto lo
-- reforzamos aquí).
create or replace function public.enforce_employee_task_status_only()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() <> old.user_id then
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.priority is distinct from old.priority
       or new.assigned_employee_id is distinct from old.assigned_employee_id
       or new.due_date is distinct from old.due_date
       or new.user_id is distinct from old.user_id then
      raise exception 'employees can only update the task status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_employee_task_status_only on public.tasks;
create trigger trg_enforce_employee_task_status_only
  before update on public.tasks
  for each row execute function public.enforce_employee_task_status_only();

-- Los comprobantes se guardan bajo la carpeta del DUEÑO del negocio
-- (effective_owner_id), no la de quien los sube — así el dueño puede ver
-- los comprobantes que suban sus empleados. Reemplaza las políticas de
-- Storage creadas más arriba (que usaban auth.uid() directo).
drop policy if exists "own receipts read" on storage.objects;
create policy "own receipts read" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.effective_owner_id()::text);

drop policy if exists "own receipts insert" on storage.objects;
create policy "own receipts insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.effective_owner_id()::text);

drop policy if exists "own receipts update" on storage.objects;
create policy "own receipts update" on storage.objects
  for update to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.effective_owner_id()::text);

drop policy if exists "own receipts delete" on storage.objects;
create policy "own receipts delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.effective_owner_id()::text);

-- Cédula y teléfono ya no son obligatorios al registrar un empleado.
alter table public.employees alter column ci drop not null;
alter table public.employees alter column phone drop not null;

-- Pago de nómina mixto: parte del neto puede pagarse desde una segunda
-- cuenta (ej. una parte en efectivo USD y el resto en Bs. por pago móvil).
alter table public.payroll_history add column if not exists secondary_account_id text references public.accounts(id);
alter table public.payroll_history add column if not exists secondary_amount_usd numeric;
