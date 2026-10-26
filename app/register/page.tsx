
"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const name = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!name) {
      setMessage("اكتب اسمك بالكامل.");
      return;
    }

    if (password.length < 8) {
      setMessage("كلمة المرور لازم تكون 8 أحرف على الأقل.");
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage("تعذر الاتصال. راجع إعدادات Supabase.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setMessage("تعذر إنشاء الحساب: " + error.message);
        return;
      }

      if (data.user && !data.session) {
        setMessage(
          "تم إرسال طلب التسجيل. راجع بريدك الإلكتروني إذا طُلب منك تأكيده."
        );
      } else if (data.user) {
        setMessage(
          "تم إنشاء الحساب بنجاح. الخطوة التالية هي تجهيز ملف المستخدم."
        );
      } else {
        setMessage("لم يتم تأكيد إنشاء الحساب. حاول مرة أخرى.");
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
      <h1>إنشاء حساب — مزاد تك</h1>
      <p>أنشئ حسابك لتستعد للمشاركة في مزادات الكمبيوتر والهاردوير.</p>

      <form onSubmit={handleRegister}>
        <label htmlFor="fullName">الاسم بالكامل</label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
        />

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

        <label htmlFor="password">كلمة المرور (8 أحرف على الأقل)</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </button>
      </form>

      {message && (
        <p role="status" aria-live="polite" style={{ marginTop: 20 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        عندك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a>
      </p>
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
