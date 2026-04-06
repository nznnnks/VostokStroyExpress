import { useEffect, useMemo, useState } from "react";
import { featuredProduct, formatPrice, products } from "../data/products";

const perks = [
  ["/корзина/галочка.svg", "Гарантия 5 лет на все системы"],
  ["/корзина/машинка.svg", "Бережная доставка оборудования"],
];

export function CartPage() {
  const [items, setItems] = useState<{ slug: string; qty: number }[]>([]);

  useEffect(() => {
    const storageKey = "stayse-cart";
    const url = new URL(window.location.href);
    const slugToAdd = url.searchParams.get("add");
    const saved = window.localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];
    let nextItems = Array.isArray(parsed) ? parsed : [];

    if (slugToAdd) {
      const existing = nextItems.find((item: { slug: string; qty: number }) => item.slug === slugToAdd);
      if (existing) {
        nextItems = nextItems.map((item: { slug: string; qty: number }) => item.slug === slugToAdd ? { ...item, qty: item.qty + 1 } : item);
      } else {
        nextItems = [...nextItems, { slug: slugToAdd, qty: 1 }];
      }
      window.history.replaceState({}, "", "/cart");
      window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
    }

    if (nextItems.length === 0) {
      nextItems = [
        { slug: "monolith-v2", qty: 1 },
        { slug: "matrix-7", qty: 1 },
      ];
      window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
    }

    setItems(nextItems);
  }, []);

  const hydratedItems = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((entry) => entry.slug === item.slug) ?? (item.slug === "monolith-v2" ? featuredProduct : undefined);
        if (!product) return null;
        return {
          ...item,
          product,
        };
      })
      .filter(Boolean) as Array<{ slug: string; qty: number; product: typeof featuredProduct }>;
  }, [items]);

  const subtotal = hydratedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const vat = Math.round(subtotal * 0.2);
  const total = subtotal + vat;

  function commit(nextItems: { slug: string; qty: number }[]) {
    setItems(nextItems);
    window.localStorage.setItem("stayse-cart", JSON.stringify(nextItems));
  }

  function increment(slug: string) {
    commit(items.map((item) => item.slug === slug ? { ...item, qty: item.qty + 1 } : item));
  }

  function decrement(slug: string) {
    commit(
      items
        .map((item) => item.slug === slug ? { ...item, qty: Math.max(1, item.qty - 1) } : item)
    );
  }

  function removeItem(slug: string) {
    commit(items.filter((item) => item.slug !== slug));
  }

  const totals = [
    ["Промежуточный итог", formatPrice(subtotal)],
    ["Доставка", "Рассчитывается далее"],
    ["НДС (20%)", formatPrice(vat)],
  ];

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

      <section className="px-4 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-[1480px] gap-10 xl:grid-cols-[1fr_500px]">
          <div>
            <h1 className="text-[56px] leading-none md:text-[86px] [font-family:'Cormorant_Garamond',serif]">Корзина</h1>

            <div className="mt-16 grid grid-cols-[1.2fr_180px_160px_60px] items-center border-b border-[#e8e3db] pb-5 text-[14px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <span>Изделие</span>
              <span>Кол-во</span>
              <span>Цена</span>
              <span />
            </div>

            <div className="divide-y divide-[#e8e3db]">
              {hydratedItems.map((item) => (
                <article key={item.slug} className="grid grid-cols-[160px_1fr_180px_160px_60px] items-center gap-8 py-12">
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    width="220"
                    height="220"
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                  <div>
                    <h2 className="text-[34px] leading-none [font-family:'Cormorant_Garamond',serif]">
                      <a href={`/catalog/${item.product.slug}`}>{item.product.title}</a>
                    </h2>
                    <p className="mt-4 text-[16px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      REF: {item.product.article}
                    </p>
                  </div>
                  <div className="flex h-14 items-center justify-between border border-[#e8e3db] px-5 text-[20px] [font-family:DM_Sans,Manrope,sans-serif]">
                    <button type="button" onClick={() => decrement(item.slug)}>
                      <img src="/корзина/минус.svg" alt="" aria-hidden="true" width="14" height="14" className="h-3.5 w-3.5" />
                    </button>
                    <span>{String(item.qty).padStart(2, "0")}</span>
                    <button type="button" onClick={() => increment(item.slug)}>
                      <img src="/корзина/плюс.svg" alt="" aria-hidden="true" width="14" height="14" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[28px] [font-family:'Cormorant_Garamond',serif]">{formatPrice(item.product.price * item.qty)}</p>
                  <button type="button" onClick={() => removeItem(item.slug)} className="flex items-center justify-center">
                    <img src="/корзина/крест.svg" alt="Удалить товар" width="28" height="28" className="h-7 w-7" />
                  </button>
                </article>
              ))}
            </div>

            <a href="/catalog" className="mt-12 inline-flex items-center gap-4 text-[18px] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <img src="/корзина/стрелочка назад.svg" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4" />
              вернуться в каталог
            </a>
          </div>

          <aside className="border border-[#e8e3db] p-10 md:p-14">
            <h2 className="text-[50px] leading-none [font-family:'Cormorant_Garamond',serif]">Итого</h2>

            <div className="mt-12 space-y-8">
              {totals.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-6">
                  <span className="text-[20px] text-[#6f6f69]">{label}</span>
                  <span className="text-[20px]">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-14">
              <p className="text-[16px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Промокод</p>
              <div className="mt-4 flex h-16 items-center justify-between border border-[#e8e3db] px-5">
                <span className="text-[18px] text-[#c2c2bf]">Введите код</span>
                <button className="text-[16px] uppercase tracking-[1.5px] text-[#d3b46a] [font-family:Jaldi,'JetBrains_Mono',monospace]">применить</button>
              </div>
            </div>

            <div className="mt-12 border-t border-[#e8e3db] pt-12">
              <div className="flex items-end justify-between gap-6">
                <span className="text-[26px] [font-family:'Cormorant_Garamond',serif]">К оплате</span>
                <span className="text-[46px] leading-none [font-family:'Cormorant_Garamond',serif]">{formatPrice(total)}</span>
              </div>

              <a href="/checkout" className="mt-12 inline-flex h-20 w-full items-center justify-center bg-[#111] text-[20px] uppercase tracking-[3px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                оформить заказ
              </a>

              <div className="mt-10 space-y-6">
                {perks.map(([icon, label]) => (
                  <div key={label as string} className="flex items-center gap-4 text-[18px] uppercase tracking-[1.6px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    <img src={icon as string} alt="" aria-hidden="true" width="22" height="22" className="h-5 w-5" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
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
            <img src="/корзина/мир.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
            <img src="/корзина/поделится.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
          </div>
        </div>
      </footer>
    </main>
  );
}

export default CartPage;
