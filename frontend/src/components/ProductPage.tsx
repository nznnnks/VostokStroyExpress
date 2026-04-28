import { useEffect, useMemo, useState } from "react";
import { formatPrice, type Product } from "../data/products";
import { loadCatalogListing } from "../lib/catalog-api";
import {
  SESSION_CART_UPDATED_EVENT,
  addProductToSessionCart,
  loadSessionCart,
  updateSessionCartItem,
} from "../lib/session-cart";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const perks = [
  ["/product/check.svg", "10 лет гарантии", "Полная поддержка производителя"],
  ["/product/delivery.svg", "Премиальная доставка", "Установка включена"],
];

const reviews = [
  {
    name: "Алексей",
    rating: "★★★★★",
    avatar: "/assets/stayse/reviews/reviewer-1.svg",
    text: "Доставили аккуратно, упаковка без повреждений. По ощущениям — действительно премиальный уровень, работает тихо.",
  },
  {
    name: "Игорь",
    rating: "★★★★☆",
    avatar: "/assets/stayse/reviews/reviewer-2.svg",
    text: "Установка прошла быстро, по характеристикам всё соответствует. Хотелось бы чуть подробнее инструкцию, но в целом доволен.",
  },
];

const countryToCode: Record<string, string> = {
  "германия": "DE",
  "deutschland": "DE",
  "швейцария": "CH",
  "switzerland": "CH",
  "япония": "JP",
  "japan": "JP",
  "италия": "IT",
  "italy": "IT",
  "франция": "FR",
  "france": "FR",
  "китай": "CN",
  "china": "CN",
  "южная корея": "KR",
  "корея": "KR",
  "south korea": "KR",
  "сша": "US",
  "usa": "US",
  "united states": "US",
  "россия": "RU",
  "russia": "RU",
};

function toFlagEmoji(country: string) {
  const normalized = country.trim().toLowerCase();
  const code = countryToCode[normalized];
  if (!code) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

type ProductPageProps = {
  product: Product;
  relatedProducts?: Product[];
  allProducts?: Product[];
};

function dedupeProducts(items: Product[]) {
  return items.filter((item, index, list) => list.findIndex((entry) => entry.slug === item.slug) === index);
}

export function ProductPage({ product, relatedProducts, allProducts }: ProductPageProps) {
  const gallery = product.gallery ?? [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<"description" | "specs">("description");
  const [cartQty, setCartQty] = useState(0);
  const [cartPending, setCartPending] = useState(false);
  const [cartAnimated, setCartAnimated] = useState(false);
  const categorySlug = product.categorySlug ?? "";
  const initialRelatedPool = useMemo(
    () =>
      dedupeProducts(
        [...(relatedProducts ?? []), ...(allProducts ?? [])].filter((item) => item.slug !== product.slug),
      ),
    [allProducts, product.slug, relatedProducts],
  );
  const [visibleRelated, setVisibleRelated] = useState<Product[]>(() => initialRelatedPool.slice(0, 6));
  const [relatedAnimatedCount, setRelatedAnimatedCount] = useState(6);
  const [relatedPage, setRelatedPage] = useState(2);
  const [catalogFallbackPage, setCatalogFallbackPage] = useState(1);
  const [isLoadingMoreRelated, setIsLoadingMoreRelated] = useState(false);
  const [hasMoreRelated, setHasMoreRelated] = useState(
    initialRelatedPool.length > 6 || Boolean(product.categorySlug || product.brand),
  );
  const countryFlag = toFlagEmoji(product.country);
  const topSpecs = [
    ["Класс эффективности", product.efficiencyClass ?? "A Premium"],
    ["Площадь покрытия", product.coverage ?? "До 100 м²"],
    ["Акустика (тихий режим)", product.acoustics ?? "20 дБ"],
    ["Фильтрация", product.filtration ?? "HEPA 13"],
  ];
  const detailsSpecs =
    product.filters && product.filters.length > 0
      ? product.filters
          .map((item) => {
            const unitSuffix = item.unit && item.value && !item.value.includes(item.unit) ? ` ${item.unit}` : "";
            return [item.parameterName, `${item.value}${unitSuffix}`] as const;
          })
          .slice(0, 28)
      : topSpecs;
  const visibleRelatedCount = visibleRelated.length;
  const descriptionTitle = product.slug === "monolith-v2" ? "Создано для архитектурной интеграции" : `О модели ${product.title}`;
  const activeImage = gallery[activeImageIndex] ?? gallery[0];
  const canGoPrevImage = gallery.length > 1 && activeImageIndex > 0;
  const canGoNextImage = gallery.length > 1 && activeImageIndex < gallery.length - 1;
  const categoryHref = categorySlug ? `/catalog/category/${categorySlug}` : "/catalog";
  const brandCard = (
    <a
      href={`/catalog?brand=${encodeURIComponent(product.brand)}`}
      className="block w-full max-w-[300px] border border-[#d9d3cb] p-5 text-center transition-colors hover:border-[#b6aea3] md:max-w-[250px]"
      aria-label={`Показать товары бренда ${product.brandLabel}`}
      title={`Смотреть товары ${product.brandLabel}`}
    >
      <div
        role="img"
        aria-label={`Флаг: ${product.country}`}
        className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[#a8a19a] bg-[#f8f8f6] text-[64px] leading-none"
      >
        {countryFlag}
      </div>
      <p className="mt-3 text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[3px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
        {product.brandLabel}
      </p>
      <p className="mt-1 text-[12px] uppercase tracking-[1.8px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace]">{product.country}</p>
      <p className="mt-2 text-[clamp(0.95rem,0.9vw,1.15rem)] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
        заказов: 230
      </p>
    </a>
  );

  useEffect(() => {
    setActiveImageIndex(0);
    setPreviousImage(null);
    setIsImageTransitioning(false);
    setVisibleRelated(initialRelatedPool.slice(0, 6));
    setRelatedAnimatedCount(6);
    setRelatedPage(2);
    setCatalogFallbackPage(1);
    setHasMoreRelated(initialRelatedPool.length > 6 || Boolean(product.categorySlug || product.brand));
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "specs") setActiveDetailsTab("specs");
      if (hash === "description") setActiveDetailsTab("description");
    }
  }, [initialRelatedPool, product.brand, product.categorySlug, product.slug]);

  async function handleLoadMoreRelated() {
    if (isLoadingMoreRelated || !hasMoreRelated) return;

    if (initialRelatedPool.length > visibleRelated.length) {
      setRelatedAnimatedCount(visibleRelated.length);
      setVisibleRelated(initialRelatedPool.slice(0, visibleRelated.length + 6));
      setHasMoreRelated(
        initialRelatedPool.length > visibleRelated.length + 6 || Boolean(categorySlug || product.brand),
      );
      return;
    }

    setIsLoadingMoreRelated(true);
    try {
      let nextPage = relatedPage;
      let categoryHasMore = Boolean(categorySlug);
      let brandHasMore = Boolean(product.brand);
      const existingSlugs = new Set(visibleRelated.map((item) => item.slug));
      existingSlugs.add(product.slug);
      const collected: Product[] = [];
      let attempts = 0;

      while (collected.length < 6 && (categoryHasMore || brandHasMore) && attempts < 4) {
        attempts += 1;
        const [sameCategory, sameBrand] = await Promise.all([
          categorySlug
            ? loadCatalogListing({ category: categorySlug, page: nextPage, limit: 6, includeMeta: false })
            : Promise.resolve({ items: [], hasMore: false }),
          product.brand
            ? loadCatalogListing({ brands: [product.brand], page: nextPage, limit: 6, includeMeta: false })
            : Promise.resolve({ items: [], hasMore: false }),
        ]);

        nextPage += 1;
        categoryHasMore = sameCategory.hasMore;
        brandHasMore = sameBrand.hasMore;

        const merged = dedupeProducts([...sameCategory.items, ...sameBrand.items]).filter((item) => !existingSlugs.has(item.slug));
        for (const item of merged) {
          if (collected.length >= 6) break;
          existingSlugs.add(item.slug);
          collected.push(item);
        }
      }

      let nextCatalogFallbackPage = catalogFallbackPage;
      let catalogHasMore = true;

      while (collected.length < 6 && catalogHasMore && attempts < 8) {
        attempts += 1;
        const fallbackResponse = await loadCatalogListing({
          page: nextCatalogFallbackPage,
          limit: 6,
          includeMeta: false,
        });

        nextCatalogFallbackPage += 1;
        catalogHasMore = fallbackResponse.hasMore;

        const fallbackItems = fallbackResponse.items.filter((item) => !existingSlugs.has(item.slug));
        for (const item of fallbackItems) {
          if (collected.length >= 6) break;
          existingSlugs.add(item.slug);
          collected.push(item);
        }
      }

      if (collected.length > 0) {
        setRelatedAnimatedCount(visibleRelated.length);
        setVisibleRelated((current) => [...current, ...collected]);
      }

      setRelatedPage(nextPage);
      setCatalogFallbackPage(nextCatalogFallbackPage);
      setHasMoreRelated(categoryHasMore || brandHasMore || catalogHasMore);
    } finally {
      setIsLoadingMoreRelated(false);
    }
  }

  useEffect(() => {
    let active = true;

    const syncCartQty = async () => {
      try {
        const cart = await loadSessionCart();
        if (!active) return;
        const nextQty = cart.items.find((item) => item.slug === product.slug)?.qty ?? 0;
        setCartQty(nextQty);
      } catch {
        if (!active) return;
      }
    };

    void syncCartQty();

    const handleCartUpdated = () => {
      void syncCartQty();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(SESSION_CART_UPDATED_EVENT, handleCartUpdated as EventListener);
    }

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(SESSION_CART_UPDATED_EVENT, handleCartUpdated as EventListener);
      }
    };
  }, [product.slug]);

  useEffect(() => {
    if (!isImageTransitioning) return;
    const timeoutId = window.setTimeout(() => {
      setIsImageTransitioning(false);
      setPreviousImage(null);
    }, 360);
    return () => window.clearTimeout(timeoutId);
  }, [isImageTransitioning]);

  function goToImage(nextIndex: number) {
    if (gallery.length <= 1) return;
    const clampedIndex = Math.max(0, Math.min(gallery.length - 1, nextIndex));
    if (clampedIndex === activeImageIndex) return;
    setPreviousImage(activeImage);
    setActiveImageIndex(clampedIndex);
    setIsImageTransitioning(true);
  }

  function showPrevImage() {
    goToImage(activeImageIndex - 1);
  }

  function showNextImage() {
    goToImage(activeImageIndex + 1);
  }

  async function handleAddToCart() {
    if (cartPending) return;
    setCartPending(true);
    try {
      const cart = await addProductToSessionCart(product);
      setCartQty(cart.items.find((item) => item.slug === product.slug)?.qty ?? 0);
      setCartAnimated(true);
    } finally {
      setCartPending(false);
      window.setTimeout(() => setCartAnimated(false), 420);
    }
  }

  async function handleCartQuantityChange(quantity: number) {
    if (cartPending) return;
    setCartPending(true);
    try {
      const cart = await updateSessionCartItem(product.slug, quantity);
      setCartQty(cart.items.find((item) => item.slug === product.slug)?.qty ?? 0);
      setCartAnimated(true);
    } finally {
      setCartPending(false);
      window.setTimeout(() => setCartAnimated(false), 420);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section className="px-4 py-6 md:px-10 md:py-12">
          <div className="mx-auto max-w-[1480px]">
          <div className="breadcrumb-nav flex items-center gap-4 overflow-x-auto whitespace-nowrap pb-2 uppercase tracking-[1.6px] text-[#787872] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href={categoryHref} className="inline-flex h-10 items-center justify-center bg-[#111] px-5 text-white">назад</a>
            <a href="/" className="hover:text-[#111]">Главная</a>
            <span className="text-[#b5b2ab]">/</span>
            <a href="/catalog" className="hover:text-[#111]">Каталог</a>
            <span className="text-[#b5b2ab]">/</span>
            <a href={categoryHref} className="hover:text-[#111]">{product.category}</a>
          </div>

          <div className="mt-7 grid gap-8 md:mt-9 md:gap-10 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f7f7f4]">
                {previousImage && isImageTransitioning ? (
                  <img
                    src={previousImage}
                    alt=""
                    width="1200"
                    height="1500"
                    loading="eager"
                    decoding="async"
                    aria-hidden="true"
                    className="product-hero-image-layer product-hero-image-layer--out"
                  />
                ) : null}
                <img
                  src={activeImage}
                  alt={product.title}
                  width="1200"
                  height="1500"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`product-hero-image-layer ${isImageTransitioning ? "product-hero-image-layer--in" : ""}`}
                />
                <button
                  type="button"
                  onClick={showPrevImage}
                  disabled={!canGoPrevImage}
                  hidden={!canGoPrevImage}
                  aria-label="Предыдущее фото"
                  className="absolute left-3 top-1/2 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7e1d9] bg-white/90 text-[#2b2a27] shadow-[0_18px_40px_rgba(38,35,31,0.10)] backdrop-blur transition-transform hover:scale-[1.03] md:left-6"
                >
                  <svg className="rotate-180" width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  disabled={!canGoNextImage}
                  hidden={!canGoNextImage}
                  aria-label="Следующее фото"
                  className="absolute right-3 top-1/2 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7e1d9] bg-white/90 text-[#2b2a27] shadow-[0_18px_40px_rgba(38,35,31,0.10)] backdrop-blur transition-transform hover:scale-[1.03] md:right-6"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:gap-4">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => goToImage(index)}
                    className={`overflow-hidden border transition-colors ${index === activeImageIndex ? "border-[#111]" : "border-transparent hover:border-[#b9b2a8]"}`}
                    aria-label={`Показать фото ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt=""
                      width="260"
                      height="200"
                      loading="lazy"
                      decoding="async"
                      className="aspect-[1.1/1] w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <aside className="xl:pt-6">
              <p className="text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[1.8px] text-[#7e7e79] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                артикул: {product.article} / бренд: {product.brandLabel}
              </p>
              <h1 className="mt-4 max-w-[560px] text-[clamp(2rem,5vw,5.4rem)] leading-[0.98] tracking-[-0.04em] text-[#111] [font-family:'Cormorant_Garamond',serif] md:mt-6">
                {product.title}
              </h1>
              <p className="mt-6 text-[clamp(1.7rem,2.6vw,2.6rem)] leading-none text-[#111] [font-family:DM_Sans,Manrope,sans-serif] md:mt-8">{formatPrice(product.price)}</p>

              <dl className="mt-8 divide-y divide-[#e8e3db] border-y border-[#e8e3db] md:mt-14">
                {topSpecs.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-4 md:grid-cols-[1fr_auto] md:gap-6 md:py-5">
                    <dt className="text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[1.5px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</dt>
                    <dd className="text-left text-[clamp(0.95rem,1vw,1.15rem)] text-[#111] [font-family:DM_Sans,Manrope,sans-serif] md:text-right">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 grid gap-4 md:mt-12 md:gap-5">
                {cartQty > 0 ? (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                    <div
                      className={`grid h-[52px] min-w-0 grid-cols-[52px_minmax(0,1fr)_52px] overflow-hidden bg-[#111] text-white transition-all duration-300 md:h-18 md:grid-cols-[60px_minmax(0,1fr)_60px] ${cartAnimated ? "scale-[1.012] shadow-[0_18px_36px_rgba(17,17,17,0.16)]" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => void handleCartQuantityChange(Math.max(0, cartQty - 1))}
                        disabled={cartPending}
                        className="flex items-center justify-center border-r border-white/12 text-[24px] leading-none transition-colors hover:bg-white/8 disabled:cursor-wait disabled:opacity-70"
                        aria-label="Уменьшить количество"
                      >
                        −
                      </button>
                      <div className="flex items-center justify-center px-3">
                        <span
                          key={`${product.slug}-${cartQty}`}
                          className="inline-flex items-baseline gap-2 animate-[cartQtyPop_380ms_cubic-bezier(0.22,1,0.36,1)] text-[14px] uppercase tracking-[1.6px] md:text-[16px] md:tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                        >
                          <span className="text-[22px] leading-none tabular-nums md:text-[26px]">{cartQty}</span>
                          <span>в корзине</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddToCart()}
                        disabled={cartPending}
                        className="flex items-center justify-center border-l border-white/12 text-[22px] leading-none transition-colors hover:bg-white/8 disabled:cursor-wait disabled:opacity-70"
                        aria-label="Увеличить количество"
                      >
                        +
                      </button>
                    </div>
                    <a
                      href="/cart"
                      className="group inline-flex h-[52px] items-center justify-between gap-4 border border-[#d9d0c3] bg-[linear-gradient(180deg,#f8f4ee_0%,#efe8de_100%)] px-5 text-[clamp(0.82rem,0.82vw,0.96rem)] uppercase tracking-[1.8px] text-[#111] shadow-[0_10px_24px_rgba(17,17,17,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d3b46a] hover:shadow-[0_16px_34px_rgba(17,17,17,0.10)] [font-family:Jaldi,'JetBrains_Mono',monospace] md:h-18 md:px-6 md:tracking-[2.3px]"
                    >
                      <span className="text-left leading-[1.05]">перейти в корзину</span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7ccbd] bg-white/70 text-[#111] transition-all duration-300 group-hover:border-[#d3b46a] group-hover:bg-white group-hover:translate-x-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAddToCart()}
                    disabled={cartPending}
                    className="inline-flex h-[52px] items-center justify-center bg-[#111] px-8 text-[clamp(0.9rem,0.9vw,1.15rem)] uppercase tracking-[2.2px] text-white transition-colors hover:bg-[#2a2a26] disabled:cursor-wait disabled:bg-[#2a2a26] [font-family:Jaldi,'JetBrains_Mono',monospace] md:h-18 md:tracking-[3px]"
                  >
                    {cartPending ? "добавляем" : "в корзину"}
                  </button>
                )}
                <a href={`/checkout?product=${product.slug}`} className="inline-flex h-[52px] items-center justify-center border border-[#111] px-8 text-[clamp(0.9rem,0.9vw,1.15rem)] uppercase tracking-[2.2px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace] md:h-18 md:tracking-[3px]">
                  купить в 1 клик
                </a>
              </div>

              <div className="mt-10 grid gap-6 border-t border-[#e8e3db] pt-6 md:mt-14 md:gap-8 md:pt-8 md:grid-cols-2">
                {perks.map(([icon, title, note]) => (
                  <div key={title as string} className="flex items-center gap-4 text-center md:items-start md:text-left">
                    <img src={icon as string} alt="" aria-hidden="true" width="20" height="20" className="mt-1 h-5 w-5" />
                    <div>
                      <p className="text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[1px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {renderPerkTitle(title as string)}
                      </p>
                      <p className="mt-1 text-[clamp(0.85rem,0.75vw,0.95rem)] text-[#787872]">{note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-center md:mt-12 xl:mt-16">
                {brandCard}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px] border-t border-[#e8e3db] pt-8">
          <div className="grid gap-8 xl:grid-cols-[1fr_530px] xl:items-end">
            <div className="flex gap-8 overflow-x-auto whitespace-nowrap pb-2 text-[clamp(1rem,0.95vw,1.25rem)] uppercase tracking-[1.5px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace] md:gap-14">
              <button
                type="button"
                onClick={() => setActiveDetailsTab("description")}
                className={`pt-5 transition-colors ${activeDetailsTab === "description" ? "border-t-2 border-[#111] text-[#111]" : "text-[#8b8b86] hover:text-[#111]"}`}
              >
                Описание
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailsTab("specs")}
                className={`pt-5 transition-colors ${activeDetailsTab === "specs" ? "border-t-2 border-[#111] text-[#111]" : "text-[#8b8b86] hover:text-[#111]"}`}
              >
                Характеристики
              </button>
            </div>
            <div className="hidden xl:block pb-2 pt-5 text-right text-[clamp(1rem,0.95vw,1.25rem)] uppercase tracking-[1.5px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              Отзывы
            </div>
          </div>

          <div className="mt-10 md:mt-16">
            <div className="grid gap-10 md:gap-12 xl:grid-cols-[1fr_530px]">
              <div className="relative min-h-[420px]">
                <div
                  aria-hidden={activeDetailsTab !== "description"}
                  className={`transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] motion-reduce:transition-none ${
                    activeDetailsTab === "description"
                      ? "relative z-[1] opacity-100 translate-y-0 blur-0"
                      : "pointer-events-none absolute inset-0 opacity-0 -translate-y-3 blur-[2px]"
                  }`}
                >
                  <div
                    id="description"
                    className="rounded-[26px] border border-[#e8e3db] bg-[#fff] px-6 py-8 md:px-10 md:py-12"
                  >
                    <h2 className="text-[clamp(2rem,3.4vw,4rem)] leading-none [font-family:'Cormorant_Garamond',serif]">
                      {product.title}
                    </h2>
                    <div className="mt-6 max-w-[930px] space-y-6 text-[clamp(1rem,1.2vw,1.5rem)] leading-[1.7] text-[#676761] [font-family:DM_Sans,Manrope,sans-serif] md:mt-10 md:space-y-10">
                      <p>{product.description?.[0]}</p>
                      <p>{product.description?.[1]}</p>
                    </div>
                  </div>
                </div>

                <div
                  aria-hidden={activeDetailsTab !== "specs"}
                  className={`transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] motion-reduce:transition-none ${
                    activeDetailsTab === "specs"
                      ? "relative z-[1] opacity-100 translate-y-0 blur-0"
                      : "pointer-events-none absolute inset-0 opacity-0 -translate-y-3 blur-[2px]"
                  }`}
                >
                  <div id="specs" className="overflow-hidden rounded-[26px] border border-[#e8e3db] bg-[#fff]">
                    <div className="flex flex-col gap-2 border-b border-[#e8e3db] px-5 py-7 text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#7b7b76] [font-family:Jaldi,'JetBrains_Mono',monospace] sm:flex-row sm:items-center sm:justify-between md:px-8 md:py-12">
                      <span>Характеристики</span>
                      <span className="text-[#111]">{product.brandLabel}</span>
                    </div>
                    {detailsSpecs.map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1 border-b border-[#e8e3db] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-6">
                        <span className="text-[clamp(0.78rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</span>
                        <span className="text-[clamp(0.95rem,1vw,1.15rem)] [font-family:'Cormorant_Garamond',serif]">{value}</span>
                      </div>
                    ))}
                    <div className="px-5 py-5 md:px-6 md:py-6">
                      <span className="text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">Артикул</span>
                      <p className="mt-2 text-[clamp(0.95rem,1vw,1.15rem)] [font-family:'Cormorant_Garamond',serif]">{product.article}</p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="border border-[#e8e3db] bg-[#fff]">
                <div className="border-b border-[#e8e3db] px-5 py-7 text-[clamp(1rem,0.95vw,1.25rem)] uppercase tracking-[2px] text-[#7b7b76] [font-family:Jaldi,'JetBrains_Mono',monospace] xl:hidden md:px-8 md:py-10">
                  Отзывы
                </div>
                <div className="px-5 py-6 md:px-8 md:py-10">
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <article key={review.name} className="border-b border-[#e8e3db] pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <img
                            src={review.avatar}
                            alt=""
                            aria-hidden="true"
                            width="44"
                            height="44"
                            loading="lazy"
                            decoding="async"
                            className="h-11 w-11 rounded-full border border-[#e6ded4] bg-white object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-[clamp(1.05rem,1vw,1.2rem)] leading-none text-[#111] [font-family:'Cormorant_Garamond',serif]">
                              {review.name}
                            </p>
                            <p className="mt-2 text-[0.95rem] leading-none tracking-[1px] text-[#d2ad58] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                              {review.rating}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-[clamp(0.95rem,1vw,1.12rem)] leading-[1.6] text-[#676761] [font-family:DM_Sans,Manrope,sans-serif]">
                          {review.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px]">
          <h2 className="text-[clamp(2rem,3.6vw,4.2rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Возможно пригодится</h2>
          <div
            className={`mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-10 md:gap-y-14 ${
              visibleRelatedCount >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"
            }`}
          >
            {visibleRelated.map((relatedProduct, index) => (
              <article
                key={relatedProduct.slug}
                style={{
                  animationDelay:
                    index >= relatedAnimatedCount ? `${(index - relatedAnimatedCount) * 70}ms` : "0ms",
                }}
                className={`flex h-full flex-col ${index >= relatedAnimatedCount ? "animate-[catalog-card-in_620ms_cubic-bezier(0.22,1,0.36,1)_both]" : ""}`}
              >
                <a href={`/catalog/${relatedProduct.slug}`}>
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.title}
                    width="900"
                    height="900"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[0.92/1] w-full object-cover"
                  />
                </a>
                <div className="mt-6 flex flex-1 flex-col">
                  <p className="text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace]">{relatedProduct.brandLabel}</p>
                  <h3 className="mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">
                    <a href={`/catalog/${relatedProduct.slug}`}>{relatedProduct.title}</a>
                  </h3>
                  <p className="mt-auto pt-4 text-[clamp(1rem,1.2vw,1.45rem)] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{formatPrice(relatedProduct.price)}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex justify-center md:mt-16">
            <button
              type="button"
              onClick={() => void handleLoadMoreRelated()}
              disabled={!hasMoreRelated || isLoadingMoreRelated}
              className="inline-flex h-14 w-full max-w-[340px] items-center justify-center bg-[#111] px-10 text-[clamp(0.95rem,0.9vw,1.15rem)] uppercase tracking-[2.4px] text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 [font-family:Jaldi,'JetBrains_Mono',monospace] md:h-16 md:w-auto md:px-14 md:tracking-[3px]"
            >
              {isLoadingMoreRelated ? "загружаем" : "загрузить еще"}
            </button>
          </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

function renderPerkTitle(title: string) {
  if (!title) return title;

  if (title === "Премиальная доставка") {
    return (
      <span className="inline-flex items-baseline tabular-nums tracking-[0.6px] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
        {title}
      </span>
    );
  }

  const match = title.match(/^(\d+)\s+(.+)$/);
  if (!match) return title;

  const [, numberPart, rest] = match;
  if (!numberPart || !rest) return title;

  return (
    <span className="inline-flex items-baseline gap-2 tabular-nums tracking-[0.6px] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <span className="text-[1.18em] leading-none">{numberPart}</span>
      <span className="leading-none">{rest}</span>
    </span>
  );
}

export default ProductPage;
