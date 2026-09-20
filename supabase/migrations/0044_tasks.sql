-- 0044_tasks.sql
-- Topshiriqlar (Edu tizimdagi "Topshiriqlar" bo'limi): xodimga sana/vaqt bilan
-- biriktiriladigan vazifalar — qo'ng'iroq, uchrashuv, eslatma va h.k.
-- Ko'rish: barcha a'zolar; yaratish/o'zgartirish: direktor va administrator.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  due_date date not null,
  due_time time,
  task_type text not null default 'other'
    check (task_type in ('call', 'meeting', 'message', 'payment', 'other')),
  assignee_id uuid references teachers(id) on delete set null,
  note text,
  done_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists tasks_org_due_idx on tasks (org_id, due_date, due_time);
create index if not exists tasks_assignee_idx on tasks (assignee_id);

alter table tasks enable row level security;

drop policy if exists tasks_read on tasks;
create policy tasks_read on tasks
  for select using (is_org_member(org_id));

drop policy if exists tasks_manage on tasks;
create policy tasks_manage on tasks
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and (assignee_id is null or exists (
      select 1 from teachers t where t.id = assignee_id and t.org_id = tasks.org_id))
  );
