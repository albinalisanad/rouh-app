-- ============================================================
-- إعداد تخزين ملفات فواتير الموردين — شغّليها مرة وحدة بـ SQL Editor
-- (آمنة التكرار — لو شغّلتيها أكثر من مرة ما تسوي مشاكل)
-- ============================================================

-- 1) إنشاء "الباكت" (مساحة التخزين) — public يعني أي رابط ملف يفتح مباشرة بدون تسجيل دخول
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- 2) صلاحية: أي مستخدم مسجّل دخول يقدر يرفع ملفات لهذا الباكت
drop policy if exists "authenticated users can upload invoices" on storage.objects;
create policy "authenticated users can upload invoices"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'invoices');

-- 3) صلاحية: أي مستخدم مسجّل دخول يقدر يشوف قائمة الملفات (القراءة المباشرة بالرابط ما تحتاج هذي أصلاً لأن الباكت public)
drop policy if exists "authenticated users can list invoices" on storage.objects;
create policy "authenticated users can list invoices"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'invoices');

-- 4) صلاحية: حذف الملفات (اختياري، لو حبيتوا تحذفون فاتورة قديمة لاحقًا)
drop policy if exists "authenticated users can delete invoices" on storage.objects;
create policy "authenticated users can delete invoices"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'invoices');

-- تحقق نهائي: لازم يطلع صف واحد اسمه invoices
select id, name, public from storage.buckets where id = 'invoices';
