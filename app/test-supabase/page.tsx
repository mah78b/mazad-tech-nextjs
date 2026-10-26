
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function TestSupabasePage() {
  const [status, setStatus] = useState("جاري الاتصال...");
  const [products, setProducts] = useState<unknown[]>([]);

  useEffect(() => {
    async function testConnection() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setStatus("خطأ: راجع إعدادات الاتصال في ملف .env.local");
        return;
      }

      const { data, error } = await supabase
        .from("public_products")
        .select("*")
        .limit(5);

      if (error) {
        setStatus("فشل الاتصال: " + error.message);
        return;
      }

      setProducts(data ?? []);
      setStatus("تم الاتصال بنجاح بقاعدة البيانات ✅");
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: "30px", direction: "rtl" }}>
      <h1>اختبار قاعدة بيانات مزاد تك</h1>
      <p>{status}</p>

      <h2>المنتجات المتاحة</h2>
      {products.length === 0 ? (
        <p>لا توجد منتجات لعرضها حاليًا.</p>
      ) : (
        <pre>{JSON.stringify(products, null, 2)}</pre>
      )}
    </main>
  );
}
