
"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

const categories = [
  "كروت شاشة",
  "معالجات",
  "لوحات أم",
  "رامات",
  "وحدات تخزين",
  "أجهزة كمبيوتر كاملة",
  "شاشات",
  "مزودات طاقة",
  "أخرى",
];

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function SellPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("working");
  const [defects, setDefects] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (images.length + selected.length > MAX_IMAGES) {
      setMessage(`يمكنك اختيار ${MAX_IMAGES} صور كحد أقصى.`);
      return;
    }

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setMessage("اختر صور JPG أو PNG أو WebP فقط.");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setMessage("حجم الصورة الواحدة يجب ألا يتجاوز 5 ميجابايت.");
        return;
      }
    }

    setImages((current) => [...current, ...selected]);
    setMessage("");
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const client = getSupabaseClient();

    if (!client) {
      setMessage("تعذر الاتصال بقاعدة البيانات. راجع إعدادات Supabase.");
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isSafeInteger(numericPrice) || numericPrice <= 0) {
      setMessage("أدخل سعر بداية صحيحًا بالجنيه المصري.");
      return;
    }

    if (condition === "known_defect" && !defects.trim()) {
      setMessage("من فضلك وضّح العيب المعروف في المنتج.");
      return;
    }

    setLoading(true);
    const uploadedPaths: string[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError || !user) {
        setMessage("لازم تسجّل الدخول قبل إضافة منتج.");
        return;
      }

      // Upload selected images to Supabase Storage.
      const imageUrls: string[] = [];

      for (const file of images) {
        const extension = file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/png"
            ? "png"
            : "webp";

        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await client.storage
          .from("product-images")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Image upload failed:", uploadError.message);
          throw new Error(
            "فشل رفع إحدى الصور. تأكد من وجود Bucket باسم product-images وصلاحيات التخزين."
          );
        }

        uploadedPaths.push(path);

        const { data } = client.storage
          .from("product-images")
          .getPublicUrl(path);

        imageUrls.push(data.publicUrl);
      }

      // Save product details and uploaded image URLs.
      const { error: insertError } = await client
        .from("products")
        .insert({
          seller_id: user.id,
          title: title.trim(),
          category,
          description: description.trim(),
          condition_status: condition,
          defects: defects.trim() || null,
          starting_price: numericPrice,
          image_urls: imageUrls,
          status: "pending",
          listing_fee_status: "unpaid",
        });

      if (insertError) {
        console.error("Product submission failed:", insertError.message);

        // Best-effort cleanup if Storage DELETE permission is configured.
        if (uploadedPaths.length > 0) {
          const { error: cleanupError } = await client.storage
            .from("product-images")
            .remove(uploadedPaths);

          if (cleanupError) {
            console.error("Image cleanup failed:", cleanupError.message);
          }
        }

        setMessage(
          "تم رفع الصور لكن لم يتم حفظ المنتج. راجع إعدادات قاعدة البيانات والصلاحيات، ثم حاول مرة أخرى."
        );
        return;
      }

      router.push("/my-products");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إرسال المنتج."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="sell-page" dir="rtl">
      <div className="sell-container">
        <a href="/" className="sell-back">
          ← الرجوع إلى الرئيسية
        </a>

        <header className="sell-heading">
          <div className="sell-eyebrow">مزاد تك | اعرض قطعتك</div>
          <h1>أضف منتجك للمزاد</h1>
          <p>
            أدخل بيانات المنتج بدقة، وحدد سعر البداية، وارفع صورًا
            حقيقية توضح حالة القطعة.
          </p>
        </header>

        <section className="sell-notice">
          <strong>رسوم الإعلان: 29 جنيهًا</strong>
          <p>
            المنتج سيُرسل للمراجعة. الدفع الإلكتروني غير مفعّل بعد،
            وإرسال المنتج لا يعني دفع الرسوم أو اعتماده.
          </p>
        </section>

        <form className="sell-form" onSubmit={handleSubmit}>
          <div className="sell-field">
            <label className="sell-label" htmlFor="title">
              اسم المنتج *
            </label>
            <input
              id="title"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: RTX 4070 Super من ASUS"
            />
          </div>

          <div className="sell-field">
            <label className="sell-label" htmlFor="category">
              القسم *
            </label>
            <select
              id="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">اختر القسم</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="sell-field">
            <label className="sell-label" htmlFor="description">
              وصف المنتج *
            </label>
            <textarea
              id="description"
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="المواصفات، مدة الاستخدام، والملحقات..."
            />
          </div>

          <div className="sell-field">
            <label className="sell-label" htmlFor="condition">
              حالة المنتج *
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="working">يعمل بكفاءة</option>
              <option value="known_defect">به عيب معروف</option>
              <option value="untested">لم يتم اختباره</option>
            </select>
          </div>

          <div className="sell-field">
            <label className="sell-label" htmlFor="defects">
              العيوب المعروفة{condition === "known_defect" ? " *" : ""}
            </label>
            <textarea
              id="defects"
              required={condition === "known_defect"}
              maxLength={2000}
              rows={3}
              value={defects}
              onChange={(e) => setDefects(e.target.value)}
              placeholder="اكتب العيوب إن وجدت."
            />
          </div>

          <div className="sell-field">
            <label className="sell-label" htmlFor="price">
              سعر بداية المزاد (جنيه مصري) *
            </label>
            <input
              id="price"
              required
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="مثال: 5000"
            />
          </div>

          <div className="sell-field">
            <label className="sell-label" htmlFor="product-images">
              صور المنتج (حتى 5 صور)
            </label>

            <label htmlFor="product-images" className="sell-upload">
              <span className="sell-upload-icon">＋</span>
              <strong>اختار الصور من جهازك</strong>
              <span>اضغط لفتح نافذة الملفات على جهاز Mac</span>
              <small>JPG أو PNG أو WebP — حتى 5 ميجابايت للصورة</small>
            </label>

            <input
              id="product-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sell-file-input"
              onChange={handleImageChange}
            />

            {previews.length > 0 && (
              <div className="sell-preview-grid">
                {previews.map((url, index) => (
                  <div className="sell-preview" key={url}>
                    <img src={url} alt={`صورة المنتج ${index + 1}`} />
                    <button
                      type="button"
                      className="sell-remove-image"
                      onClick={() => removeImage(index)}
                    >
                      حذف الصورة
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="sell-hint">
              الصور المختارة ستُرفع عند إرسال النموذج، ثم تُحفظ روابطها
              مع بيانات المنتج.
            </p>
          </div>

          {message && (
            <p className="sell-error" role="alert">
              {message}
            </p>
          )}

          <button className="sell-submit" type="submit" disabled={loading}>
            {loading ? "جارٍ رفع الصور وإرسال المنتج..." : "إرسال المنتج للمراجعة"}
          </button>

          <p className="sell-footnote">
            المنتج سيظل قيد المراجعة ورسوم الإعلان غير مدفوعة.
          </p>
        </form>
      </div>

      <style jsx>{`
        .sell-page {
          min-height: 100vh;
          padding: 40px 16px 64px;
          background: #f6f8fc;
          color: #172033;
          font-family: Cairo, Arial, sans-serif;
        }
        .sell-container { max-width: 820px; width: 100%; margin: 0 auto; }
        .sell-back { display: inline-block; margin-bottom: 24px; color: #3478f6; text-decoration: none; font-weight: 700; }
        .sell-heading { margin-bottom: 28px; }
        .sell-eyebrow { margin-bottom: 10px; color: #3478f6; font-weight: 800; }
        .sell-heading h1 { margin: 0 0 12px; color: #101a2d; font-size: clamp(28px, 5vw, 40px); font-weight: 900; }
        .sell-heading p, .sell-hint { color: #718096; line-height: 1.9; }
        .sell-notice { margin-bottom: 22px; padding: 18px; border: 1px solid #f2d49b; border-radius: 16px; background: #fff8e8; line-height: 1.9; }
        .sell-notice strong { color: #805500; }
        .sell-notice p { margin: 5px 0 0; color: #665536; }
        .sell-form { padding: clamp(18px, 4vw, 32px); border: 1px solid #e5eaf2; border-radius: 24px; background: #fff; box-shadow: 0 12px 40px rgba(16,26,45,.06); }
        .sell-field { margin-bottom: 24px; }
        .sell-label { display: block; margin-bottom: 9px; font-weight: 800; }
        .sell-form input:not([type="file"]), .sell-form select, .sell-form textarea { box-sizing: border-box; width: 100%; padding: 13px 15px; border: 1px solid #e5eaf2; border-radius: 12px; background: #fff; color: #172033; font: inherit; outline: none; }
        .sell-form input:focus, .sell-form select:focus, .sell-form textarea:focus { border-color: #3478f6; box-shadow: 0 0 0 3px rgba(52,120,246,.12); }
        .sell-form textarea { resize: vertical; }
        .sell-file-input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
        .sell-upload { display: flex; min-height: 150px; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px; border: 2px dashed #cbd7e8; border-radius: 16px; background: #f8faff; color: #172033; text-align: center; cursor: pointer; }
        .sell-upload:hover { border-color: #3478f6; background: #f0f5ff; }
        .sell-upload-icon { color: #3478f6; font-size: 32px; font-weight: 800; }
        .sell-upload span, .sell-upload small { color: #718096; }
        .sell-preview-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(120px,1fr)); gap: 12px; margin-top: 16px; }
        .sell-preview { overflow: hidden; border: 1px solid #e5eaf2; border-radius: 12px; background: #fff; }
        .sell-preview img { display: block; width: 100%; height: 120px; object-fit: cover; }
        .sell-remove-image { width: 100%; padding: 8px; border: 0; background: #fff0f0; color: #b42318; cursor: pointer; font: inherit; font-weight: 700; }
        .sell-hint { margin-top: 10px; font-size: 13px; }
        .sell-error { margin-bottom: 18px; padding: 14px; border-radius: 12px; background: #fff0f0; color: #b42318; line-height: 1.8; }
        .sell-submit { width: 100%; padding: 15px 20px; border: 0; border-radius: 12px; background: #3478f6; color: #fff; font: inherit; font-weight: 900; cursor: pointer; }
        .sell-submit:hover { background: #2464dd; }
        .sell-submit:disabled { cursor: not-allowed; opacity: .6; }
        .sell-footnote { margin: 14px 0 0; color: #718096; font-size: 12px; line-height: 1.8; text-align: center; }
        @media (max-width: 600px) {
          .sell-page { padding-top: 24px; }
          .sell-form { border-radius: 18px; }
        }
      `}</style>
    </main>
  );
}
