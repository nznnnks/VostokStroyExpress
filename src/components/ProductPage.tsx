import { featuredProduct, formatPrice, products, type Product } from "../data/products";

const perks = [
  ["/страница товара/галочка.svg", "10 лет гарантии", "Полная поддержка производителя"],
  ["/страница товара/машинка.svg", "Премиальная доставка", "Установка включена"],
];

const reviews = [
  ["Алексей", "★★★★☆"],
  ["Игорь", "★★★☆☆"],
];

type ProductPageProps = {
  product?: Product;
};

export function ProductPage({ product = featuredProduct }: ProductPageProps) {
  const gallery = product.gallery ?? [product.image];
  const specs = [
    ["Класс эффективности", product.efficiencyClass ?? "A Premium"],
    ["Площадь покрытия", product.coverage ?? "До 100 м²"],
    ["Акустика (тихий режим)", product.acoustics ?? "20 дБ"],
    ["Фильтрация", product.filtration ?? "HEPA 13"],
  ];
  const related = (product.relatedSlugs ?? [])
    .map((slug) => products.find((item) => item.slug === slug))
    .filter((item): item is Product => Boolean(item));
  const descriptionTitle = product.slug === "monolith-v2" ? "Создано для архитектурной интеграции" : `О модели ${product.title}`;

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">
            ВостокСтройЭксперт
          </a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">главная</a>
            <a href="/about">о нас</a>
            <a href="/services">услуги</a>
            <a href="/news">проекты</a>
            <a href="/catalog">каталог</a>
            <a href="/news">блог</a>
          </nav>
          <div className="flex items-center gap-4">
            <img src="/image/лупа.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <a href="/login" className="inline-flex h-12 items-center justify-center bg-[#050505] px-7 text-[14px] uppercase tracking-[1.2px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
              войти
            </a>
          </div>
        </div>
      </header>

      <section className="px-4 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-wrap items-center gap-5 text-[13px] uppercase tracking-[1.6px] text-[#787872] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/catalog" className="inline-flex h-12 items-center justify-center bg-[#111] px-8 text-white">назад</a>
            <p>Каталог</p>
            <span>/</span>
            <p>Системы климат-контроля</p>
            <span>/</span>
            <p>{product.title}</p>
          </div>

          <div className="mt-10 grid gap-10 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="relative overflow-hidden bg-[#f7f7f4]">
                <img
                  src={gallery[0]}
                  alt={product.title}
                  width="1200"
                  height="1500"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="aspect-[4/5] w-full object-cover"
                />
                <button className="absolute right-6 top-1/2 -translate-y-1/2 text-[72px] leading-none text-[#73736f]">›</button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                {gallery.slice(1).map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt=""
                    width="260"
                    height="200"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[1.1/1] w-full object-cover"
                  />
                ))}
              </div>
            </div>

            <aside className="xl:pt-6">
              <p className="text-[13px] uppercase tracking-[1.8px] text-[#7e7e79] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                артикул: {product.article} / бренд: {product.brandLabel}
              </p>
              <h1 className="mt-6 max-w-[560px] text-[58px] leading-[0.98] tracking-[-0.04em] text-[#111] md:text-[86px] [font-family:'Cormorant_Garamond',serif]">
                {product.title}
              </h1>
              <p className="mt-8 text-[40px] leading-none text-[#111] [font-family:DM_Sans,Manrope,sans-serif]">{formatPrice(product.price)}</p>

              <dl className="mt-14 divide-y divide-[#e8e3db] border-y border-[#e8e3db]">
                {specs.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[1fr_auto] gap-6 py-5">
                    <dt className="text-[15px] uppercase tracking-[1.5px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</dt>
                    <dd className="text-right text-[18px] text-[#111] [font-family:DM_Sans,Manrope,sans-serif]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-12 grid gap-5">
                <a href={`/cart?add=${product.slug}`} className="inline-flex h-18 items-center justify-center bg-[#111] px-8 text-[18px] uppercase tracking-[3px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  в корзину
                </a>
                <a href={`/checkout?product=${product.slug}`} className="inline-flex h-18 items-center justify-center border border-[#111] px-8 text-[18px] uppercase tracking-[3px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  купить в 1 клик
                </a>
              </div>

              <div className="mt-14 grid gap-8 border-t border-[#e8e3db] pt-8 md:grid-cols-2">
                {perks.map(([icon, title, note]) => (
                  <div key={title as string} className="flex items-start gap-4">
                    <img src={icon as string} alt="" aria-hidden="true" width="20" height="20" className="mt-1 h-5 w-5" />
                    <div>
                      <p className="text-[16px] uppercase tracking-[1px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</p>
                      <p className="mt-1 text-[15px] text-[#787872]">{note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-end">
                <div className="w-full max-w-[250px] border border-[#d9d3cb] p-5 text-center">
                  <img
                    src="/страница товара/icons8-germany-48 1.png"
                    alt="Germany"
                    width="120"
                    height="120"
                    loading="lazy"
                    decoding="async"
                    className="mx-auto h-28 w-28 object-contain"
                  />
                  <p className="mt-3 text-[14px] uppercase tracking-[3px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {product.brandLabel}
                  </p>
                  <p className="mt-2 text-[18px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    заказов: 230
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px] border-t border-[#e8e3db] pt-8">
          <div className="flex gap-14 text-[16px] uppercase tracking-[1.5px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="#description" className="border-t-2 border-[#111] pt-5 text-[#111]">Описание</a>
            <a href="#specs" className="pt-5">Характеристики</a>
          </div>

          <div className="mt-16 grid gap-12 xl:grid-cols-[1fr_530px]">
            <div id="description">
              <h2 className="text-[44px] leading-none md:text-[64px] [font-family:'Cormorant_Garamond',serif]">
                {descriptionTitle}
              </h2>
              <div className="mt-10 max-w-[930px] space-y-10 text-[18px] leading-[1.7] text-[#676761] md:text-[24px] [font-family:DM_Sans,Manrope,sans-serif]">
                <p>
                  {product.description?.[0]}
                </p>
                <p>
                  {product.description?.[1]}
                </p>
              </div>
            </div>

            <aside id="specs" className="border border-[#e8e3db]">
              <div className="flex items-center justify-between border-b border-[#e8e3db] px-8 py-12 text-[16px] uppercase tracking-[2px] text-[#7b7b76] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span>Характеристики</span>
                <span className="text-[#111]">{product.brandLabel}</span>
              </div>
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#e8e3db] px-6 py-6">
                  <span className="text-[16px] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</span>
                  <span className="text-[18px] [font-family:'Cormorant_Garamond',serif]">{value}</span>
                </div>
              ))}
              <div className="border-b border-[#e8e3db] px-6 py-6">
                <span className="text-[16px] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">Артикул</span>
                <p className="mt-2 text-[18px] [font-family:'Cormorant_Garamond',serif]">{product.article}</p>
              </div>
              <div className="px-6 py-6">
                <span className="text-[16px] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">Отзывы</span>
                <div className="mt-4 space-y-4">
                  {reviews.map(([name, stars]) => (
                    <div key={name as string} className="flex items-center justify-between">
                      <span className="text-[18px] [font-family:'Cormorant_Garamond',serif]">{name}</span>
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
          <h2 className="text-[46px] leading-none md:text-[68px] [font-family:'Cormorant_Garamond',serif]">Возможно пригодится</h2>
          <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
            {related.map((relatedProduct) => (
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
                  <p className="text-[14px] uppercase tracking-[2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace]">{relatedProduct.brandLabel}</p>
                  <h3 className="mt-2 text-[34px] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">
                    <a href={`/catalog/${relatedProduct.slug}`}>{relatedProduct.title}</a>
                  </h3>
                  <p className="mt-4 text-[22px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{formatPrice(relatedProduct.price)}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="inline-flex h-16 items-center justify-center bg-[#111] px-14 text-[18px] uppercase tracking-[3px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
              загрузить еще
            </button>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-[#e8e3db] bg-[#f7f5f1] px-4 py-12 md:px-10">
        <div className="mx-auto grid max-w-[1480px] gap-10 md:grid-cols-[1.1fr_1.2fr_1fr]">
          <div>
            <p className="text-[26px] italic [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</p>
            <p className="mt-10 max-w-[360px] text-[15px] uppercase leading-10 tracking-[1.8px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              архитектурная климатическая интеграция для нового поколения антропогенной среды.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Карта сайта</h3>
              <div className="mt-6 space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[36px]">
              <div className="space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[36px]">
              <div className="space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Юридическая информация</h3>
            <div className="mt-10 space-y-8 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <p>Соглашение о конфиденциальности</p>
              <p>Условия</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1480px] flex-col gap-4 border-t border-[#e8e3db] pt-6 text-[12px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace] md:flex-row md:items-center md:justify-between">
          <p>© 2026 <span className="[font-family:'Cormorant_Garamond',serif] italic text-[#5b5b56]">ВостокСтройЭксперт</span> climate technologies. Все права защищены.</p>
          <div className="flex items-center gap-6">
            <img src="/image/planet.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4 object-contain opacity-70" />
          </div>
        </div>
      </footer>
    </main>
  );
}

export default ProductPage;
