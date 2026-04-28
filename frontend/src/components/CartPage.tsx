import { useEffect, useMemo, useRef, useState } from "react";

import { formatPrice } from "../data/products";
import type { CartView } from "../lib/backend-api";
import { addProductToSessionCartBySlug, loadSessionCart, removeSessionCartItem, updateSessionCartItem } from "../lib/session-cart";
import { getStoredAccessToken } from "../lib/auth";
import SiteHeader from "./SiteHeader";

const perks = [
  ["/cart/check.svg", "Гарантия 5 лет на все системы"],
  ["/cart/delivery.svg", "Бережная доставка оборудования"],
];

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-8 border border-[#e8e3db] bg-white px-6 py-8 sm:px-8 sm:py-10">
      <h2 className="text-[clamp(1.6rem,2.2vw,2.2rem)] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 max-w-[640px] text-[clamp(1rem,1.1vw,1.15rem)] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function CartPage() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isCheckoutFloating, setIsCheckoutFloating] = useState(false);
  const [checkoutBarHeight, setCheckoutBarHeight] = useState(0);
  const checkoutSentinelRef = useRef<HTMLDivElement | null>(null);
  const checkoutBarRef = useRef<HTMLDivElement | null>(null);

  const totalsSectionPaddingBottom = useMemo(() => {
    if (!isMobile || !isCheckoutFloating || checkoutBarHeight <= 0) {
      return undefined;
    }

    return checkoutBarHeight + 16;
  }, [checkoutBarHeight, isCheckoutFloating, isMobile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 767px)");
    const handleMedia = () => setIsMobile(media.matches);

    handleMedia();
    media.addEventListener("change", handleMedia);

    return () => {
      media.removeEventListener("change", handleMedia);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsCheckoutFloating(false);
      return;
    }

    const sentinel = checkoutSentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsCheckoutFloating(!entry.isIntersecting);
      },
      { root: null, threshold: 0.01 },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const element = checkoutBarRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const ro = new ResizeObserver(() => {
      setCheckoutBarHeight(element.getBoundingClientRect().height);
    });

    ro.observe(element);
    setCheckoutBarHeight(element.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, [isMobile]);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const slugToAdd = url.searchParams.get("add");
        const data = slugToAdd ? await addProductToSessionCartBySlug(slugToAdd) : await loadSessionCart();

        if (slugToAdd) {
          window.history.replaceState({}, "", "/cart");
        }

        if (!active) {
          return;
        }

        setCart(data);
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить корзину."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

  async function changeQuantity(itemId: string, quantity: number) {
    if (!cart) {
      return;
    }

    setActionLoading(true);

    try {
      const nextCart = await updateSessionCartItem(itemId, quantity);
      setCart(nextCart);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Не удалось обновить корзину."));
    } finally {
      setActionLoading(false);
    }
  }

  async function removeItem(itemId: string) {
    setRemovingItemId(itemId);
    setActionLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      const nextCart = await removeSessionCartItem(itemId);
      setCart(nextCart);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Не удалось удалить позицию."));
    } finally {
      setActionLoading(false);
      setRemovingItemId((current) => (current === itemId ? null : current));
    }
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discountTotal ?? 0;
  const vat = Math.round(Math.max(subtotal - discount, 0) * 0.2);
  const total = cart?.total ?? 0;
  const totals = [
    ["Промежуточный итог", formatPrice(subtotal)],
    ["Скидка", formatPrice(discount)],
    ["НДС (20%)", formatPrice(vat)],
  ];

  function handleCheckoutClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const token = getStoredAccessToken("user");

    if (token) {
      return;
    }

    event.preventDefault();
    window.location.href = "/login?next=/checkout";
  }

  function CheckoutBar({ className }: { className?: string }) {
    return (
      <div className={className}>
        <div className="flex items-end justify-between gap-6">
          <span
            className="shrink-0 whitespace-nowrap text-[clamp(1.05rem,1.4vw,1.6rem)] [font-family:DM_Sans,Manrope,sans-serif]"
            style={{ whiteSpace: "nowrap" }}
          >
            К оплате
          </span>
          <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-[clamp(1.7rem,3vw,2.9rem)] leading-none [font-family:DM_Sans,Manrope,sans-serif]">
            {formatPrice(total)}
          </span>
        </div>

        <a
          href="/checkout"
          onClick={handleCheckoutClick}
          className="mt-5 inline-flex h-14 w-full items-center justify-center bg-[#111] text-[clamp(0.9rem,0.9vw,1.25rem)] uppercase tracking-[2px] text-white md:mt-12 md:h-20 md:tracking-[3px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
        >
          оформить заказ
        </a>
      </div>
    );
  }

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />

      <section className="px-4 py-6 md:px-10 md:py-16" style={{ paddingBottom: totalsSectionPaddingBottom }}>
        <div className="mx-auto grid max-w-[1480px] gap-6 md:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] 2xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="min-w-0">
            <p className="breadcrumb-nav uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <a href="/" className="hover:text-[#111]">Главная</a>
              <span className="mx-2 text-[#b5b2ab]">/</span>
              <span>Корзина</span>
            </p>
            <h1 className="mt-6 text-[clamp(2.2rem,4.8vw,5.4rem)] leading-none [font-family:'Cormorant_Garamond',serif] md:mt-8">Корзина</h1>

            {loading ? <StateMessage title="Загрузка" description="Загружаю текущую корзину пользователя." /> : null}
            {!loading && error ? <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось загрузить корзину."} /> : null}

            {!loading && !error ? (
              <>
                <div className="mt-10 hidden grid-cols-[minmax(0,1.2fr)_150px_130px_44px] items-center gap-6 border-b border-[#e8e3db] pb-5 text-[13px] uppercase tracking-[1.4px] text-[#7a7a75] lg:grid xl:grid-cols-[minmax(0,1.2fr)_170px_150px_52px] xl:text-[14px] xl:tracking-[1.5px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <span>Изделие</span>
                  <span>Кол-во</span>
                  <span>Цена</span>
                  <span />
                </div>

                <div className="divide-y divide-[#e8e3db]">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className={`grid grid-cols-1 gap-4 py-6 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[140px_minmax(0,1fr)_150px_130px_44px] lg:items-center lg:gap-6 lg:py-10 xl:grid-cols-[160px_minmax(0,1fr)_170px_150px_52px] xl:gap-8 xl:py-12 ${
                        removingItemId === item.id ? "pointer-events-none -translate-y-2 scale-[0.985] opacity-0 blur-[2px]" : "translate-y-0 scale-100 opacity-100 blur-0"
                      }`}
                    >
                      <div className="flex items-start gap-5 lg:block">
                        <img
                          src={item.image}
                          alt={item.title}
                          width="220"
                          height="220"
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-[110px] shrink-0 object-cover sm:w-[140px] lg:w-full"
                        />
                        <div className="min-w-0 flex-1 lg:hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="text-[clamp(1.3rem,1.8vw,1.8rem)] leading-tight [font-family:'Cormorant_Garamond',serif]">
                                {item.kind === "product" ? <a href={`/catalog/${item.slug}`}>{item.title}</a> : item.title}
                              </h2>
                              <p className="mt-3 text-[clamp(0.7rem,0.6vw,0.9rem)] uppercase tracking-[1.2px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                                REF: {item.article}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => removeItem(item.id)}
                              className="group -mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#7d7b76] transition-all duration-200 hover:bg-[#f1ebe2] hover:text-[#111] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                            >
                              <img src="/cart/remove.svg" alt="Удалить товар" width="24" height="24" className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="hidden min-w-0 lg:block">
                        <h2 className="text-[clamp(1.45rem,1.7vw,2.2rem)] leading-[0.94] [font-family:'Cormorant_Garamond',serif]">
                          {item.kind === "product" ? <a href={`/catalog/${item.slug}`}>{item.title}</a> : item.title}
                        </h2>
                        <p className="mt-4 text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          REF: {item.article}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 lg:block">
                        <span className="text-[clamp(0.65rem,0.5vw,0.8rem)] uppercase tracking-[1.4px] text-[#7a7a75] lg:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Кол-во</span>
                        <div className="flex h-10 w-[132px] items-center justify-between border border-[#e8e3db] px-3 text-[clamp(0.95rem,1vw,1.25rem)] [font-family:DM_Sans,Manrope,sans-serif] sm:h-11 sm:w-[150px] sm:px-4 lg:h-12 lg:w-full lg:px-3 xl:h-14 xl:px-5">
                          <button
                            type="button"
                            disabled={actionLoading || item.qty <= 1}
                            onClick={() => changeQuantity(item.id, Math.max(1, item.qty - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f1ebe2] hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent lg:h-9 lg:w-9 xl:h-10 xl:w-10"
                          >
                            <img src="/cart/minus.svg" alt="" aria-hidden="true" width="14" height="14" className="h-3 w-3 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5" />
                          </button>
                          <span
                            key={`${item.id}-${item.qty}`}
                            className="inline-block min-w-[2ch] text-center tabular-nums animate-[cartQtyPop_320ms_cubic-bezier(0.22,1,0.36,1)]"
                          >
                            {String(item.qty).padStart(2, "0")}
                          </span>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => changeQuantity(item.id, item.qty + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f1ebe2] hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent lg:h-9 lg:w-9 xl:h-10 xl:w-10"
                          >
                            <img src="/cart/plus.svg" alt="" aria-hidden="true" width="14" height="14" className="h-3 w-3 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-center justify-between lg:block">
                        <span className="text-[clamp(0.65rem,0.5vw,0.8rem)] uppercase tracking-[1.4px] text-[#7a7a75] lg:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Цена</span>
                        <p className="min-w-0 whitespace-nowrap text-[clamp(1.05rem,1.25vw,1.75rem)] [font-family:DM_Sans,Manrope,sans-serif] lg:text-[clamp(1rem,1.15vw,1.45rem)] xl:text-[clamp(1.15rem,1.35vw,1.75rem)]">{formatPrice(item.totalPrice)}</p>
                      </div>
                      <div className="hidden items-center justify-end lg:flex lg:justify-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => removeItem(item.id)}
                          className="group flex h-11 w-11 items-center justify-center rounded-full text-[#7d7b76] transition-all duration-200 hover:bg-[#f1ebe2] hover:text-[#111] hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent lg:h-10 lg:w-10 xl:h-12 xl:w-12"
                        >
                          <img src="/cart/remove.svg" alt="Удалить товар" width="28" height="28" className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {items.length === 0 ? <div className="mt-8 text-[clamp(1rem,1.1vw,1.15rem)] text-[#6f6f69]">Корзина пока пуста.</div> : null}
              </>
            ) : null}

            <a href="/catalog" className="mt-8 inline-flex items-center gap-3 text-[clamp(0.9rem,0.9vw,1.15rem)] uppercase tracking-[2px] text-[#6f6f69] md:mt-12 md:gap-4 [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <img src="/cart/back-arrow.svg" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4" />
              вернуться в каталог
            </a>
          </div>

          <aside className="min-w-0 border border-[#e8e3db] p-5 sm:p-6 md:p-10 xl:p-12 2xl:p-14">
            <h2 className="text-[clamp(1.8rem,3.2vw,3.1rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Итого</h2>

            <div className="mt-8 space-y-5 md:mt-12 md:space-y-8">
              {totals.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 md:gap-6">
                  <span className="min-w-0 text-[clamp(0.9rem,0.95vw,1.2rem)] text-[#6f6f69]">{label}</span>
                  <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-[clamp(0.95rem,0.95vw,1.2rem)]">{value}</span>
                </div>
              ))}
            </div>

            <div ref={checkoutSentinelRef} className="mt-8 border-t border-[#e8e3db] pt-8 md:mt-12 md:pt-12">
              <div className={isMobile && isCheckoutFloating ? "opacity-0 pointer-events-none select-none" : undefined} aria-hidden={isMobile && isCheckoutFloating}>
                <CheckoutBar />
              </div>

              <div className="mt-6 space-y-3 md:mt-10 md:space-y-6">
                {perks.map(([icon, label]) => (
                  <div key={label as string} className="flex items-center gap-3 text-[clamp(0.68rem,0.6vw,1.1rem)] uppercase tracking-[1.2px] text-[#6f6f69] md:gap-4 md:tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    <img src={icon as string} alt="" aria-hidden="true" width="22" height="22" className="h-4 w-4 md:h-5 md:w-5" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {isMobile ? (
                <div
                  ref={checkoutBarRef}
                  className={[
                    "fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e3db] bg-white px-4 py-4 shadow-[0_-12px_30px_rgba(0,0,0,0.06)] sm:px-6",
                    "transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
                    isCheckoutFloating ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none",
                  ].join(" ")}
                  aria-hidden={!isCheckoutFloating}
                >
                  <div className="mx-auto max-w-[1480px]">
                    <CheckoutBar />
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default CartPage;
