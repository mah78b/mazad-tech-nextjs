
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";

type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  condition_status: string;
  defects: string | null;
  starting_price: number;
  image_urls: string[] | null;
  status: string;
  created_at: string;
};

const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
  pending: {
    label: "قيد المراجعة",
    color: "#92400e",
    bg: "#fef3c7",
  },
  approved: {
    label: "تم قبول الإعلان",
    color: "#166534",
    bg: "#dcfce7",
  },
  rejected: {
    label: "الإعلان مرفوض",
    color: "#991b1b",
    bg: "#fee2e2",
  },
  sold: {
    label: "تم البيع",
    color: "#1e40af",
    bg: "#dbeafe",
  },
};

const conditionLabels: Record<string, string> = {
  working: "يعمل بكفاءة",
  known_defect: "به عيب معروف",
  untested: "لم يتم اختباره",
};

export default function MyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        throw new Error(
          "لم يتم إعداد الاتصال بـ Supabase. راجع متغيرات البيئة في .env.local."
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`مشكلة تسجيل الدخول: ${authError.message}`);
      }

      if (!user) {
        setProducts([]);
        setUserEmail("");
        setError("أنت غير مسجل الدخول. سجّل دخولك بالحساب الذي أضاف المنتج.");
        return;
      }

      setUserEmail(user.email ?? "");

      const { data, error: queryError } = await supabase
        .from("products")
        .select(
          "id, title, category, description, condition_status, defects, starting_price, image_urls, status, created_at"
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(
          `مشكلة قراءة المنتجات من قاعدة البيانات: ${queryError.message} (Code: ${queryError.code ?? "غير متاح"})`
        );
      }

      setProducts((data ?? []) as Product[]);
    } catch (err: unknown) {
      console.error("Error loading products:", err);

      const message =
        err instanceof Error
          ? err.message
          : JSON.stringify(err) || "خطأ غير معروف";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "36px 18px",
    background: "#f6f8fc",
    color: "#172033",
    direction: "rtl",
    fontFamily: "Arial, sans-serif",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "1100px",
    margin: "0 auto",
  };

  const buttonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "12px 20px",
    borderRadius: "10px",
    background: "#3478f6",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>
              منتجاتي
            </h1>
            <p style={{ color: "#718096", margin: 0, lineHeight: 1.8 }}>
              تابع إعلاناتك وصور منتجاتك وحالة كل إعلان.
            </p>
          </div>

          <Link href="/sell" style={buttonStyle}>
            + أضف منتجًا جديدًا
          </Link>
        </header>

        {userEmail && (
          <p style={{ color: "#718096", fontSize: "13px", marginBottom: "20px" }}>
            الحساب الحالي: {userEmail}
          </p>
        )}

        {loading && (
          <section
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            جاري تحميل منتجاتك...
          </section>
        )}

        {!loading && error && (
          <section
            role="alert"
            style={{
              background: "#fff",
              border: "1px solid #fecaca",
              borderRadius: "14px",
              padding: "22px",
              marginBottom: "22px",
            }}
          >
            <h2 style={{ color: "#991b1b", marginTop: 0 }}>
              تعذّر تحميل المنتجات
            </h2>

            <p
              style={{
                color: "#7f1d1d",
                lineHeight: 1.9,
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </p>

            <button onClick={() => void loadProducts()} style={buttonStyle}>
              حاول مرة أخرى
            </button>
          </section>
        )}

        {!loading && !error && products.length === 0 && (
          <section
            style={{
              background: "#fff",
              border: "1px solid #e5eaf2",
              borderRadius: "16px",
              padding: "44px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "42px" }}>📦</div>
            <h2>لسه ما أضفتش أي منتجات</h2>
            <p style={{ color: "#718096", lineHeight: 1.9 }}>
              لم نعثر على منتجات مرتبطة بالحساب الحالي.
              تأكد أنك تستخدم نفس الحساب الذي أضاف المنتج.
            </p>
            <Link href="/sell" style={buttonStyle}>
              أضف منتجًا جديدًا
            </Link>
          </section>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p style={{ color: "#526078", marginBottom: "20px" }}>
              عدد المنتجات: {products.length}
            </p>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "20px",
              }}
            >
              {products.map((product) => {
                const status = statusInfo[product.status] ?? {
                  label: product.status || "غير محدد",
                  color: "#374151",
                  bg: "#f3f4f6",
                };

                const imageUrl = product.image_urls?.[0];

                return (
                  <article
                    key={product.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5eaf2",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(16, 26, 45, 0.04)",
                    }}
                  >
                    <div
                      style={{
                        height: "220px",
                        background: "#edf1f7",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div style={{ color: "#718096", textAlign: "center" }}>
                          <div style={{ fontSize: "42px" }}>🖥️</div>
                          لا توجد صورة مسجلة لهذا المنتج
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "18px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "19px",
                            lineHeight: 1.6,
                            overflowWrap: "anywhere",
                            margin: "0 0 12px",
                          }}
                        >
                          {product.title}
                        </h2>

                        <span
                          style={{
                            flexShrink: 0,
                            padding: "6px 9px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: status.color,
                            background: status.bg,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p style={{ color: "#718096", margin: "0 0 8px" }}>
                        التصنيف: {product.category}
                      </p>

                      <p style={{ color: "#718096", margin: "0 0 12px" }}>
                        حالة القطعة:{" "}
                        {conditionLabels[product.condition_status] ??
                          product.condition_status}
                      </p>

                      <p
                        style={{
                          color: "#2464dd",
                          fontSize: "22px",
                          fontWeight: 800,
                          margin: "0 0 12px",
                        }}
                      >
                        {Number(product.starting_price).toLocaleString("ar-EG")}{" "}
                        جنيه
                      </p>

                      <p
                        style={{
                          color: "#526078",
                          fontSize: "14px",
                          lineHeight: 1.9,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {product.description}
                      </p>

                      {product.defects && (
                        <p
                          style={{
                            background: "#fff7ed",
                            color: "#9a3412",
                            padding: "10px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            lineHeight: 1.8,
                          }}
                        >
                          العيوب المذكورة: {product.defects}
                        </p>
                      )}

                      <p
                        style={{
                          color: "#718096",
                          fontSize: "12px",
                          marginBottom: 0,
                        }}
                      >
                        تاريخ الإضافة:{" "}
                        {new Date(product.created_at).toLocaleDateString("ar-EG")}
                      </p>

                      {(product.image_urls?.length ?? 0) > 1 && (
                        <p
                          style={{
                            color: "#526078",
                            fontSize: "13px",
                            marginBottom: 0,
                          }}
                        >
                          📷 عدد الصور: {product.image_urls?.length}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
