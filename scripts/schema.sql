-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create a status type for better state management
create type public.repost_status as enum ('queued', 'processing', 'reposted', 'failed', 'ignored');

-- 1. Table for posts queued for reposting
create table public.queued_posts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  instagram_post_id text not null unique,
  instagram_url text not null,
  author_username text not null,
  caption text,
  media_url text not null,
  media_type text not null, -- e.g., 'IMAGE', 'VIDEO'
  engagement_score integer not null default 0,
  post_data jsonb, -- Store the full API response for future use
  status public.repost_status default 'queued' not null,
  media_storage_path text -- Path to the media if stored in Supabase Storage
);

comment on table public.queued_posts is 'Stores Instagram posts that are selected for reposting.';

-- 2. Table for logging all repost attempts
create table public.repost_log (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  queued_post_id uuid references public.queued_posts(id) on delete set null,
  status text not null, -- 'success' or 'failed'
  repost_timestamp timestamp with time zone not null,
  details text -- For storing success messages or error details from n8n
);

comment on table public.repost_log is 'A comprehensive log of all reposting activities.';

-- 3. Enable Row Level Security (RLS)
-- Best practice for Supabase projects [^1]
alter table public.queued_posts enable row level security;
alter table public.repost_log enable row level security;

-- 4. Create RLS policies
-- For an internal tool, we can allow authenticated users full access.
-- For production, you might want more granular control.
create policy "Allow full access to authenticated users"
on public.queued_posts for all
to authenticated
using (true)
with check (true);

create policy "Allow full access to authenticated users"
on public.repost_log for all
to authenticated
using (true)
with check (true);

-- 5. Create a Supabase Storage bucket for media
-- This needs to be done via the Supabase Dashboard or CLI.
-- Bucket name: 'repost-media', Public: false
