import { useEffect, useState } from "react";

import { formatPrice } from "../data/products";
import { ApiError } from "../lib/api-client";
import { addProductToCurrentCartBySlug, loadCurrentCart, removeCurrentCartItem, updateCurrentCartItem, type CartView } from "../lib/backend-api";

const perks = [
  ["/РєРѕСЂР·РёРЅР°/РіР°Р»РѕС‡РєР°.svg", "Р“Р°СЂР°РЅС‚РёСЏ 5 Р»РµС‚ РЅР° РІСЃРµ СЃРёСЃС‚РµРјС‹"],
  ["/РєРѕСЂР·РёРЅР°/РјР°С€РёРЅРєР°.svg", "Р‘РµСЂРµР¶РЅР°СЏ РґРѕСЃС‚Р°РІРєР° РѕР±РѕСЂСѓРґРѕРІР°РЅРёСЏ"],
];

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 border border-[#e8e3db] bg-white px-8 py-10">
      <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 max-w-[640px] text-[18px] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function CartPage() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const slugToAdd = url.searchParams.get("add");
        const data = slugToAdd ? await addProductToCurrentCartBySlug(slugToAdd) : await loadCurrentCart();

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
      const nextCart = await updateCurrentCartItem(itemId, quantity);
      setCart(nextCart);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Не удалось обновить корзину."));
    } finally {
      setActionLoading(false);
    }
  }

  async function removeItem(itemId: string) {
    setActionLoading(true);

    try {
      const nextCart = await removeCurrentCartItem(itemId);
      setCart(nextCart);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Не удалось удалить позицию."));
    } finally {
      setActionLoading(false);
    }
  }

  const authRequired = error instanceof ApiError && error.status === 401;
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discountTotal ?? 0;
  const vat = Math.round(Math.max(subtotal - discount, 0) * 0.2);
  const total = cart?.total ?? 0;
  const totals = [
    ["РџСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹Р№ РёС‚РѕРі", formatPrice(subtotal)],
    ["РЎРєРёРґРєР°", formatPrice(discount)],
    ["РќР”РЎ (20%)", formatPrice(vat)],
  ];

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">
            Р’РѕСЃС‚РѕРєРЎС‚СЂРѕР№Р­РєСЃРїРµСЂС‚
          </a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">РіР»Р°РІРЅР°СЏ</a>
            <a href="/about">Рѕ РЅР°СЃ</a>
            <a href="/services">СѓСЃР»СѓРіРё</a>
            <a href="/news">РїСЂРѕРµРєС‚С‹</a>
            <a href="/catalog">РєР°С‚Р°Р»РѕРі</a>
            <a href="/news">Р±Р»РѕРі</a>
          </nav>
          <div className="flex items-center gap-4">
            <img src="/image/Р»СѓРїР°.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <a href="/login" className="inline-flex h-12 items-center justify-center bg-[#050505] px-7 text-[14px] uppercase tracking-[1.2px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
              РІРѕР№С‚Рё
            </a>
          </div>
        </div>
      </header>

      <section className="px-4 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-[1480px] gap-10 xl:grid-cols-[1fr_500px]">
          <div>
            <h1 className="text-[56px] leading-none md:text-[86px] [font-family:'Cormorant_Garamond',serif]">РљРѕСЂР·РёРЅР°</h1>

            {loading ? <StateMessage title="Загрузка" description="Загружаю текущую корзину пользователя." /> : null}
            {!loading && authRequired ? (
              <StateMessage title="Нужен вход" description="Корзина привязана к авторизованному пользователю. Войдите, чтобы увидеть товары и управлять ими." />
            ) : null}
            {!loading && error && !authRequired ? <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось загрузить корзину."} /> : null}

            {!loading && !error ? (
              <>
                <div className="mt-16 grid grid-cols-[1.2fr_180px_160px_60px] items-center border-b border-[#e8e3db] pb-5 text-[14px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <span>РР·РґРµР»РёРµ</span>
                  <span>РљРѕР»-РІРѕ</span>
                  <span>Р¦РµРЅР°</span>
                  <span />
                </div>

                <div className="divide-y divide-[#e8e3db]">
                  {items.map((item) => (
                    <article key={item.id} className="grid grid-cols-[160px_1fr_180px_160px_60px] items-center gap-8 py-12">
                      <img
                        src={item.image}
                        alt={item.title}
                        width="220"
                        height="220"
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-cover"
                      />
                      <div>
                        <h2 className="text-[34px] leading-none [font-family:'Cormorant_Garamond',serif]">
                          {item.kind === "product" ? <a href={`/catalog/${item.slug}`}>{item.title}</a> : item.title}
                        </h2>
                        <p className="mt-4 text-[16px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          REF: {item.article}
                        </p>
                      </div>
                      <div className="flex h-14 items-center justify-between border border-[#e8e3db] px-5 text-[20px] [font-family:DM_Sans,Manrope,sans-serif]">
                        <button type="button" disabled={actionLoading || item.qty <= 1} onClick={() => changeQuantity(item.id, Math.max(1, item.qty - 1))}>
                          <img src="/РєРѕСЂР·РёРЅР°/РјРёРЅСѓСЃ.svg" alt="" aria-hidden="true" width="14" height="14" className="h-3.5 w-3.5" />
                        </button>
                        <span>{String(item.qty).padStart(2, "0")}</span>
                        <button type="button" disabled={actionLoading} onClick={() => changeQuantity(item.id, item.qty + 1)}>
                          <img src="/РєРѕСЂР·РёРЅР°/РїР»СЋСЃ.svg" alt="" aria-hidden="true" width="14" height="14" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[28px] [font-family:'Cormorant_Garamond',serif]">{formatPrice(item.totalPrice)}</p>
                      <button type="button" disabled={actionLoading} onClick={() => removeItem(item.id)} className="flex items-center justify-center">
                        <img src="/РєРѕСЂР·РёРЅР°/РєСЂРµСЃС‚.svg" alt="РЈРґР°Р»РёС‚СЊ С‚РѕРІР°СЂ" width="28" height="28" className="h-7 w-7" />
                      </button>
                    </article>
                  ))}
                </div>

                {items.length === 0 ? <div className="mt-10 text-[18px] text-[#6f6f69]">Корзина пока пуста.</div> : null}
              </>
            ) : null}

            <a href="/catalog" className="mt-12 inline-flex items-center gap-4 text-[18px] uppercase tracking-[2px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <img src="/РєРѕСЂР·РёРЅР°/СЃС‚СЂРµР»РѕС‡РєР° РЅР°Р·Р°Рґ.svg" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4" />
              РІРµСЂРЅСѓС‚СЊСЃСЏ РІ РєР°С‚Р°Р»РѕРі
            </a>
          </div>

          <aside className="border border-[#e8e3db] p-10 md:p-14">
            <h2 className="text-[50px] leading-none [font-family:'Cormorant_Garamond',serif]">РС‚РѕРіРѕ</h2>

            <div className="mt-12 space-y-8">
              {totals.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-6">
                  <span className="text-[20px] text-[#6f6f69]">{label}</span>
                  <span className="text-[20px]">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 border-t border-[#e8e3db] pt-12">
              <div className="flex items-end justify-between gap-6">
                <span className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Рљ РѕРїР»Р°С‚Рµ</span>
                <span className="text-[46px] leading-none [font-family:'Cormorant_Garamond',serif]">{formatPrice(total)}</span>
              </div>

              <a href="/checkout" className="mt-12 inline-flex h-20 w-full items-center justify-center bg-[#111] text-[20px] uppercase tracking-[3px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                РѕС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р·
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
    </main>
  );
}

export default CartPage;
