import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Login from "./Login.jsx";
import RouhApp from "./RouhApp.jsx";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [role, setRole] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setRole(null);
      setDisplayName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("role, display_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (existing) {
          if (!cancelled) {
            setRole(existing.role || "employee");
            setDisplayName(existing.display_name || "");
          }
        } else {
          // أول مرة يسجّل فيها هذا المستخدم دخول — ننشئ له ملفًا افتراضيًا بصلاحية موظف
          const fallbackName = session.user.user_metadata?.display_name || (session.user.email ? session.user.email.split("@")[0] : "مستخدم");
          const { error } = await supabase.from("profiles").insert({
            id: session.user.id,
            display_name: fallbackName,
            role: "employee",
          });
          if (!cancelled) {
            setRole("employee");
            setDisplayName(fallbackName);
          }
          if (error) console.error("profile create error", error);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setRole("employee");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        جارٍ التحميل...
      </div>
    );
  }

  if (!session) return <Login />;

  if (!role || profileLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        جارٍ تجهيز الحساب...
      </div>
    );
  }

  return <RouhApp role={role} displayName={displayName} />;
}
