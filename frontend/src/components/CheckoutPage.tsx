import { useEffect, useMemo, useRef, useState } from "react";
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

const YANDEX_MAPS_API_KEY = "f7686050-c67e-4ae2-adb5-bf59b6bee101";
const YANDEX_SUGGEST_API_KEY = "b6fa94c3-dc7a-4feb-945d-40ce8c6c82b0";

type YandexSuggestItem = {
  title?: string;
  subtitle?: string;
  formattedAddress?: string;
};

type YandexSuggestView = {
  destroy: () => void;
  events: {
    add: (event: string, handler: (payload: { get: (key: string) => unknown }) => void) => void;
  };
};

type YandexMapsApi = {
  ready: (callback: () => void) => void;
  SuggestView: new (
    element: HTMLInputElement | string,
    options?: Record<string, unknown>,
  ) => YandexSuggestView;
  geocode: (
    request: string,
    options?: Record<string, unknown>,
  ) => {
    then: (
      onFulfilled: (result: {
        geoObjects: {
          getLength: () => number;
          get: (index: number) => {
            getAddressLine: () => string;
            geometry?: { getCoordinates?: () => number[] };
            properties?: {
              get: (key: string) => unknown;
            };
          };
        };
      }) => void,
    ) => {
      catch: (onRejected: (error: unknown) => void) => unknown;
    };
  };
};

declare global {
  interface Window {
    ymaps?: YandexMapsApi;
  }
}

type AddressVerificationState = {
  confirmed: boolean;
  formattedAddress: string;
  coords: string;
  postalCode: string;
};

export function CheckoutPage() {
  const orderSummaryRef = useRef<HTMLElement | null>(null);
  const [isQuickCheckout, setIsQuickCheckout] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [cart, setCart] = useState<CartView | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<Error | null>(null);
  const [orderSummaryTop, setOrderSummaryTop] = useState(24);
  const [selectedPayment, setSelectedPayment] = useState<string>(paymentOptions[0][0]);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [addressVerification, setAddressVerification] = useState<AddressVerificationState>({
    confirmed: false,
    formattedAddress: "",
    coords: "",
    postalCode: "",
  });
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const suggestViewRef = useRef<YandexSuggestView | null>(null);

  function extractAddressFieldsFromMetadata(metadata: unknown, fallbackAddress: string) {
    const geocoderMeta = metadata as
      | {
          text?: string;
          Address?: {
            formatted?: string;
            Components?: Array<{ kind?: string; name?: string }>;
            postal_code?: string;
          };
        }
      | undefined;

    const components = geocoderMeta?.Address?.Components ?? [];
    const findComponent = (...kinds: string[]) =>
      components.find((component) => component.kind && kinds.includes(component.kind))?.name ?? "";

    const locality =
      findComponent("locality") ||
      findComponent("district");
    const street = findComponent("street");
    const house = findComponent("house");
    const postal = geocoderMeta?.Address?.postal_code || findComponent("postal_code");

    return {
      formattedAddress: geocoderMeta?.text || geocoderMeta?.Address?.formatted || fallbackAddress,
      cityValue: locality,
      lineValue: [street, house].filter(Boolean).join(", ") || fallbackAddress,
      postalCodeValue: postal,
    };
  }

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const quickProduct = url.searchParams.get("product");
        setIsQuickCheckout(Boolean(quickProduct));
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
  const visibleItems = showAllItems ? hydratedItems : hydratedItems.slice(0, 3);
  const hiddenItemsCount = Math.max(hydratedItems.length - 3, 0);
  const subtotal = cart?.subtotal ?? 0;
  const vat = Math.round(subtotal * 0.2);
  const total = cart?.total ?? subtotal + vat;
  const isAddressConfirmed = addressVerification.confirmed;
  const summaryRows = [
    ["Стоимость товара", formatPrice(subtotal)],
    ["Доставка", subtotal > 0 ? "Рассчитывается далее" : "0 ₽"],
    ["НДС (20%)", formatPrice(vat)],
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initSuggest = () => {
      const ymaps = window.ymaps;
      const input = addressInputRef.current;
      if (!ymaps || !input) return;

      ymaps.ready(() => {
        if (cancelled || !addressInputRef.current) return;

        suggestViewRef.current?.destroy();
        const suggestView = new ymaps.SuggestView(addressInputRef.current, {
          provider: "yandex#map",
          results: 6,
        });
        suggestViewRef.current = suggestView;
        setIsAddressLoading(false);

        suggestView.events.add("select", (event) => {
          const item = event.get("item") as { value?: string; displayName?: string } | undefined;
          const selectedAddress = item?.value || item?.displayName || "";

          if (!selectedAddress) {
            setSubmitError("Не удалось распознать выбранный адрес.");
            return;
          }

          setSubmitError("");
          setIsAddressLoading(true);

          ymaps
            .geocode(selectedAddress, { results: 1 })
            .then((result) => {
              const first = result.geoObjects.get(0);
              if (!first) {
                throw new Error("Выбранный адрес не найден в Яндекс Картах.");
              }

              const formattedAddress = first.getAddressLine?.() ?? selectedAddress;
              const coords = first.geometry?.getCoordinates?.() ?? [];
              const metadata = first.properties?.get("metaDataProperty.GeocoderMetaData");
              const extracted = extractAddressFieldsFromMetadata(metadata, formattedAddress);

              setCity(extracted.cityValue || city);
              setAddressLine(selectedAddress);
              if (extracted.postalCodeValue) {
                setPostalCode(extracted.postalCodeValue);
              }
              setAddressVerification({
                confirmed: true,
                formattedAddress: extracted.formattedAddress,
                coords: Array.isArray(coords) ? coords.join(" ") : "",
                postalCode: extracted.postalCodeValue,
              });
              setIsAddressLoading(false);
            })
            .catch((error) => {
              const message = error instanceof Error ? error.message : "Не удалось подтвердить адрес.";
              setAddressVerification({
                confirmed: false,
                formattedAddress: "",
                coords: "",
                postalCode: "",
              });
              setSubmitError(message);
              setIsAddressLoading(false);
            });
        });
      });
    };

    if (window.ymaps) {
      initSuggest();
      return () => {
        cancelled = true;
        suggestViewRef.current?.destroy();
        suggestViewRef.current = null;
      };
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${encodeURIComponent(YANDEX_MAPS_API_KEY)}&suggest_apikey=${encodeURIComponent(YANDEX_SUGGEST_API_KEY)}`;
    script.async = true;
    script.onload = () => initSuggest();
    script.onerror = () => {
      setIsAddressLoading(false);
      setSubmitError("Не удалось загрузить Яндекс Карты для подсказок адреса.");
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      suggestViewRef.current?.destroy();
      suggestViewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const element = orderSummaryRef.current;
    if (!element) return;

    let rafId: number | null = null;

    const updateOrderSummaryPosition = () => {
      if (window.innerWidth < 1280) {
        setOrderSummaryTop(24);
        return;
      }

      const headerOffsetRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-header-offset")
        .trim();
      const headerOffset = Number.parseFloat(headerOffsetRaw) || 76;
      const viewportHeight = window.innerHeight;
      const elementHeight = element.getBoundingClientRect().height;
      const availableHeight = Math.max(viewportHeight - headerOffset - 24, 0);
      const centeredOffset = Math.max((availableHeight - elementHeight) / 2, 12);

      setOrderSummaryTop((current) => {
        const next = Math.round(headerOffset + centeredOffset);
        return current === next ? current : next;
      });
    };

    const scheduleUpdate = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateOrderSummaryPosition();
      });
    };

    scheduleUpdate();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleUpdate()) : null;
    resizeObserver?.observe(element);

    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [hydratedItems.length, subtotal, vat, total, selectedPayment, isQuickCheckout]);

  function handleCityChange(value: string) {
    setCity(value);
    setAddressVerification((prev) => ({ ...prev, confirmed: false, formattedAddress: "", coords: "", postalCode: "" }));
  }

  function handleAddressChange(value: string) {
    setAddressLine(value);
    setAddressVerification((prev) => ({ ...prev, confirmed: false, formattedAddress: "", coords: "", postalCode: "" }));
    setSubmitError("");
  }

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

    if (!isAddressConfirmed) {
      setSubmitError("Выберите адрес из подсказок Яндекса, чтобы оформить заказ.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const contactName = `${formData.get("first_name") ?? ""} ${formData.get("last_name") ?? ""}`.trim();
    const contactPhone = String(formData.get("phone") ?? "").trim();
    const contactEmail = String(formData.get("email") ?? "").trim();
    const deliveryAddress = addressLine.trim() || addressVerification.formattedAddress;

    if (isQuickCheckout && !contactEmail) {
      setSubmitError("Укажите email для быстрого оформления.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = await resolveSessionCartOrderItems(cart);

      if (itemsPayload.length === 0) {
        throw new ApiError("Товары не найдены в каталоге. Обновите страницу.", 400);
      }

      await createOrder({
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        email: isQuickCheckout ? contactEmail || undefined : undefined,
        deliveryAddress: deliveryAddress || undefined,
        deliveryMethod: addressVerification.coords
          ? `Курьерская доставка (${addressVerification.coords})`
          : "Курьерская доставка",
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

            <form id="checkout-form" className="mt-10 md:mt-20" onSubmit={handleSubmit}>
              <div className="flex items-center gap-5 text-[#111]">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.5px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">01</span>
                <h2 className="text-[clamp(1.4rem,2vw,2rem)] uppercase tracking-[2px] [font-family:'Cormorant_Garamond',serif]">Контактные данные</h2>
              </div>
              <div className="mt-8 grid gap-8 md:mt-14 md:gap-12 md:grid-cols-2">
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Имя</span>
                  <input
                    name="first_name"
                    autoComplete="given-name"
                    placeholder="Например, Иван"
                    className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                  />
                </label>
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Фамилия</span>
                  <input
                    name="last_name"
                    autoComplete="family-name"
                    placeholder="Например, Иванов"
                    className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                  />
                </label>
              </div>
              <label className="mt-8 block md:mt-12">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Телефон</span>
                <input
                  name="phone"
                  autoComplete="tel"
                  placeholder="+7 (999) 123-45-67"
                  className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                />
              </label>
              {isQuickCheckout ? (
                <label className="mt-8 block md:mt-10">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Email</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                  />
                </label>
              ) : null}
            

            <div className="mt-10 md:mt-20">
              <div className="flex items-center gap-5 text-[#111]">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.5px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">02</span>
                <h2 className="text-[clamp(1.4rem,2vw,2rem)] uppercase tracking-[2px] [font-family:'Cormorant_Garamond',serif]">Адрес доставки</h2>
              </div>
              <div className="mt-8 grid gap-8 md:mt-14 md:gap-12 md:grid-cols-[1fr_220px]">
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Город</span>
                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="Например, Москва"
                    value={city}
                    onChange={(event) => handleCityChange(event.target.value)}
                    className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                  />
                </label>
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Индекс</span>
                  <input
                    name="postal_code"
                    autoComplete="postal-code"
                    placeholder="101000"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                  />
                </label>
              </div>
              <label className="mt-8 block md:mt-12 relative">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  Улица, дом, квартира
                </span>
                <input
                  ref={addressInputRef}
                  name="address"
                  autoComplete="street-address"
                  placeholder="Начните вводить адрес и выберите вариант из списка"
                  value={addressLine}
                  onChange={(event) => handleAddressChange(event.target.value)}
                  className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                />
                {isAddressLoading ? (
                  <p className="mt-3 text-[12px] uppercase tracking-[1.2px] text-[#8c8c86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Загружаем Яндекс-подсказки...
                  </p>
                ) : null}
              </label>
              <div className="mt-4 min-h-[24px]">
                {isAddressConfirmed ? (
                  <p className="text-[12px] uppercase tracking-[1.2px] text-[#2f7a52] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Адрес подтвержден: {addressVerification.formattedAddress}
                  </p>
                ) : (
                  <p className="text-[12px] uppercase tracking-[1.2px] text-[#8c8c86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Для оформления заказа выберите адрес из подсказок Яндекса.
                  </p>
                )}
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
              <div className="min-h-[20px]" />
            </div>
            </form>
          </div>

          <aside
            ref={orderSummaryRef}
            style={{ top: `${orderSummaryTop}px` }}
            className="self-start border border-[#e8e3db] p-8 md:p-12 xl:sticky xl:max-h-[calc(100svh-var(--site-header-offset,76px)-24px)] xl:overflow-y-auto"
          >
            <h2 className="text-[clamp(1.2rem,1.6vw,1.75rem)] uppercase tracking-[3px] [font-family:'Cormorant_Garamond',serif]">Ваш заказ</h2>

            {hydratedItems.length > 0 ? (
              <div className="mt-12 space-y-6">
                {visibleItems.map((item, index) => (
                  <div
                    key={`${item.kind}-${item.slug}-${index}`}
                    className={index === 0 ? "flex items-center gap-5" : "flex items-center gap-5 border-t border-[#e8e3db] pt-6"}
                  >
                    <a href={item.kind === "product" ? `/catalog/${item.slug}` : "/services"}>
                      <img
                        src={item.image}
                        alt={item.title}
                        width="120"
                        height="120"
                        loading="lazy"
                        decoding="async"
                        className="h-[92px] w-[92px] object-cover"
                      />
                    </a>
                    <div>
                      <p className="text-[clamp(1rem,1.1vw,1.3rem)] uppercase leading-[1.2] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {item.brandLabel ?? "AERIS PRECISION"}
                      </p>
                      <p className="mt-1 text-[clamp(0.85rem,0.8vw,1rem)] uppercase tracking-[1.2px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[clamp(0.75rem,0.6vw,0.9rem)] uppercase tracking-[1.2px] text-[#a09f98] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {item.qty} шт.
                      </p>
                      <p className="mt-4 text-[clamp(1.2rem,1.5vw,1.65rem)] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
                {hiddenItemsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllItems((current) => !current)}
                    className="inline-flex items-center gap-3 pt-1 text-[clamp(0.82rem,0.9vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] transition-colors hover:text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    <span
                      className={`text-[1rem] leading-none transition-transform ${showAllItems ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    >
                      ↓
                    </span>
                    {showAllItems ? "Свернуть список" : `Показать еще ${hiddenItemsCount}`}
                  </button>
                ) : null}
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

            <div className="mt-10 border-t border-[#e8e3db] pt-8">
              <div className="flex items-center gap-4 text-[#111]">
                <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.5px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">03</span>
                <h2 className="text-[clamp(1.2rem,1.6vw,1.75rem)] uppercase tracking-[2px] [font-family:'Cormorant_Garamond',serif]">Способ оплаты</h2>
              </div>
              <div className="mt-6 space-y-4">
                {paymentOptions.map(([id, title, note, icon]) => (
                  <label
                    key={title as string}
                    htmlFor={id as string}
                    className="flex min-h-[86px] cursor-pointer items-center justify-between border border-[#e8e3db] px-6 py-5 transition-colors hover:border-[#d8c7a6]"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <input
                        id={id as string}
                        type="radio"
                        name="payment"
                        checked={selectedPayment === id}
                        onChange={() => setSelectedPayment(id as string)}
                        disabled={Boolean(note)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          selectedPayment === id ? "border-[#111]" : "border-[#d7d2ca]"
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${selectedPayment === id ? "bg-[#111]" : "bg-transparent"}`} />
                      </span>
                      <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-[clamp(0.95rem,1vw,1.15rem)] uppercase tracking-[1px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          {title}
                        </span>
                        {note ? (
                          <span className="text-[clamp(0.82rem,0.9vw,1rem)] uppercase tracking-[1px] text-[#a6a6a1] [font-family:Jaldi,'JetBrains_Mono',monospace]">
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
                      className="ml-4 h-7 w-7 shrink-0 opacity-70"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-10 border-t border-[#e8e3db] pt-8">
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
                form="checkout-form"
                disabled={isSubmitting || cartLoading || Boolean(cartError) || !isAddressConfirmed}
                className="inline-flex h-20 w-full items-center justify-center bg-[#111] px-8 text-[clamp(1rem,1.2vw,1.35rem)] uppercase tracking-[4px] text-white transition-opacity [font-family:Jaldi,'JetBrains_Mono',monospace] disabled:opacity-60"
              >
                подтвердить заказ
              </button>
              <p className="mt-8 text-center text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[3px] text-[#8c8c86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                нажимая кнопку, вы соглашаетесь с условиями оферты
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
