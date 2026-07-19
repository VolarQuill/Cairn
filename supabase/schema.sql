-- ============================================================
-- Cairn — Supabase schema (cloud / Vercel deployment)
-- ============================================================
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Tables mirror the local JSON store so the SAME app code runs in
-- either backend, selected by DATA_BACKEND=supabase.
-- ============================================================

-- ---------- profiles (mirrors auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default 'Learner',
  points integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists profiles_points_idx on public.profiles (points desc);
create index if not exists profiles_email_idx on public.profiles (email);

-- Server-awarded goal ids live on the profile so points are granted exactly once.
alter table public.profiles add column if not exists awarded_goals jsonb not null default '[]';

-- Auto-create a profile row when a Supabase auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- courses ----------
create table if not exists public.courses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  goal text not null default '',
  level text not null default 'beginner',
  source_type text not null default 'text',
  source_text text not null default '',
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_user_idx on public.courses (user_id, updated_at desc);

-- ---------- lessons ----------
create table if not exists public.lessons (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  module_index int not null default 0,
  lesson_index int not null default 0,
  module_title text not null default '',
  title text not null,
  content text not null default '',
  objectives jsonb not null default '[]',
  key_terms jsonb not null default '[]',
  est_minutes int not null default 8
);
create index if not exists lessons_course_idx on public.lessons (course_id, module_index, lesson_index);

-- ---------- quizzes ----------
create table if not exists public.quizzes (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  lesson_id text,
  title text not null,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists quizzes_course_idx on public.quizzes (course_id, created_at desc);

-- ---------- attempts ----------
create table if not exists public.attempts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id text not null references public.quizzes (id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);

-- ---------- chat_messages ----------
create table if not exists public.chat_messages (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_course_idx on public.chat_messages (course_id, user_id, created_at);

-- ---------- progress (spaced repetition) ----------
create table if not exists public.progress (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  course_id text not null references public.courses (id) on delete cascade,
  status text not null default 'new',
  ease real not null default 2.5,
  interval real not null default 0,
  reps int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz
);
create unique index if not exists progress_uniq on public.progress (user_id, lesson_id);
create index if not exists progress_due_idx on public.progress (user_id, due_at);

-- ---------- client_goals (user-set personal goals) ----------
create table if not exists public.client_goals (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  metric text not null default 'quiz_questions',
  target int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists client_goals_user_idx on public.client_goals (user_id, created_at desc);

-- ---------- Row Level Security ----------
alter table public.profiles      enable row level security;
alter table public.courses       enable row level security;
alter table public.lessons       enable row level security;
alter table public.quizzes       enable row level security;
alter table public.attempts      enable row level security;
alter table public.chat_messages enable row level security;
alter table public.progress      enable row level security;
alter table public.client_goals  enable row level security;

-- Profiles
drop policy if exists "profiles: own" on public.profiles;
create policy "profiles: own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Courses (owner-only)
drop policy if exists "courses: owner" on public.courses;
create policy "courses: owner" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lessons (via course ownership)
drop policy if exists "lessons: owner" on public.lessons;
create policy "lessons: owner" on public.lessons
  for all using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.user_id = auth.uid())
  );

-- Quizzes (via course ownership)
drop policy if exists "quizzes: owner" on public.quizzes;
create policy "quizzes: owner" on public.quizzes
  for all using (
    exists (select 1 from public.courses c where c.id = quizzes.course_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.courses c where c.id = quizzes.course_id and c.user_id = auth.uid())
  );

-- Attempts (owner-only)
drop policy if exists "attempts: owner" on public.attempts;
create policy "attempts: owner" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chat (owner-only)
drop policy if exists "chat: owner" on public.chat_messages;
create policy "chat: owner" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Progress (owner-only)
drop policy if exists "progress: owner" on public.progress;
create policy "progress: owner" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Client goals (owner-only)
drop policy if exists "client_goals: owner" on public.client_goals;
create policy "client_goals: owner" on public.client_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- friends (mutual; stored as two directed rows) ----------
-- A friendship is two rows (A->B and B->A). Either party may view or manage
-- the link, so the policy permits both directions.
create table if not exists public.friends (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);
create index if not exists friends_user_idx on public.friends (user_id);
alter table public.friends enable row level security;
create policy "friends: mutual" on public.friends
  for all
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

-- ---------- reviews (lessons flagged "needs review") ----------
create table if not exists public.reviews (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  course_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index if not exists reviews_user_idx on public.reviews (user_id);
alter table public.reviews enable row level security;
create policy "reviews: owner" on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
