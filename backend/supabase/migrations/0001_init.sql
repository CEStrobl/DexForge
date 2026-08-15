-- DexForge — initial Supabase schema for saved lists, fusion lists, quick links, and the
-- fusion-art scrape cache. Mirrors backend/app/models/list_models.py and
-- quick_link_models.py, plus adds per-user scoping (user_id + RLS) that the old SQLite
-- schema never needed since it was single-user/local-only.
--
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query). Safe to
-- re-run: every statement is guarded (create table/policy "if not exists" where Postgres
-- supports it, or wrapped so re-running doesn't error on objects that already exist).

-- ── saved_lists ──────────────────────────────────────────────────────────────────────
create table if not exists saved_lists (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    criteria jsonb,
    visible_columns jsonb,
    column_widths jsonb,
    labels jsonb,
    updated_at timestamptz,
    constraint saved_lists_user_name_unique unique (user_id, name)
);

create table if not exists saved_list_entries (
    id bigint generated always as identity primary key,
    saved_list_id bigint not null references saved_lists (id) on delete cascade,
    pokemon_slug text not null,
    position integer not null default 0,
    label_ids jsonb
);

create index if not exists saved_list_entries_saved_list_id_idx
    on saved_list_entries (saved_list_id);

-- ── fusion_lists ─────────────────────────────────────────────────────────────────────
create table if not exists fusion_lists (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    visible_columns jsonb,
    column_widths jsonb,
    labels jsonb,
    updated_at timestamptz,
    constraint fusion_lists_user_name_unique unique (user_id, name)
);

create table if not exists fusion_list_entries (
    id bigint generated always as identity primary key,
    fusion_list_id bigint not null references fusion_lists (id) on delete cascade,
    head_slug text not null,
    body_slug text not null,
    position integer not null default 0,
    label_ids jsonb,
    selected_variant text
);

create index if not exists fusion_list_entries_fusion_list_id_idx
    on fusion_list_entries (fusion_list_id);

-- ── quick_links ──────────────────────────────────────────────────────────────────────
-- The original cloud-migration doc's step 1 only calls out saved_lists/fusion_lists for
-- user_id, but its own RLS section says "for each of the 5 tables" — quick_links had zero
-- user scoping before this migration, which this closes.
create table if not exists quick_links (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    label text not null,
    path text not null,
    position integer not null default 0,
    created_at timestamptz
);

create index if not exists quick_links_user_id_idx on quick_links (user_id);

-- ── fusion_art_manifests ─────────────────────────────────────────────────────────────
-- Backs services/fusion_art.py's scrape cache once art moves to Supabase Storage (Part 3
-- of the migration plan) — replaces the local manifest.json-per-pair files, which don't
-- survive Vercel cold starts. Not user-scoped: this is shared reference data (which
-- community sprites exist for a given head+body pair), not per-user content.
create table if not exists fusion_art_manifests (
    pair text primary key, -- "{head_dex_id}.{body_dex_id}"
    variants jsonb not null
);

-- ── Row Level Security ───────────────────────────────────────────────────────────────
alter table saved_lists enable row level security;
alter table saved_list_entries enable row level security;
alter table fusion_lists enable row level security;
alter table fusion_list_entries enable row level security;
alter table quick_links enable row level security;

drop policy if exists saved_lists_owner on saved_lists;
create policy saved_lists_owner on saved_lists
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists saved_list_entries_owner on saved_list_entries;
create policy saved_list_entries_owner on saved_list_entries
    for all using (
        exists (
            select 1 from saved_lists sl
            where sl.id = saved_list_entries.saved_list_id and sl.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from saved_lists sl
            where sl.id = saved_list_entries.saved_list_id and sl.user_id = auth.uid()
        )
    );

drop policy if exists fusion_lists_owner on fusion_lists;
create policy fusion_lists_owner on fusion_lists
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists fusion_list_entries_owner on fusion_list_entries;
create policy fusion_list_entries_owner on fusion_list_entries
    for all using (
        exists (
            select 1 from fusion_lists fl
            where fl.id = fusion_list_entries.fusion_list_id and fl.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from fusion_lists fl
            where fl.id = fusion_list_entries.fusion_list_id and fl.user_id = auth.uid()
        )
    );

drop policy if exists quick_links_owner on quick_links;
create policy quick_links_owner on quick_links
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- fusion_art_manifests is shared reference data, readable by any authenticated request;
-- only the backend (via the service-role key, which bypasses RLS entirely) ever writes it.
alter table fusion_art_manifests enable row level security;
drop policy if exists fusion_art_manifests_read on fusion_art_manifests;
create policy fusion_art_manifests_read on fusion_art_manifests
    for select using (true);
