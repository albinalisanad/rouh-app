-- ============================================================
-- نظام "روح" — سكيما Supabase
-- شغّل هذا الملف كامل داخل: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) جدول واحد يحمل كل بيانات التطبيق (نفس شكل الـ db الحالي بالضبط)
--    هذا هو أسرع مسار حقيقي لنقل التطبيق دون إعادة كتابة كل شاشة من الصفر.
--    لاحقًا، إذا احتجتم تقارير أعمق أو صلاحيات على مستوى كل جدول، ننتقل
--    لتصميم علاقي كامل (كما في مستند الـ ERD السابق) — لكن هذا يكفي تمامًا للبداية.
create table if not exists public.rouh_data (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- صف واحد فقط يحمل كل شيء (منتجات، فواتير، مصروفات... إلخ كـ JSON)
insert into public.rouh_data (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- 2) جدول ملفات المستخدمين (اسم العرض + الصلاحية لكل شخص يسجّل دخول عبر Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'employee' check (role in ('admin', 'manager', 'employee')),
  created_at timestamptz not null default now()
);

-- إذا كان الجدول موجود من قبل بدون عمود role، هذا يضيفه:
alter table public.profiles add column if not exists role text not null default 'employee';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'employee'));

-- ============================================================
-- 3) الأمان (Row Level Security)
--    القاعدة: أي شخص سجّل دخول بحساب حقيقي (عبر Supabase Auth) يقدر يقرأ
--    ويعدّل بيانات المتجر المشتركة. هذا يناسب فريق صغير كله موثوق بعضه.
-- ============================================================
alter table public.rouh_data enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "authenticated users can read shop data" on public.rouh_data;
create policy "authenticated users can read shop data"
  on public.rouh_data for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can update shop data" on public.rouh_data;
create policy "authenticated users can update shop data"
  on public.rouh_data for update
  to authenticated
  using (true);

drop policy if exists "users can read all profiles" on public.profiles;
create policy "users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- تحديث الملف الشخصي: أي شخص يقدر يعدّل ملفه هو، أو أي أدمن يقدر يعدّل أي ملف
-- (هذا يشمل تغيير الصلاحية role — لازم يكون المُعدِّل أدمن حتى يغيّر صلاحية غيره)
drop policy if exists "users can update their own profile" on public.profiles;
create policy "self or admin can update profiles"
  on public.profiles for update
  to authenticated
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
  );

-- ============================================================
-- 4) أول أدمن — خطوة يدوية لمرة واحدة فقط
--    لأنه ما فيه أدمن بعد، محد يقدر يرقّي حد عبر التطبيق أول مرة.
--    بعد ما "سند" يسجّل حساب جديد بالتطبيق (Sign up)، شغّل هذا هنا
--    (استبدل البريد الإلكتروني ببريده الفعلي):
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'sanad@example.com');
-- ============================================================

-- ============================================================
-- ملاحظة: بعد تشغيل هذا الملف، روح للخطوة التالية:
-- Authentication → Providers → فعّل Email، وأضف حسابات الفريق
-- (أو خلّهم يسجّلون بأنفسهم من شاشة "إنشاء حساب" بالتطبيق)
-- ============================================================
