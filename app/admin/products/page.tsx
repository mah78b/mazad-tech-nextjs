
"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  condition_status: "working" | "known_defect" | "untested";
  defects: string | null;
  starting_price: number;
  image_urls: string[];
  status: string;
  created_at: string;
};

const conditionLabels: Record<string, string> = {
  working: "يعمل بكفاءة",
  known_defect: "به عيب معروف",
  untested: "لم يتم اختباره",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = getSupabaseClient();

    if (!supabase) {
      setError("تعذر الاتصال بقاعدة البيانات. راجع إعدادات البيئة.");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("سجّل الدخول بحساب المدير أولاً.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      setError("ليس لديك صلاحية دخول لوحة المدير.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("products")
      .select(
        "id, title, category, description, condition_status, defects, starting_price, image_urls, status, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(`فشل تحميل الإعلانات: ${queryError.message}`);
      setLoading(false);
      return;
    }

    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function reviewProduct(
    productId: string,
    status: "approved" | "rejected"
  ) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("تعذر الاتصال بقاعدة البيانات.");
      return;
    }

    const action = status === "approved" ? "قبول" : "رفض";
    const confirmed = window.confirm(`هل تريد ${action} هذا الإعلان؟`);
    if (!confirmed) return;

    setBusyId(productId);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("products")
      .update({ status })
      .eq("id", productId)
      .eq("status", "pending");

    if (updateError) {
      setError(`لم يتم تحديث الإعلان: ${updateError.message}`);
      setBusyId(null);
      return;
    }

    setProducts((current) =>
      current.filter((product) => product.id !== productId)
    );
    setMessage(
      status === "approved"
        ? "تم قبول الإعلان بنجاح."
        : "تم رفض الإعلان بنجاح."
    );
    setBusyId(null);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f6f8fc",
        padding: "32px 16px",
        color: "#172033",
      }}
    >
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 30 }}>مراجعة الإعلانات</h1>
            <p style={{ color: "#718096", marginBottom: 0 }}>
              لوحة إدارة مزاد تك — راجع الإعلانات قبل نشرها
            </p>
          </div>

          <button
            onClick={() => void loadProducts()}
            style={buttonStyle("#172033")}
          >
            تحديث القائمة
          </button>
        </header>

        {error && <p style={noticeStyle("#fee2e2", "#991b1b")}>{error}</p>}
        {message && (
          <p style={noticeStyle("#dcfce7", "#166534")}>{message}</p>
        )}

        {loading ? (
          <p>جاري تحميل الإعلانات...</p>
        ) : products.length === 0 ? (
          <section style={emptyStyle}>
            <h2>لا توجد إعلانات معلّقة حالياً</h2>
            <p style={{ color: "#718096" }}>
              الإعلانات الجديدة ستظهر هنا بعد إرسالها من المستخدمين.
            </p>
          </section>
        ) : (
          <section style={{ display: "grid", gap: 20 }}>
            {products.map((product) => (
              <article key={product.id} style={cardStyle}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 240px) minmax(0, 1fr)",
                    gap: 22,
                  }}
                  className="admin-product-layout"
                >
                  <div>
                    {product.image_urls?.[0] ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        style={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 12,
                          background: "#edf1f7",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 200,
                          borderRadius: 12,
                          background: "#edf1f7",
                          display: "grid",
                          placeItems: "center",
                          color: "#718096",
                        }}
                      >
                        لا توجد صورة
                      </div>
                    )}
                  </div>

                  <div>
                    <span style={categoryStyle}>{product.category}</span>
                    <h2 style={{ margin: "12px 0 8px", fontSize: 23 }}>
                      {product.title}
                    </h2>

                    <p style={{ color: "#3478f6", fontWeight: 700 }}>
                      سعر البداية:{" "}
                      {Number(product.starting_price).toLocaleString("ar-EG")}{" "}
                      جنيه
                    </p>

                    <p style={{ lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                      {product.description}
                    </p>

                    <p>
                      <strong>حالة المنتج:</strong>{" "}
                      {conditionLabels[product.condition_status] ??
                        product.condition_status}
                    </p>

                    {product.defects && (
                      <p>
                        <strong>العيوب:</strong> {product.defects}
                      </p>
                    )}

                    <p style={{ color: "#718096", fontSize: 13 }}>
                      تاريخ الإرسال:{" "}
                      {new Date(product.created_at).toLocaleString("ar-EG")}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        marginTop: 18,
                      }}
                    >
                      <button
                        disabled={busyId === product.id}
                        onClick={() =>
                          void reviewProduct(product.id, "approved")
                        }
                        style={buttonStyle("#16803d")}
                      >
                        {busyId === product.id ? "جاري التنفيذ..." : "✓ قبول الإعلان"}
                      </button>

                      <button
                        disabled={busyId === product.id}
                        onClick={() =>
                          void reviewProduct(product.id, "rejected")
                        }
                        style={buttonStyle("#c62828")}
                      >
                        {busyId === product.id ? "جاري التنفيذ..." : "✕ رفض الإعلان"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 650px) {
          :global(.admin-product-layout) {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </main>
  );
}

const buttonStyle = (background: string) => ({
  background,
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "11px 18px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
});

const noticeStyle = (background: string, color: string) => ({
  background,
  color,
  borderRadius: 10,
  padding: 14,
  marginBottom: 20,
});

const emptyStyle = {
  background: "#fff",
  border: "1px solid #e5eaf2",
  borderRadius: 16,
  padding: 32,
  textAlign: "center" as const,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5eaf2",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 4px 18px rgba(16, 26, 45, 0.04)",
};

const categoryStyle = {
  display: "inline-block",
  background: "#eaf1ff",
  color: "#2464dd",
  padding: "5px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
};
