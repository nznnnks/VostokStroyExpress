import { useEffect, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountOrder, type AccountOrderView } from "../lib/backend-api";
import SiteHeader from "./SiteHeader";

type Props = {
  orderId: string;
};

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
  const [profileName, setProfileName] = useState("Личный кабинет");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const data = await loadAccountOrder(orderId);

        if (!active) {
          return;
        }

        setOrder(data.order);
        setProfileName(data.profileName);
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

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />
      <section className="px-4 py-8 md:px-10 md:py-12 xl:px-16 xl:py-20">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1480px]">
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
                      <p className="text-[22px] [font-family:'Cormorant_Garamond',serif]">{item.price}</p>
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
                  <p className="mt-3 text-[42px] [font-family:'Cormorant_Garamond',serif]">{order.total}</p>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default AccountOrderDetailPage;
