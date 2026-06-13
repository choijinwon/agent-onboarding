create table if not exists wiki_update_requests (
  id text primary key,
  project_id text not null,
  vault_folder text not null,
  title text not null,
  markdown text not null,
  agent_role text not null,
  confidence text not null check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  status text not null check (status in ('pending', 'approved', 'rejected', 'needs_revision')),
  vault_path text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text
);

create table if not exists vault_document_metadata (
  path text primary key,
  project_id text not null,
  title text not null,
  category text not null,
  status text not null,
  confidence text not null check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  updated_by text not null,
  updated_at date not null
);

create table if not exists agent_execution_logs (
  id text primary key,
  project_id text not null,
  agent_role text not null,
  request_id text references wiki_update_requests(id),
  vault_log_path text not null,
  status text not null,
  created_at timestamptz not null default now()
);
