
"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage("تعذر الاتصال. راجع إعدادات Supabase.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage("تعذر تسجيل الدخول: " + error.message);
        return;
      }

      if (data.user) {
        setMessage("تم تسجيل الدخول بنجاح ✅");
      }
    } catch {
      setMessage("حصل خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: 460,
        margin: "60px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>تسجيل الدخول — مزاد تك</h1>
      <p>سجّل دخولك لمتابعة حسابك والمزادات.</p>

      <form onSubmit={handleLogin}>
        <label htmlFor="email">البريد الإلكتروني</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label htmlFor="password">كلمة المرور</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>

      {message && (
        <p role="status" aria-live="polite" style={{ marginTop: 20 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        معندكش حساب؟ <a href="/register">إنشاء حساب جديد</a>
      </p>

      <p><a href="/">العودة للرئيسية</a></p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  marginTop: 8,
  marginBottom: 18,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 16,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: 13,
  border: "none",
  borderRadius: 8,
  background: "#176b52",
  color: "white",
  fontSize: 16,
  cursor: "pointer",
};
