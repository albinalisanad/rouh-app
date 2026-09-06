import { supabase } from "./supabaseClient.js";

// نفس اسم الصف الذي أدخلناه في supabase_schema.sql
const ROW_ID = "main";

// بديل عن window.storage.get/set بحيث لا نغيّر منطق التطبيق نفسه —
// فقط مكان حفظ البيانات (Supabase بدل التخزين المحلي بالمتصفح)
//
// ملاحظة مهمة: هذا التطبيق يخزّن كل بياناته تحت مفتاح واحد فقط (STORAGE_KEY)،
// فلا داعي لقراءة الصف وضم المفتاح الجديد قبل الحفظ (كان هذا يسبب races —
// لو صار حفظان متقاربان بسرعة، الثاني يقرأ نسخة قديمة ويمسح تعديل الأول).
// الحين نكتب مباشرة بعملية واحدة ذرية (atomic) بدون قراءة أولاً.
export const storage = {
  async get(key) {
    const { data, error } = await supabase
      .from("rouh_data")
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.data || Object.keys(data.data).length === 0) return null;
    return data.data[key] ?? null;
  },

  async set(key, value) {
    const { error: writeErr } = await supabase
      .from("rouh_data")
      .upsert({ id: ROW_ID, data: { [key]: value } }, { onConflict: "id" });
    if (writeErr) throw writeErr;
    return true;
  },
};

// رفع صورة/PDF فاتورة مورد إلى Supabase Storage (bucket: invoices) — يرجع رابط عام دائم
export async function uploadInvoiceFile(file) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("invoices").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("invoices").getPublicUrl(path);
  return data.publicUrl;
}
