-- DexForge — social features: public/shareable lists, list bookmarks, friends, and a public
-- "profiles" directory (usernames/avatars live in auth.users.raw_user_meta_data today, which
-- isn't queryable by other users — this mirrors the display fields into a public, readable
-- table via trigger). Mirrors backend/app/models/profile_models.py and social_models.py, plus
-- new is_public/share_token columns on saved_lists/fusion_lists (backend/app/models/list_models.py).
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

-- ── profiles ─────────────────────────────────────────────────────────────────────────
create table if not exists profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null unique,
    avatar_head_slug text,
    avatar_body_slug text,
    avatar_variant_id text
);

-- Keeps profiles in sync with auth.users.raw_user_meta_data regardless of how it was
-- written — sign-up and avatar changes both go through supabase.auth.updateUser() directly
-- from the frontend, never through the FastAPI backend, so a backend-write approach would
-- miss both paths. security definer so it can write to public.profiles despite running as
-- part of an auth.users trigger.
create or replace function sync_profile_from_auth_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, avatar_head_slug, avatar_body_slug, avatar_variant_id)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_head_slug',
        new.raw_user_meta_data->>'avatar_body_slug',
        new.raw_user_meta_data->>'avatar_variant_id'
    )
    on conflict (id) do update set
        username = excluded.username,
        avatar_head_slug = excluded.avatar_head_slug,
        avatar_body_slug = excluded.avatar_body_slug,
        avatar_variant_id = excluded.avatar_variant_id;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_upsert on auth.users;
create trigger on_auth_user_upsert
    after insert or update of raw_user_meta_data on auth.users
    for each row execute function sync_profile_from_auth_user();

-- Backfill existing accounts (the trigger only fires on future inserts/updates).
insert into public.profiles (id, username, avatar_head_slug, avatar_body_slug, avatar_variant_id)
select
    id,
    coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_head_slug',
    raw_user_meta_data->>'avatar_body_slug',
    raw_user_meta_data->>'avatar_variant_id'
from auth.users
on conflict (id) do nothing;

-- ── list visibility/sharing ──────────────────────────────────────────────────────────
alter table saved_lists add column if not exists is_public boolean not null default false;
alter table saved_lists add column if not exists share_token uuid;
alter table fusion_lists add column if not exists is_public boolean not null default false;
alter table fusion_lists add column if not exists share_token uuid;

-- ── list_saves (bookmarks of other users' public lists) ─────────────────────────────
create table if not exists list_saves (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    list_type text not null check (list_type in ('saved', 'fusion')),
    list_id bigint not null,
    created_at timestamptz not null default now(),
    constraint list_saves_unique unique (user_id, list_type, list_id)
);

create index if not exists list_saves_user_id_idx on list_saves (user_id);

-- ── friend_requests (doubles as the friendship record once accepted) ────────────────
create table if not exists friend_requests (
    id bigint generated always as identity primary key,
    requester_id uuid not null references auth.users (id) on delete cascade,
    recipient_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted')),
    created_at timestamptz not null default now(),
    constraint friend_requests_unique unique (requester_id, recipient_id)
);

create index if not exists friend_requests_recipient_idx on friend_requests (recipient_id);
create index if not exists friend_requests_requester_idx on friend_requests (requester_id);

-- ── Row Level Security ───────────────────────────────────────────────────────────────
-- Defense-in-depth matching 0001_init.sql's pattern — the FastAPI backend itself connects
-- via the pooler connection string as the table owner (not through a per-user Supabase
-- client), so authorization there is enforced in Python; these policies only matter if a
-- client ever queries Postgres directly with a user's JWT.
alter table profiles enable row level security;
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select using (true);

alter table list_saves enable row level security;
drop policy if exists list_saves_owner on list_saves;
create policy list_saves_owner on list_saves
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table friend_requests enable row level security;
drop policy if exists friend_requests_participant on friend_requests;
create policy friend_requests_participant on friend_requests
    for all using (auth.uid() = requester_id or auth.uid() = recipient_id)
    with check (auth.uid() = requester_id or auth.uid() = recipient_id);
