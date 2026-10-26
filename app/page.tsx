
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Cpu,
  Gavel,
  HardDrive,
  Laptop,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Video,
} from "lucide-react";
import AuthStatus from "@/components/AuthStatus";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Auction = {
  auction_id: string;
  product_id: string;
  title: string;
  category: string;
  description: string | null;
  condition_status: string;
  current_price: number;
  valid_bid_count: number;
  starts_at: string;
  ends_at: string;
  status: string;
  image_urls?: string[] | null;
};

type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  condition_status: string;
  starting_price: number;
  image_urls: string[] | null;
  created_at: string;
};

const categories = [
  { name: "كروت الشاشة", icon: Video },
  { name: "المعالجات", icon: Cpu },
  { name: "لابتوبات", icon: Laptop },
  { name: "أجهزة الكمبيوتر", icon: Monitor },
  { name: "التخزين", icon: HardDrive },
  { name: "الموبايلات", icon: Smartphone },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG").format(price) + " ج.م";
}

function conditionLabel(condition: string) {
  const labels: Record<string, string> = {
    working: "مستعمل — يعمل بكفاءة",
    known_defect: "به عيوب موضحة",
    untested: "لم يتم اختباره",
    new: "جديد",
  };

  return labels[condition] ?? condition;
}

function timeRemaining(endsAt: string) {
  const difference = new Date(endsAt).getTime() - Date.now();

  if (difference <= 0) return "انتهى المزاد";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (difference % (1000 * 60 * 60)) / (1000 * 60)
  );

  if (days > 0) return `${days} يوم و${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة و${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

function productStyle(category: string) {
  const value = category.toLowerCase();

  if (value.includes("لابتوب")) return "laptop";
  if (value.includes("تخزين") || value.includes("ssd")) return "ssd";
  if (value.includes("معالج")) return "cpu";

  return "gpu";
}

function productSymbol(category: string) {
  const value = category.toLowerCase();

  if (value.includes("لابتوب")) return "PRO";
  if (value.includes("تخزين")) return "SSD";
  if (value.includes("معالج")) return "CPU";
  if (value.includes("موبايل")) return "MOB";

  return "TECH";
}

export default async function Home() {
  const supabase = getSupabaseClient();

  let auctions: Auction[] = [];
  let products: Product[] = [];
  let loadError = false;

  if (supabase) {
    const [auctionResult, productResult] = await Promise.all([
      supabase
        .from("public_auctions")
        .select(
          "auction_id, product_id, title, category, description, condition_status, current_price, valid_bid_count, starts_at, ends_at, status"
        )
        .order("ends_at", { ascending: true }),

      supabase
        .from("public_products")
        .select(
          "id, title, category, description, condition_status, starting_price, image_urls, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (auctionResult.error || productResult.error) {
      console.error(
        "Homepage Supabase error:",
        auctionResult.error,
        productResult.error
      );
      loadError = true;
    } else {
      auctions = (auctionResult.data ?? []) as Auction[];
      products = (productResult.data ?? []) as Product[];
    }
  } else {
    loadError = true;
  }

  const imageByProductId = new Map(products.map((product) => [product.id, product.image_urls?.[0] ?? ""]));

  const activeAuctions = auctions.filter(
    (auction) =>
      new Date(auction.ends_at).getTime() > Date.now() &&
      new Date(auction.starts_at).getTime() <= Date.now()
  );

  return (
    <main dir="rtl">
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Gavel size={23} />
            </span>
            <span>مزاد تك</span>
          </Link>

          <nav className="main-nav">
            <Link href="/">الرئيسية</Link>
            <a href="#categories">الأقسام</a>
            <a href="#auctions">المزادات</a>
            <a href="#how-it-works">كيف يعمل الموقع؟</a>
          </nav>

          <div className="header-actions">
            <AuthStatus />
            <Link className="btn btn-primary" href="/sell">
              + اعرض منتجك
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={16} />
              عالم التقنية في مكان واحد
            </span>

            <h1>
              مزادك القادم
              <br />
              <span>يبدأ من هنا</span>
            </h1>

            <p>
              اشترِ وبِع مكونات الكمبيوتر والأجهزة التقنية من خلال مزادات
              واضحة، وأسعار تنافسية، وتجربة سهلة.
            </p>

            <div className="hero-buttons">
              <a href="#auctions" className="btn btn-primary">
                استكشف المزادات
                <ArrowLeft size={18} />
              </a>
              <Link href="/sell" className="btn btn-outline">
                اعرض منتجك
              </Link>
            </div>

            <div className="trust-row">
              <span>
                <ShieldCheck size={17} />
                تفاصيل واضحة للمنتجات
              </span>
              <span>
                <Gavel size={17} />
                مزادات فعلية
              </span>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-glow" />
            <div className="hero-device">
              <span className="device-caption">MAZAD TECH</span>
              <Monitor size={105} strokeWidth={1.1} />
              <div className="hero-device-bottom">
                <span>اكتشف فرصتك</span>
                <span className="hero-live-dot">● مزادات التقنية</span>
              </div>
            </div>
            <div className="floating-card floating-card-top">
              <Gavel size={20} />
              <div>
                <strong>مزادات مباشرة</strong>
                <small>تابع السعر الحالي</small>
              </div>
            </div>
            <div className="floating-card floating-card-bottom">
              <ShieldCheck size={20} />
              <div>
                <strong>تفاصيل واضحة</strong>
                <small>اعرف حالة المنتج قبل المزايدة</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-item">
            <strong>{activeAuctions.length}</strong>
            <span>مزادات نشطة</span>
          </div>
          <div className="stat-item">
            <strong>{products.length}</strong>
            <span>منتجات معتمدة</span>
          </div>
          <div className="stat-item">
            <strong>24/7</strong>
            <span>تصفح في أي وقت</span>
          </div>
          <div className="stat-item">
            <strong>
              <ShieldCheck size={24} />
            </strong>
            <span>وضوح في تفاصيل المنتج</span>
          </div>
        </div>
      </section>

      <section className="section categories-section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">تصفح حسب اهتمامك</span>
              <h2>أقسام مزاد تك</h2>
              <p>اكتشف الأجهزة والمكونات التقنية التي تبحث عنها.</p>
            </div>
            <a href="#auctions" className="text-link">
              شاهد المزادات <ArrowLeft size={17} />
            </a>
          </div>

          <div className="category-grid">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <a
                  href={`#auctions`}
                  className="category-card"
                  key={category.name}
                >
                  <span className="category-icon">
                    <Icon size={27} />
                  </span>
                  <span className="category-name">{category.name}</span>
                  <ArrowLeft size={17} className="category-arrow" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section auctions-section" id="auctions">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">فرص تستحق المتابعة</span>
              <h2>المزادات المتاحة</h2>
              <p>المنتجات والأسعار المعروضة هنا مأخوذة من قاعدة البيانات.</p>
            </div>
            <span className="auction-count">
              {activeAuctions.length} مزاد نشط
            </span>
          </div>

          {loadError && (
            <div className="empty-state">
              <Search size={32} />
              <h3>تعذر تحميل البيانات</h3>
              <p>
                راجع إعدادات Supabase وصلاحيات القراءة للعرضين
                public_auctions وpublic_products.
              </p>
            </div>
          )}

          {!loadError && activeAuctions.length === 0 && (
            <div className="empty-state">
              <Gavel size={34} />
              <h3>لا توجد مزادات نشطة حاليًا</h3>
              <p>
                المنتجات المعتمدة ستظهر هنا عندما يتم إنشاء مزاد لها ويبدأ
                موعده.
              </p>
              <Link href="/sell" className="btn btn-primary">
                اعرض منتجك
              </Link>
            </div>
          )}

          <div className="auction-grid">
            {activeAuctions.map((item) => (
              <article className="auction-card" key={item.auction_id}>
                <Link
                  href={`/auction/${item.auction_id}`}
                  className="auction-card-link"
                  aria-label={`عرض مزاد ${item.title}`}
                >
                  <div className={`product-visual ${productStyle(item.category)}`}>
                    <span className="condition-tag">
                      {conditionLabel(item.condition_status)}
                    </span>

                    {imageByProductId.get(item.product_id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageByProductId.get(item.product_id)!}
                        alt={item.title}
                        className="product-card-image"
                      />
                    ) : (
                      <>
                        <div className="product-symbol">{productSymbol(item.category)}</div>
                        <div className="product-visual-icon">
                          {item.category.includes("لابتوب") ? (
                            <Laptop size={66} strokeWidth={1.2} />
                          ) : item.category.includes("معالج") ? (
                            <Cpu size={66} strokeWidth={1.2} />
                          ) : (
                            <Monitor size={66} strokeWidth={1.2} />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="auction-info">
                    <span className="product-category">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p className="condition-text">
                      {conditionLabel(item.condition_status)}
                    </p>

                    <div className="auction-meta">
                      <span>
                        <Gavel size={15} />
                        {item.valid_bid_count} مزايدة
                      </span>
                      <span>
                        <Clock3 size={15} />
                        {timeRemaining(item.ends_at)}
                      </span>
                    </div>

                    <div className="auction-bottom">
                      <div>
                        <small>السعر الحالي</small>
                        <strong>{formatPrice(item.current_price)}</strong>
                      </div>
                      <span className="bid-btn">
                        <ArrowLeft size={18} />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section products-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">أحدث الإضافات</span>
              <h2>منتجات معتمدة حديثًا</h2>
              <p>المنتجات التي تمت الموافقة عليها من الإدارة.</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <Monitor size={32} />
              <h3>لا توجد منتجات معتمدة للعرض</h3>
              <p>عندما تتم الموافقة على منتج، سيظهر هنا.</p>
            </div>
          ) : (
            <div className="auction-grid">
              {products.map((product) => {
                const imageUrl = product.image_urls?.[0];

                return (
                  <article className="auction-card" key={product.id}>
                    <div className={`product-visual ${productStyle(product.category)}`}>
                      <span className="condition-tag">
                        {conditionLabel(product.condition_status)}
                      </span>

                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="product-card-image"
                        />
                      ) : (
                        <div className="product-symbol">
                          {productSymbol(product.category)}
                        </div>
                      )}
                    </div>

                    <div className="auction-info">
                      <span className="product-category">{product.category}</span>
                      <h3>{product.title}</h3>
                      <p className="condition-text">
                        {conditionLabel(product.condition_status)}
                      </p>

                      <div className="auction-bottom">
                        <div>
                          <small>السعر المبدئي</small>
                          <strong>{formatPrice(product.starting_price)}</strong>
                        </div>
                        <Link
                          href={`/sell`}
                          className="bid-btn"
                          aria-label={`تفاصيل ${product.title}`}
                        >
                          <ArrowLeft size={18} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section how-section" id="how-it-works">
        <div className="container">
          <div className="section-heading centered-heading">
            <div>
              <span className="section-kicker">خطوات بسيطة</span>
              <h2>كيف يعمل مزاد تك؟</h2>
              <p>من التصفح إلى المزايدة، خطوات سهلة وواضحة.</p>
            </div>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <Search size={29} />
              <h3>تصفح المنتجات</h3>
              <p>اختر القسم وابحث عن المنتج المناسب لك.</p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <Gavel size={29} />
              <h3>تابع المزاد</h3>
              <p>راجع السعر الحالي والوقت المتبقي للمزاد.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <ShieldCheck size={29} />
              <h3>راجع التفاصيل</h3>
              <p>اقرأ وصف المنتج وحالته والعيوب المعلنة.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="seller-cta-section">
        <div className="container seller-cta">
          <div>
            <span className="section-kicker">هل لديك جهاز لا تستخدمه؟</span>
            <h2>اعرض منتجك وابدأ رحلتك</h2>
            <p>
              أضف تفاصيل منتجك وصوره، وبعد مراجعة الإدارة يمكن عرضه على
              المنصة.
            </p>
          </div>
          <Link href="/sell" className="btn btn-light">
            + اعرض منتجك الآن <ArrowLeft size={18} />
          </Link>
        </div>
      </section>

      <section className="section fees-section">
        <div className="container fees-content">
          <div>
            <span className="section-kicker">قبل عرض منتجك</span>
            <h2>اعرف تفاصيل الرسوم</h2>
            <p>
              راجع سياسة الرسوم وشروط عرض المنتجات قبل تقديم إعلانك.
            </p>
          </div>
          <Link href="/sell" className="btn btn-outline">
            ابدأ عرض منتجك <ArrowLeft size={18} />
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Gavel size={21} />
            </span>
            <span>مزاد تك</span>
          </Link>

          <p>منصتك لمزادات الأجهزة والمكونات التقنية.</p>

          <div className="footer-links">
            <Link href="/">الرئيسية</Link>
            <Link href="/sell">اعرض منتجك</Link>
            <a href="#how-it-works">كيف يعمل الموقع؟</a>
          </div>

          <small>© {new Date().getFullYear()} مزاد تك</small>
        </div>
      </footer>


    </main>
  );
}
