import { useEffect, useState } from "react";
import { formatPrice, type Product } from "../data/products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const perks = [
  ["/product/check.svg", "10 лет гарантии", "Полная поддержка производителя"],
  ["/product/delivery.svg", "Премиальная доставка", "Установка включена"],
];

const reviews = [
  ["Алексей", "★★★★☆"],
  ["Игорь", "★★★☆☆"],
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

export function ProductPage({ product, relatedProducts, allProducts }: ProductPageProps) {
  const [visibleCount, setVisibleCount] = useState(4);
  const gallery = product.gallery ?? [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const countryFlag = toFlagEmoji(product.country);
  const specs = [
    ["Класс эффективности", product.efficiencyClass ?? "A Premium"],
    ["Площадь покрытия", product.coverage ?? "До 100 м²"],
    ["Акустика (тихий режим)", product.acoustics ?? "20 дБ"],
    ["Фильтрация", product.filtration ?? "HEPA 13"],
  ];
  const allList = (allProducts ?? []).filter((item) => item.slug !== product.slug);
  const primaryRelated = relatedProducts && relatedProducts.length > 0 ? relatedProducts : allList;
  const combinedRelated = [
    ...primaryRelated,
    ...allList.filter((item) => !primaryRelated.find((entry) => entry.slug === item.slug)),
  ];
  const visibleRelated = combinedRelated.slice(0, visibleCount);
  const canLoadMore = visibleCount < combinedRelated.length;
  const descriptionTitle = product.slug === "monolith-v2" ? "Создано для архитектурной интеграции" : `О модели ${product.title}`;
  const activeImage = gallery[activeImageIndex] ?? gallery[0];

  useEffect(() => {
    setActiveImageIndex(0);
    setPreviousImage(null);
    setIsImageTransitioning(false);
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
    const normalizedIndex = ((nextIndex % gallery.length) + gallery.length) % gallery.length;
    if (normalizedIndex === activeImageIndex) return;
    setPreviousImage(activeImage);
    setActiveImageIndex(normalizedIndex);
    setIsImageTransitioning(true);
  }

  function showNextImage() {
    goToImage(activeImageIndex + 1);
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section className="px-4 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-wrap items-center gap-5 text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[1.6px] text-[#787872] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/catalog" className="inline-flex h-12 items-center justify-center bg-[#111] px-8 text-white">назад</a>
            <a href="/" className="hover:text-[#111]">Главная</a>
            <span className="text-[#b5b2ab]">/</span>
            <a href="/catalog" className="hover:text-[#111]">Каталог</a>
            <span className="text-[#b5b2ab]">/</span>
            <span>Системы климат-контроля</span>
            <span className="text-[#b5b2ab]">/</span>
            <span>{product.title}</span>
          </div>

          <div className="mt-10 grid gap-10 xl:grid-cols-[1.15fr_0.85fr]">
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
                  onClick={showNextImage}
                  disabled={gallery.length <= 1}
                  aria-label="Следующее фото"
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[clamp(2.5rem,4vw,4.5rem)] leading-none text-[#73736f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
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
              <h1 className="mt-6 max-w-[560px] text-[clamp(2.6rem,5vw,5.4rem)] leading-[0.98] tracking-[-0.04em] text-[#111] [font-family:'Cormorant_Garamond',serif]">
                {product.title}
              </h1>
              <p className="mt-8 text-[clamp(1.8rem,2.6vw,2.6rem)] leading-none text-[#111] [font-family:DM_Sans,Manrope,sans-serif]">{formatPrice(product.price)}</p>

              <dl className="mt-14 divide-y divide-[#e8e3db] border-y border-[#e8e3db]">
                {specs.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[1fr_auto] gap-6 py-5">
                    <dt className="text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[1.5px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</dt>
                    <dd className="text-right text-[clamp(0.95rem,1vw,1.15rem)] text-[#111] [font-family:DM_Sans,Manrope,sans-serif]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-12 grid gap-5">
                <a href={`/cart?add=${product.slug}`} className="inline-flex h-18 items-center justify-center bg-[#111] px-8 text-[clamp(0.95rem,0.9vw,1.15rem)] uppercase tracking-[3px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  в корзину
                </a>
                <a href={`/checkout?product=${product.slug}`} className="inline-flex h-18 items-center justify-center border border-[#111] px-8 text-[clamp(0.95rem,0.9vw,1.15rem)] uppercase tracking-[3px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  купить в 1 клик
                </a>
              </div>

              <div className="mt-14 grid gap-8 border-t border-[#e8e3db] pt-8 md:grid-cols-2">
                {perks.map(([icon, title, note]) => (
                  <div key={title as string} className="flex items-start gap-4">
                    <img src={icon as string} alt="" aria-hidden="true" width="20" height="20" className="mt-1 h-5 w-5" />
                    <div>
                      <p className="text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[1px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</p>
                      <p className="mt-1 text-[clamp(0.85rem,0.75vw,0.95rem)] text-[#787872]">{note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-end">
                <a
                  href={`/catalog?brand=${encodeURIComponent(product.brand)}`}
                  className="block w-full max-w-[250px] border border-[#d9d3cb] p-5 text-center transition-colors hover:border-[#b6aea3]"
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
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px] border-t border-[#e8e3db] pt-8">
          <div className="flex gap-14 text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[1.5px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="#description" className="border-t-2 border-[#111] pt-5 text-[#111]">Описание</a>
            <a href="#specs" className="pt-5">Характеристики</a>
          </div>

          <div className="mt-16 grid gap-12 xl:grid-cols-[1fr_530px]">
            <div id="description">
              <h2 className="text-[clamp(2rem,3.4vw,4rem)] leading-none [font-family:'Cormorant_Garamond',serif]">
                {descriptionTitle}
              </h2>
              <div className="mt-10 max-w-[930px] space-y-10 text-[clamp(1rem,1.2vw,1.5rem)] leading-[1.7] text-[#676761] [font-family:DM_Sans,Manrope,sans-serif]">
                <p>
                  {product.description?.[0]}
                </p>
                <p>
                  {product.description?.[1]}
                </p>
              </div>
            </div>

            <aside id="specs" className="border border-[#e8e3db]">
              <div className="flex items-center justify-between border-b border-[#e8e3db] px-8 py-12 text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#7b7b76] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span>Характеристики</span>
                <span className="text-[#111]">{product.brandLabel}</span>
              </div>
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#e8e3db] px-6 py-6">
                  <span className="text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</span>
                  <span className="text-[clamp(0.95rem,1vw,1.15rem)] [font-family:'Cormorant_Garamond',serif]">{value}</span>
                </div>
              ))}
              <div className="border-b border-[#e8e3db] px-6 py-6">
                <span className="text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">Артикул</span>
                <p className="mt-2 text-[clamp(0.95rem,1vw,1.15rem)] [font-family:'Cormorant_Garamond',serif]">{product.article}</p>
              </div>
              <div className="px-6 py-6">
                <span className="text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">Отзывы</span>
                <div className="mt-4 space-y-4">
                  {reviews.map(([name, stars]) => (
                    <div key={name as string} className="flex items-center justify-between">
                      <span className="text-[clamp(0.95rem,1vw,1.15rem)] [font-family:'Cormorant_Garamond',serif]">{name}</span>
                      <span className="text-[#d2ad58]">{stars}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px]">
          <h2 className="text-[clamp(2rem,3.6vw,4.2rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Возможно пригодится</h2>
          <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleRelated.map((relatedProduct) => (
              <article key={relatedProduct.slug}>
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
                <div className="mt-6">
                  <p className="text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace]">{relatedProduct.brandLabel}</p>
                  <h3 className="mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">
                    <a href={`/catalog/${relatedProduct.slug}`}>{relatedProduct.title}</a>
                  </h3>
                  <p className="mt-4 text-[clamp(1rem,1.2vw,1.45rem)] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{formatPrice(relatedProduct.price)}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => Math.min(combinedRelated.length, current + 4))}
              disabled={!canLoadMore}
              className="inline-flex h-16 items-center justify-center bg-[#111] px-14 text-[clamp(0.95rem,0.9vw,1.15rem)] uppercase tracking-[3px] text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 [font-family:Jaldi,'JetBrains_Mono',monospace]"
            >
              загрузить еще
            </button>
          </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

export default ProductPage;
