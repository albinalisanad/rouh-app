import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";

const C = { plum: "#6B3D57", mauve: "#C88CA6", cream: "#F4EFE9", line: "#E9DDD9", muted: "#9C8690" };

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
        });
        if (error) throw error;
        setErr("تم إنشاء الحساب — تحقق من بريدك الإلكتروني لتأكيد الحساب قبل الدخول.");
      }
    } catch (e2) {
      setErr(e2.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.cream, fontFamily: "system-ui, -apple-system, sans-serif", direction: "rtl",
    }}>
      <form onSubmit={submit} style={{
        background: "#fff", padding: 32, borderRadius: 16, width: "min(340px, 90vw)", boxSizing: "border-box",
        boxShadow: "0 4px 20px rgba(107,61,87,.15)", border: `1px solid ${C.line}`,
      }}>
        <img src="/logo.png" alt="روح" style={{ height: 78, width: "auto", display: "block", margin: "0 auto 8px" }} />
        <p style={{ margin: "0 0 20px", fontSize: 13, color: C.muted, textAlign: "center" }}>
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </p>
        {mode === "signup" && (
          <input
            type="text" placeholder="اسمك (يظهر للفريق)" value={displayName} required
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, boxSizing: "border-box" }}
          />
        )}
        <input
          type="email" placeholder="البريد الإلكتروني" value={email} required
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, boxSizing: "border-box" }}
        />
        <input
          type="password" placeholder="كلمة المرور" value={password} required minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 14, borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, boxSizing: "border-box" }}
        />
        {err && <div style={{ color: "#b23", fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{
          width: "100%", padding: 11, borderRadius: 9, border: "none",
          background: C.plum, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {busy ? "..." : mode === "signin" ? "دخول" : "إنشاء حساب"}
        </button>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5 }}>
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{ background: "none", border: "none", color: C.mauve, cursor: "pointer", fontWeight: 700 }}>
            {mode === "signin" ? "ما عندك حساب؟ أنشئ واحد" : "عندك حساب؟ سجّل الدخول"}
          </button>
        </div>
      </form>
    </div>
  );
}
