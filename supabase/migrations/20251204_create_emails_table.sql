-- Create emails table for Hybrid Storage (Metadata Only)
create table if not exists public.emails (
  id text primary key, -- Matches Aurinko ID
  account_id uuid references public.email_accounts(id) on delete cascade not null,
  thread_id text, -- Groups emails into conversations
  subject text,
  from_json jsonb, -- Stores {name, address}
  snippet text,
  received_at timestamp with time zone,
  folder text, -- e.g., 'inbox', 'sent', 'trash'
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for common queries
create index if not exists emails_account_id_idx on public.emails(account_id);
create index if not exists emails_folder_idx on public.emails(folder);
create index if not exists emails_received_at_idx on public.emails(received_at desc);

-- Enable RLS
alter table public.emails enable row level security;

-- Policy: Users can only see emails from their own accounts
-- We need to join with email_accounts to check user_id
create policy "Users can view their own emails"
  on public.emails for select
  using (
    exists (
      select 1 from public.email_accounts
      where email_accounts.id = emails.account_id
      and email_accounts.user_id = auth.uid()
    )
  );

create policy "Users can insert/update their own emails"
  on public.emails for all
  using (
    exists (
      select 1 from public.email_accounts
      where email_accounts.id = emails.account_id
      and email_accounts.user_id = auth.uid()
    )
  );
