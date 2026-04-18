import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "../data/products";
import { ApiError } from "../lib/api-client";
import { createOrder, type CartView } from "../lib/backend-api";
import { addProductToSessionCartBySlug, clearSessionCart, loadSessionCart, resolveSessionCartOrderItems } from "../lib/session-cart";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const paymentOptions = [
  ["card", "Банковская карта/СБП", "", "/checkout/card.svg"],
  ["installment", "B2B - рассрочка", "Временно недоступно", "/checkout/bank.svg"],
];

export function CheckoutPage() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<Error | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>(paymentOptions[0][0]);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const quickProduct = url.searchParams.get("product");
        const nextCart = quickProduct ? await addProductToSessionCartBySlug(quickProduct) : await loadSessionCart();

        if (quickProduct) {
          window.history.replaceState({}, "", "/checkout");
        }

        if (!active) {
          return;
        }

        setCart(nextCart);
        setCartError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setCartError(error instanceof Error ? error : new Error("Не удалось загрузить корзину."));
      } finally {
        if (active) {
          setCartLoading(false);
        }
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

  const hydratedItems = useMemo(() => cart?.items ?? [], [cart]);
  const primaryItem = hydratedItems[0];
  const subtotal = cart?.subtotal ?? 0;
  const vat = Math.round(subtotal * 0.2);
  const total = cart?.total ?? subtotal + vat;
  const summaryRows = [
    ["Стоимость товара", formatPrice(subtotal)],
    ["Доставка", subtotal > 0 ? "Рассчитывается далее" : "0 ₽"],
    ["НДС (20%)", formatPrice(vat)],
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (cartLoading) {
      setSubmitError("Корзина еще загружается. Повторите попытку.");
      return;
    }

    if (cartError) {
      setSubmitError(cartError.message);
      return;
    }

    if (hydratedItems.length === 0) {
      setSubmitError("Добавьте товары в корзину.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const contactName = `${formData.get("first_name") ?? ""} ${formData.get("last_name") ?? ""}`.trim();
    const contactPhone = String(formData.get("phone") ?? "").trim();
    const addressParts = [
      formData.get("city"),
      formData.get("postal_code"),
      formData.get("address"),
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    const deliveryAddress = addressParts.join(", ");

    setIsSubmitting(true);
    try {
      const itemsPayload = await resolveSessionCartOrderItems(cart);

      if (itemsPayload.length === 0) {
        throw new ApiError("Товары не найдены в каталоге. Обновите страницу.", 400);
      }

      await createOrder({
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        deliveryAddress: deliveryAddress || undefined,
        deliveryMethod: "Курьерская доставка",
        items: itemsPayload,
        payment: {
          method: selectedPayment === "card" ? "CARD" : "INVOICE",
        },
      });

      clearSessionCart();
      setCart((prev) => (prev ? { ...prev, items: [], subtotal: 0, discountTotal: 0, total: 0 } : prev));
      setSubmitSuccess("Заказ отправлен. Мы свяжемся с вами для подтверждения.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSubmitError("Войдите в аккаунт, чтобы подтвердить заказ.");
      } else if (error instanceof ApiError) {
        setSubmitError(error.message || "Не удалось отправить заказ.");
      } else {
        setSubmitError("Не удалось отправить заказ. Проверьте данные и попробуйте снова.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section className="px-4 py-10 md:px-10 md:py-14">
          <div className="mx-auto grid max-w-[1480px] gap-10 xl:grid-cols-[1fr_520px]">
          <div className="max-w-[920px]">
            <p className="breadcrumb-nav uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <a href="/" className="hover:text-[#111]">Главная</a>
              <span className="mx-2 text-[#b5b2ab]">/</span>
              <a href="/cart" className="hover:text-[#111]">Корзина</a>
              <span className="mx-2 text-[#b5b2ab]">/</span>
              <span>Оформление</span>
            </p>
            <h1 className="mt-6 text-[clamp(2.1rem,4.8vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif] md:mt-8">
              Оформление заказа
            </h1>
            <p className="mt-4 max-w-[520px] text-[clamp(0.98rem,1.1vw,1.15rem)] leading-[1.45] text-[#75756f] md:mt-6">
              Пожалуйста, заполните данные для доставки и оплаты вашей системы ВостокСтройЭксперт.
            </p>

            <form className="mt-10 md:mt-20" onSubmit={handleSubmit}>
              <div className="flex items-center gap-5 text-[#111]">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.5px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">01</span>
                <h2 className="text-[clamp(1.4rem,2vw,2rem)] uppercase tracking-[2px] [font-family:'Cormorant_Garamond',serif]">Контактные данные</h2>
              </div>
              <div className="mt-8 grid gap-8 md:mt-14 md:gap-12 md:grid-cols-2">
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Имя</span>
                  <input name="first_name" autoComplete="given-name" className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none" />
                </label>
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Фамилия</span>
                  <input name="last_name" autoComplete="family-name" className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none" />
                </label>
              </div>
              <label className="mt-8 block md:mt-12">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Телефон</span>
                <input name="phone" autoComplete="tel" className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none" />
              </label>
            

            <div className="mt-10 md:mt-20">
              <div className="flex items-center gap-5 text-[#111]">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.5px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">02</span>
                <h2 className="text-[clamp(1.4rem,2vw,2rem)] uppercase tracking-[2px] [font-family:'Cormorant_Garamond',serif]">Адрес доставки</h2>
              </div>
              <div className="mt-8 grid gap-8 md:mt-14 md:gap-12 md:grid-cols-[1fr_220px]">
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Город</span>
                  <input name="city" autoComplete="address-level2" className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none" />
                </label>
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Индекс</span>
                  <input name="postal_code" autoComplete="postal-code" className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none" />
                </label>
              </div>
              <label className="mt-8 block md:mt-12">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  Улица, дом, квартира
                </span>
                <input name="address" autoComplete="street-address" className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none" />
              </label>
            </div>

            <div className="mt-10 md:mt-20">
              <div className="flex items-center gap-5 text-[#111]">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.5px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">03</span>
                <h2 className="text-[clamp(1.4rem,2vw,2rem)] uppercase tracking-[2px] [font-family:'Cormorant_Garamond',serif]">Способ оплаты</h2>
              </div>
              <div className="mt-8 space-y-4 md:mt-12 md:space-y-5">
                {paymentOptions.map(([id, title, note, icon], index) => (
                  <label
                    key={title as string}
                    htmlFor={id as string}
                    className="flex min-h-[92px] cursor-pointer items-center justify-between border border-[#e8e3db] px-7 py-6"
                  >
                    <span className="flex items-center gap-5">
                      <input
                        id={id as string}
                        type="radio"
                        name="payment"
                        checked={selectedPayment === id}
                        onChange={() => setSelectedPayment(id as string)}
                        disabled={Boolean(note)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                          selectedPayment === id ? "border-[#111]" : "border-[#d7d2ca]"
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${selectedPayment === id ? "bg-[#111]" : "bg-transparent"}`} />
                      </span>
                      <span className="flex flex-wrap items-center gap-6">
                        <span className="text-[clamp(1rem,1.1vw,1.25rem)] uppercase tracking-[1px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</span>
                        {note ? (
                          <span className="text-[clamp(0.9rem,1vw,1.1rem)] uppercase tracking-[1px] text-[#a6a6a1] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                            {note}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <img
                      src={icon as string}
                      alt=""
                      aria-hidden="true"
                      width="28"
                      height="28"
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-7 opacity-70"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-10 max-w-[860px] md:mt-20">
              {submitError ? (
                <p className="mb-6 text-[clamp(0.75rem,0.6vw,0.9rem)] uppercase tracking-[2px] text-[#b24a3a] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  {submitError}
                </p>
              ) : null}
              {submitSuccess ? (
                <p className="mb-6 text-[clamp(0.75rem,0.6vw,0.9rem)] uppercase tracking-[2px] text-[#2f7a52] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  {submitSuccess}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || cartLoading || Boolean(cartError)}
                className="inline-flex h-20 w-full items-center justify-center bg-[#111] px-8 text-[clamp(1rem,1.2vw,1.4rem)] uppercase tracking-[4px] text-white transition-opacity [font-family:Jaldi,'JetBrains_Mono',monospace] disabled:opacity-60"
              >
                подтвердить заказ
              </button>
              <p className="mt-8 text-center text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[3px] text-[#8c8c86] [font-family:Jaldi,'JetBrains_Mono',monospace] md:mt-10">
                нажимая кнопку, вы соглашаетесь с условиями оферты
              </p>
            </div>
            </form>
          </div>

          <aside className="self-start border border-[#e8e3db] p-8 md:p-12">
            <h2 className="text-[clamp(1.2rem,1.6vw,1.75rem)] uppercase tracking-[3px] [font-family:'Cormorant_Garamond',serif]">Ваш заказ</h2>

            {primaryItem ? (
              <div className="mt-12 flex items-center gap-5">
                <a href={primaryItem.kind === "product" ? `/catalog/${primaryItem.slug}` : "/services"}>
                  <img
                    src={primaryItem.image}
                    alt={primaryItem.title}
                    width="120"
                    height="120"
                    loading="lazy"
                    decoding="async"
                    className="h-[92px] w-[92px] object-cover"
                  />
                </a>
                <div>
                  <p className="text-[clamp(1rem,1.1vw,1.3rem)] uppercase leading-[1.2] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {primaryItem.brandLabel ?? "AERIS PRECISION"}
                  </p>
                  <p className="mt-1 text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[1.2px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {primaryItem.title}
                  </p>
                  <p className="mt-2 text-[clamp(0.75rem,0.6vw,0.9rem)] uppercase tracking-[1.2px] text-[#a09f98] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {primaryItem.qty} шт.
                  </p>
                  <p className="mt-4 text-[clamp(1.2rem,1.5vw,1.65rem)] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {formatPrice(primaryItem.totalPrice)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-10 border-t border-[#e8e3db] pt-8">
              <div className="space-y-6">
                {summaryRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-6">
                    <span className="text-[clamp(0.9rem,1vw,1.1rem)] uppercase tracking-[1.2px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {label}
                    </span>
                    <span className="text-[clamp(0.9rem,1vw,1.1rem)] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-[#e8e3db] pt-8">
              <div className="flex items-center justify-between gap-6">
                <span className="text-[clamp(1.2rem,1.6vw,1.75rem)] uppercase tracking-[3px] [font-family:'Cormorant_Garamond',serif]">Итого</span>
                <span className="text-[clamp(1.3rem,1.7vw,2rem)] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-10 bg-[#f7f5f1] px-8 py-8">
              <p className="max-w-[320px] text-[clamp(0.75rem,0.6vw,0.9rem)] uppercase leading-[1.8] tracking-[1.6px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                В стоимость включена расширенная гарантия 5 лет и сезонное обслуживание в первый год эксплуатации.
              </p>
            </div>
          </aside>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

export default CheckoutPage;
