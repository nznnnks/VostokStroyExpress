import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountOrder, type AccountOrderView } from "../lib/backend-api";
import { AccountLayout } from "./AccountLayout";

type Props = {
  orderId: string;
};

const SUPPORT_EMAIL = "support@vostokstroyexpert.ru";

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 border border-[#ece8e1] bg-white px-8 py-10">
      <h2 className="text-[30px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 text-[18px] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function AccountOrderDetailPage({ orderId }: Props) {
  const [order, setOrder] = useState<AccountOrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFloatingBarVisible, setIsFloatingBarVisible] = useState(false);
  const [floatingBarHeight, setFloatingBarHeight] = useState(0);
  const bottomBarSentinelRef = useRef<HTMLDivElement | null>(null);
  const floatingBarRef = useRef<HTMLDivElement | null>(null);

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
    let active = true;

    async function run() {
      try {
        const data = await loadAccountOrder(orderId);

        if (!active) {
          return;
        }

        setOrder(data.order);
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить заказ."));
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
  }, [orderId]);

  const authRequired = error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (!isMobile) {
      setIsFloatingBarVisible(false);
      return;
    }

    if (!order) {
      return;
    }

    const sentinel = bottomBarSentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsFloatingBarVisible(!entry?.isIntersecting);
      },
      { root: null, threshold: 0.04 },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isMobile, order]);

  useEffect(() => {
    if (!isMobile) {
      setFloatingBarHeight(0);
      return;
    }

    const element = floatingBarRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const ro = new ResizeObserver(() => {
      setFloatingBarHeight(element.getBoundingClientRect().height);
    });

    ro.observe(element);
    setFloatingBarHeight(element.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, [isMobile, isFloatingBarVisible]);

  const contentPaddingBottom = useMemo(() => {
    if (!isMobile || !isFloatingBarVisible || floatingBarHeight <= 0) {
      return undefined;
    }

    return floatingBarHeight + 16;
  }, [floatingBarHeight, isFloatingBarVisible, isMobile]);

  const orderItemsCount = useMemo(() => {
    if (!order) {
      return 0;
    }

    return order.items.length;
  }, [order]);

  function OrderInfoPanel({ className }: { className?: string }) {
    if (!order) {
      return null;
    }

    return (
      <div className={className}>
        <div className="text-center">
          <p className="text-[20px] leading-none [font-family:'Cormorant_Garamond',serif]">
            Статус: <span className="text-[#111]">{order.status}</span>
          </p>
        </div>

        <div className="mt-4 h-px w-full bg-[#ece8e1]" />

        <div className="mt-4 grid gap-3 text-left">
          <div>
            <p className="text-[11px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Сумма</p>
            <p className="mt-1 text-[20px] tabular-nums [font-family:DM_Sans,Manrope,sans-serif]">{order.total}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Кол-во позиций</p>
            <p className="mt-1 text-[18px] tabular-nums [font-family:DM_Sans,Manrope,sans-serif]">{orderItemsCount}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Дата оформления</p>
            <p className="mt-1 text-[18px] tabular-nums [font-family:DM_Sans,Manrope,sans-serif]">{order.date}</p>
          </div>

          <div className="pt-2">
            <p className="text-[11px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Поддержка</p>
            <a
              className="mt-2 inline-flex h-10 w-full items-center justify-center bg-[#111] px-4 text-[12px] uppercase tracking-[1.2px] text-white transition-colors duration-200 hover:bg-[#2a2a2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Вопрос по заказу ${order.orderNumber}`)}`}
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout active="orders">
      <div style={{ paddingBottom: contentPaddingBottom }}>
      <a href="/account/orders" className="text-[14px] uppercase tracking-[1.6px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">к списку заказов</a>
      <h1 className="mt-5 text-[clamp(2rem,7vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Детали заказа</h1>

      {loading ? <StateMessage title="Загрузка" description="Загружаю детали выбранного заказа." /> : null}
      {!loading && authRequired ? <StateMessage title="Нужен вход" description="Для просмотра деталей заказа войдите под пользовательской учетной записью." /> : null}
      {!loading && error && !authRequired ? <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось загрузить заказ."} /> : null}

          {!loading && !error && order ? (
            <div className="mt-8 grid gap-5 md:mt-10 md:gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="border border-[#ece8e1] bg-white p-6 md:p-10">
                <h2 className="text-[clamp(1.9rem,4vw,2.2rem)] [font-family:'Cormorant_Garamond',serif]">Состав заказа</h2>
                <div className="mt-8 space-y-5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 border-b border-[#ece8e1] pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[22px] md:text-[24px] [font-family:'Cormorant_Garamond',serif]">{item.title}</p>
                        <p className="mt-1 text-[15px] uppercase tracking-[1.4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Количество: {item.qty}</p>
                      </div>
                      <p className="text-[22px] tabular-nums [font-family:DM_Sans,Manrope,sans-serif]">{item.price}</p>
                    </div>
                  ))}
                </div>
              </section>
              <aside className="border border-[#ece8e1] bg-[#fcfbf8] p-6 md:p-10">
                <h2 className="text-[clamp(1.9rem,4vw,2.2rem)] [font-family:'Cormorant_Garamond',serif]">Детали</h2>
                <div className="mt-8 space-y-5 text-[17px]">
                  <p><span className="text-[#8b8b86]">Номер:</span> {order.orderNumber}</p>
                  <p><span className="text-[#8b8b86]">Статус:</span> {order.status}</p>
                  <p><span className="text-[#8b8b86]">Дата:</span> {order.date}</p>
                  <p><span className="text-[#8b8b86]">Оплата:</span> {order.payment}</p>
                  <p><span className="text-[#8b8b86]">Доставка:</span> {order.delivery}</p>
                  <p><span className="text-[#8b8b86]">Адрес:</span> {order.address}</p>
                </div>
                <div className="mt-10 border-t border-[#ece8e1] pt-6">
                  <p className="text-[16px] uppercase tracking-[1.4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Итого</p>
                  <p className="mt-3 text-[42px] tabular-nums [font-family:DM_Sans,Manrope,sans-serif]">{order.total}</p>
                </div>
              </aside>
            </div>
          ) : null}

          {!loading && !error && order ? (
            <div ref={bottomBarSentinelRef} className="mt-10 md:hidden">
              <div className="border border-[#ece8e1] bg-[#fcfbf8] p-5">
                <OrderInfoPanel />
              </div>
            </div>
          ) : null}
      </div>

      {!loading && !error && order ? (
        <div
          ref={floatingBarRef}
          className={`fixed inset-x-0 bottom-0 z-[170] border-t border-[#ece8e1] bg-[rgba(255,255,255,0.92)] backdrop-blur-[14px] transition-[transform,opacity] duration-300 ease-out md:hidden ${
            isFloatingBarVisible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0 pointer-events-none"
          }`}
        >
          <div className="mx-auto max-w-[1480px] px-4 py-3">
            <OrderInfoPanel />
          </div>
          <div className="h-[calc(env(safe-area-inset-bottom,0px))]" />
        </div>
      ) : null}
    </AccountLayout>
  );
}

export default AccountOrderDetailPage;
