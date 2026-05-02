import { useEffect, useState } from "react";

import { ApiError } from "../lib/api-client";
import { createYooKassaPayment, loadAccountSnapshot, type AccountOrderView, type AccountProfileView } from "../lib/backend-api";
import { AccountLayout } from "./AccountLayout";

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 border border-[#ece8e1] bg-white px-8 py-10">
      <h2 className="text-[30px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 text-[18px] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function AccountOrdersPage() {
  const [profile, setProfile] = useState<AccountProfileView | null>(null);
  const [orders, setOrders] = useState<AccountOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const data = await loadAccountSnapshot();

        if (!active) {
          return;
        }

        setProfile(data.profile);
        setOrders(data.orders);
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить заказы."));
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

  const authRequired = error instanceof ApiError && error.status === 401;

  async function handleRetryPayment(event: React.MouseEvent<HTMLButtonElement>, orderId: string) {
    event.preventDefault();
    event.stopPropagation();

    try {
      setRetryingOrderId(orderId);
      const payment = await createYooKassaPayment({
        orderId,
        returnUrl: `${window.location.origin}/checkout?payment=return`,
      });

      if (!payment.confirmationUrl) {
        throw new Error("Не удалось получить ссылку на оплату.");
      }

      window.location.href = payment.confirmationUrl;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Не удалось создать повторную оплату."));
    } finally {
      setRetryingOrderId((current) => (current === orderId ? null : current));
    }
  }

  return (
    <AccountLayout active="orders">
      <a
        href="/account"
        className="text-[14px] uppercase tracking-[1.6px] text-[#8b8b86] hover:text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
      >
        к личному кабинету
      </a>
      <h1 className="mt-5 text-[clamp(2rem,7vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Заказы</h1>

      {loading ? <StateMessage title="Загрузка" description="Загружаю список заказов пользователя." /> : null}
      {!loading && authRequired ? <StateMessage title="Нужен вход" description="Для просмотра заказов войдите под пользовательской учетной записью." /> : null}
      {!loading && error && !authRequired ? <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось загрузить заказы."} /> : null}

      {!loading && !error ? (
        <div className="mt-8 overflow-hidden border border-[#ece8e1] bg-white md:mt-10">
          <div className="hidden grid-cols-[1fr_0.9fr_1.1fr_0.7fr_1fr_0.9fr] border-b border-[#ece8e1] bg-[#faf9f6] px-8 py-6 text-[15px] uppercase tracking-[2px] text-[#8b8b86] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <span>Заказ №</span>
            <span>Дата</span>
            <span>Статус</span>
            <span>Товаров</span>
            <span>Доставка</span>
            <span className="text-right">Итого</span>
          </div>
          {orders.map((order) => (
            <a
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="group grid gap-4 border-b border-[#ece8e1] px-5 py-6 transition-colors duration-200 hover:bg-[#fcfbf8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] md:grid-cols-[1fr_0.9fr_1.1fr_0.7fr_1fr_0.9fr] md:items-center md:px-8 md:py-8"
            >
              <div>
                <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Заказ №</p>
                <span className="text-[22px] [font-family:'Cormorant_Garamond',serif] group-hover:underline">{order.orderNumber}</span>
              </div>
              <div>
                <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Дата</p>
                <p className="text-[18px] text-[#8b8b86]">{order.date}</p>
              </div>
              <div>
                <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Статус</p>
                <div className="flex items-center gap-4">
                  <span className="h-3 w-3" style={{ backgroundColor: order.statusColor }} />
                  <span className="text-[18px] [font-family:'Cormorant_Garamond',serif]">{order.status}</span>
                </div>
                <p className="mt-2 text-[15px] text-[#8b8b86]">{order.payment}</p>
                {order.canRetryPayment ? (
                  <button
                    type="button"
                    onClick={(event) => handleRetryPayment(event, order.id)}
                    disabled={retryingOrderId === order.id}
                    className="mt-3 inline-flex h-10 items-center justify-center border border-[#111] px-4 text-[12px] uppercase tracking-[1.2px] text-[#111] transition-colors hover:bg-[#111] hover:text-white disabled:cursor-wait disabled:opacity-60 [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    {retryingOrderId === order.id ? "Переход к оплате..." : "Оплатить заказ"}
                  </button>
                ) : null}
              </div>
              <div>
                <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Товаров</p>
                <p className="text-[18px] text-[#8b8b86]">{order.items.reduce((sum, item) => sum + item.qty, 0)}</p>
              </div>
              <div>
                <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Доставка</p>
                <p className="text-[18px] text-[#8b8b86]">{order.delivery}</p>
              </div>
              <div>
                <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Итого</p>
                <p className="text-[20px] tabular-nums md:text-right [font-family:DM_Sans,Manrope,sans-serif]">{order.total}</p>
              </div>
            </a>
          ))}
          {orders.length === 0 ? <div className="px-8 py-10 text-[18px] text-[#6f6f69]">Заказов пока нет.</div> : null}
        </div>
      ) : null}
    </AccountLayout>
  );
}

export default AccountOrdersPage;
