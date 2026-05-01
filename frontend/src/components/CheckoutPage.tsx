import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "../data/products";
import { ApiError } from "../lib/api-client";
import { createOrder, createYooKassaPayment, getYooKassaPaymentStatus, type CartView } from "../lib/backend-api";
import { addProductToSessionCartBySlug, clearSessionCart, loadSessionCart, resolveSessionCartOrderItems } from "../lib/session-cart";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const YOOKASSA_PENDING_PAYMENT_KEY = "vostokstroyexpert-yookassa-pending-payment";

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

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  const trimmed = normalized.startsWith("7") ? normalized.slice(0, 11) : `7${normalized}`.slice(0, 11);
  const local = trimmed.slice(1);

  let result = "+7";
  if (local.length > 0) {
    result += ` (${local.slice(0, 3)}`;
  }
  if (local.length >= 4) {
    result += `) ${local.slice(3, 6)}`;
  }
  if (local.length >= 7) {
    result += `-${local.slice(6, 8)}`;
  }
  if (local.length >= 9) {
    result += `-${local.slice(8, 10)}`;
  }

  return result;
}

function normalizePhoneForSubmit(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.startsWith("8")) {
    return `+7${digits.slice(1, 11)}`;
  }

  if (digits.startsWith("7")) {
    return `+${digits.slice(0, 11)}`;
  }

  return `+7${digits.slice(0, 10)}`;
}

type PaymentBannerState =
  | { kind: "success"; message: string }
  | { kind: "pending"; message: string }
  | { kind: "error"; message: string }
  | null;

export function CheckoutPage() {
  const collapsedItemsLimit = 1;
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
  const [paymentBanner, setPaymentBanner] = useState<PaymentBannerState>(null);
  const [phone, setPhone] = useState("+7");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [entrance, setEntrance] = useState("");
  const [apartment, setApartment] = useState("");
  const [courierComment, setCourierComment] = useState("");
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("payment") !== "return") {
      return;
    }

    const rawPending = window.sessionStorage.getItem(YOOKASSA_PENDING_PAYMENT_KEY);
    if (!rawPending) {
      setPaymentBanner({
        kind: "pending",
        message: "Мы получили возврат с YooKassa, но не нашли локальные данные платежа. Проверьте статус заказа в личном кабинете или свяжитесь с нами.",
      });
      return;
    }

    let pendingPayment: { paymentId: string; orderId: string } | null = null;
    try {
      pendingPayment = JSON.parse(rawPending) as { paymentId: string; orderId: string };
    } catch {
      window.sessionStorage.removeItem(YOOKASSA_PENDING_PAYMENT_KEY);
      return;
    }

    if (!pendingPayment?.paymentId) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const status = await getYooKassaPaymentStatus(pendingPayment!.paymentId);
        if (!active) return;

        if (status.status === "succeeded" || status.paid) {
          clearSessionCart();
          setCart((prev) => (prev ? { ...prev, items: [], subtotal: 0, discountTotal: 0, total: 0 } : prev));
          window.sessionStorage.removeItem(YOOKASSA_PENDING_PAYMENT_KEY);
          setPaymentBanner({
            kind: "success",
            message: "Оплата прошла успешно. Заказ подтвержден.",
          });
          return;
        }

        if (status.status === "canceled") {
          setPaymentBanner({
            kind: "error",
            message: "Оплата была отменена. Вы можете попробовать еще раз.",
          });
          return;
        }

        setPaymentBanner({
          kind: "pending",
          message: "Платеж еще обрабатывается. Если статус не обновится автоматически, проверьте заказ чуть позже.",
        });
      } catch (error) {
        if (!active) return;

        setPaymentBanner({
          kind: "pending",
          message:
            error instanceof Error
              ? `Не удалось проверить статус оплаты автоматически: ${error.message}`
              : "Не удалось проверить статус оплаты автоматически.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const hydratedItems = useMemo(() => cart?.items ?? [], [cart]);
  const visibleItems = showAllItems ? hydratedItems : hydratedItems.slice(0, collapsedItemsLimit);
  const hiddenItemsCount = Math.max(hydratedItems.length - collapsedItemsLimit, 0);
  const subtotal = cart?.subtotal ?? 0;
  const total = cart?.total ?? subtotal;
  const isAddressConfirmed = addressVerification.confirmed;
  const summaryRows = [
    ["Стоимость товара", formatPrice(subtotal)],
    ["Доставка", subtotal > 0 ? "Рассчитывается после оплаты" : "0 ₽"],
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
  }, [hydratedItems.length, subtotal, total, selectedPayment, isQuickCheckout]);

  function handleAddressChange(value: string) {
    setAddressLine(value);
    setCity("");
    setPostalCode("");
    setEntrance("");
    setApartment("");
    setCourierComment("");
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
    const contactPhone = normalizePhoneForSubmit(String(formData.get("phone") ?? "").trim());
    const contactEmail = String(formData.get("email") ?? "").trim();
    const deliveryAddress = addressLine.trim() || addressVerification.formattedAddress;
    const deliveryCommentParts = [
      entrance.trim() ? `Подъезд: ${entrance.trim()}` : "",
      apartment.trim() ? `Квартира: ${apartment.trim()}` : "",
      courierComment.trim() ? `Комментарий курьеру: ${courierComment.trim()}` : "",
    ].filter(Boolean);

    if (isQuickCheckout && !contactEmail) {
      setSubmitError("Укажите email для быстрого оформления.");
      return;
    }

    if (!contactPhone || contactPhone.replace(/\D/g, "").length < 11) {
      setSubmitError("Укажите корректный номер телефона.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = await resolveSessionCartOrderItems(cart);

      if (itemsPayload.length === 0) {
        throw new ApiError("Товары не найдены в каталоге. Обновите страницу.", 400);
      }

      const order = await createOrder({
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        email: isQuickCheckout ? contactEmail || undefined : undefined,
        deliveryAddress: deliveryAddress || undefined,
        deliveryMethod: addressVerification.coords
          ? `Курьерская доставка (${addressVerification.coords})`
          : "Курьерская доставка",
        comment: deliveryCommentParts.join(" | ") || undefined,
        items: itemsPayload,
        payment: {
          method: selectedPayment === "card" ? "CARD" : "INVOICE",
        },
      });

      if (selectedPayment === "card") {
        const payment = await createYooKassaPayment({
          orderId: order.id,
          returnUrl: `${window.location.origin}/checkout?payment=return&order=${encodeURIComponent(order.id)}`,
        });

        if (!payment.confirmationUrl) {
          throw new ApiError("Не удалось получить ссылку на оплату YooKassa.", 500);
        }

        window.sessionStorage.setItem(
          YOOKASSA_PENDING_PAYMENT_KEY,
          JSON.stringify({
            paymentId: payment.paymentId,
            orderId: order.id,
          }),
        );

        window.location.href = payment.confirmationUrl;
        return;
      }

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

            {paymentBanner ? (
              <div
                className={`mt-8 border px-5 py-4 text-[13px] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                  paymentBanner.kind === "success"
                    ? "border-[#bfd8c7] bg-[#eff8f2] text-[#2f7a52]"
                    : paymentBanner.kind === "error"
                      ? "border-[#e7c3bc] bg-[#fff4f1] text-[#b24a3a]"
                      : "border-[#e6dcc8] bg-[#fffaf0] text-[#7a6a40]"
                }`}
              >
                {paymentBanner.message}
              </div>
            ) : null}

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
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
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
                    placeholder="Определится автоматически"
                    value={city}
                    readOnly
                    className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                  />
                </label>
                <label className="block">
                  <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Индекс</span>
                  <input
                    name="postal_code"
                    autoComplete="postal-code"
                    placeholder="Определится автоматически"
                    value={postalCode}
                    readOnly
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
              {isAddressConfirmed ? (
                <>
                  <div className="mt-8 grid gap-8 md:mt-10 md:gap-12 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Подъезд</span>
                      <input
                        name="entrance"
                        placeholder="Например, 3"
                        value={entrance}
                        onChange={(event) => setEntrance(event.target.value)}
                        className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Квартира</span>
                      <input
                        name="apartment"
                        placeholder="Например, 25"
                        value={apartment}
                        onChange={(event) => setApartment(event.target.value)}
                        className="mt-3 h-14 w-full border-b border-[#e8e3db] bg-transparent outline-none placeholder:text-[#b4b0a8]"
                      />
                    </label>
                  </div>
                  <label className="mt-8 block md:mt-10">
                    <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[1.4px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Комментарий курьеру</span>
                    <textarea
                      name="courier_comment"
                      rows={3}
                      placeholder="Например, код домофона, ориентир или удобное время"
                      value={courierComment}
                      onChange={(event) => setCourierComment(event.target.value)}
                      className="mt-3 w-full border-b border-[#e8e3db] bg-transparent pb-4 outline-none placeholder:text-[#b4b0a8] resize-none"
                    />
                  </label>
                </>
              ) : null}
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
                    {showAllItems ? "Свернуть список" : `Открыть еще ${hiddenItemsCount}`}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-10 border-t border-[#e8e3db] pt-8">
              <div className="space-y-6">
                {summaryRows.map(([label, value]) => (
                  label === "Доставка" ? (
                    <div key={label} className="space-y-4">
                      <div className="flex items-start justify-between gap-6">
                        <span className="text-[clamp(0.9rem,1vw,1.1rem)] uppercase tracking-[1.2px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          {label}
                        </span>
                        <span className="text-right text-[clamp(0.78rem,0.85vw,0.94rem)] uppercase tracking-[1.2px] leading-[1.2] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          {value}
                        </span>
                      </div>
                      <div className="mt-1 rounded-[32px] border border-[#eee4d4] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(252,248,242,0.95))] px-4 py-3 shadow-[0_18px_36px_rgba(17,17,17,0.055)]">
                        <div className="flex items-center gap-3 rounded-[26px] bg-[rgba(255,255,255,0.78)] px-2.5 py-2">
                          <span className="inline-flex h-11 min-w-0 flex-[1.65] items-center justify-center rounded-full border border-[#111] bg-[#111] px-6 shadow-[0_10px_20px_rgba(17,17,17,0.15)]">
                            <img
                              src="/checkout/yandex-delivery.svg"
                              alt="Яндекс Доставка"
                              className="h-[16px] w-auto max-w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          </span>
                          <span className="inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border border-[#eadfcd] bg-[#fbf6ee] px-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                            <img
                              src="/checkout/cdek.svg"
                              alt="CDEK"
                              className="h-[19px] w-auto max-w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={label} className="flex items-start justify-between gap-6">
                      <span className="text-[clamp(0.9rem,1vw,1.1rem)] uppercase tracking-[1.2px] text-[#7b7b75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {label}
                      </span>
                      <span className="text-[clamp(0.9rem,1vw,1.1rem)] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{value}</span>
                    </div>
                  )
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
