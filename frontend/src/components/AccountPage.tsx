import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountSnapshot, type AccountOrderView, type AccountProfileView } from "../lib/backend-api";
import SiteHeader from "./SiteHeader";

const navItems = [
  ["/account/client-data.png", "Данные клиента", "/account", true],
  ["/account/orders.svg", "Заказы", "/account/orders", false],
  ["/account/templates.png", "Шаблоны заказа", "/account/templates", false],
  ["/account/support.svg", "Поддержка", "/account/support", false],
];

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-12 border border-[#ece8e1] bg-white px-8 py-10">
      <h2 className="text-[30px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 max-w-[680px] text-[18px] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function AccountPage() {
  const [profile, setProfile] = useState<AccountProfileView | null>(null);
  const [orders, setOrders] = useState<AccountOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить кабинет."));
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

  const stats = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      ["Всего заказов", String(profile.totalOrders), false],
      ["Персональная скидка", profile.personalDiscount, true],
      ["Общий выкуп", profile.totalSpent, false],
    ] as const;
  }, [profile]);

  const visibleOrders = orders.slice(0, 5);
  const authRequired = error instanceof ApiError && error.status === 401;

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />

      <section className="min-h-[calc(100svh-92px)]">
        <div className="grid xl:grid-cols-[360px_1fr]">
          <aside className="order-2 border-t border-[#ece8e1] bg-[#fcfbf8] px-4 py-8 md:px-8 xl:order-1 xl:border-r xl:border-t-0 xl:py-16">
            <div className="border border-[#ece8e1] bg-white p-8">
              <h2 className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Личный кабинет</h2>
              <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                ВостокСтройЭксперт business
              </p>
            </div>

            <nav className="mt-10 space-y-2">
              {navItems.map(([icon, label, href, active]) => (
                <a
                  key={label as string}
                  href={href as string}
                  className={`flex min-h-[74px] items-center gap-4 px-6 text-[18px] ${
                    active ? "bg-[#f5f3ef]" : "bg-transparent"
                  }`}
                >
                  <img src={icon as string} alt="" aria-hidden="true" width="24" height="24" className="h-6 w-6 object-contain" />
                  <span className="[font-family:'Cormorant_Garamond',serif] text-[18px]">{label}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="order-1 px-4 py-8 md:px-10 md:py-12 xl:order-2 xl:px-16 xl:py-20">
            <div className="mx-auto max-w-[1200px] 2xl:max-w-[1480px]">
              <h1 className="text-[clamp(2rem,7vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif]">
                Личные данные клиента
              </h1>

              {loading ? <StateMessage title="Загрузка" description="Загружаю профиль пользователя и список заказов." /> : null}
              {!loading && authRequired ? (
                <StateMessage title="Нужен вход" description="Для просмотра личного кабинета войдите под пользовательской учетной записью." />
              ) : null}
              {!loading && error && !authRequired ? (
                <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось получить данные личного кабинета."} />
              ) : null}

              {!loading && !error && profile ? (
                <>
                  <div className="mt-10 flex flex-col gap-6 md:mt-14 md:gap-8 md:flex-row md:items-center">
                    <img
                      src="/account/user-avatar-large.png"
                      alt="Профиль клиента"
                      width="170"
                      height="170"
                      loading="lazy"
                      decoding="async"
                      className="h-[170px] w-[170px] object-contain"
                    />
                    <div className="flex items-center gap-6">
                      <h2 className="break-words text-[clamp(1.8rem,7vw,3.5rem)] uppercase tracking-[1px] text-[#74746f] [font-family:Jaldi,'JetBrains_Mono',monospace]">{profile.name}</h2>
                    </div>
                  </div>

                  <div className="mt-10 max-w-[620px] md:mt-14">
                    <p className="text-[16px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Email</p>
                    <div className="mt-3 flex min-h-[64px] items-center rounded-[8px] bg-[#f3f1ed] px-5 text-[clamp(1rem,3.4vw,1.35rem)] uppercase tracking-[1px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace] md:min-h-[74px] md:px-7">
                      {profile.email}
                    </div>
                  </div>

                  <div className="mt-10 grid gap-5 md:mt-12 md:gap-6 xl:grid-cols-3">
                    {stats.map(([label, value, accent]) => (
                      <article key={label} className="border border-[#ece8e1] bg-white p-6 md:p-10">
                        <p className="text-[16px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</p>
                        <p className="mt-6 break-words text-[clamp(2rem,8vw,3.6rem)] leading-none [font-family:'Cormorant_Garamond',serif]">{value}</p>
                        <div className={`mt-8 h-px w-full md:mt-12 ${accent ? "bg-[#d3b46a]" : "bg-[#ece8e1]"}`} />
                      </article>
                    ))}
                  </div>

                  <div className="mt-12 md:mt-16">
                    <h2 className="text-[clamp(2rem,7vw,4.8rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Активные заказы</h2>

                    <section className="mt-8 overflow-hidden border border-[#ece8e1] bg-white md:mt-10">
                      <div className="flex items-center justify-between border-b border-[#ece8e1] px-5 py-6 md:px-8 md:py-8">
                        <h3 className="text-[18px] uppercase tracking-[1px] [font-family:'Cormorant_Garamond',serif]">Список заказов</h3>
                      </div>

                      <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_1fr] border-b border-[#ece8e1] bg-[#faf9f6] px-8 py-6 text-[15px] uppercase tracking-[2px] text-[#8b8b86] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        <span>Заказ №</span>
                        <span>Дата</span>
                        <span>Статус</span>
                        <span className="text-right">Итого</span>
                      </div>

                      {visibleOrders.map((order) => (
                        <div key={order.id} className="grid gap-4 border-b border-[#ece8e1] px-5 py-6 md:grid-cols-[1.2fr_1fr_1.2fr_1fr] md:items-center md:px-8 md:py-8">
                          <div>
                            <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Заказ №</p>
                            <a href={`/account/orders/${order.id}`} className="text-[22px] [font-family:'Cormorant_Garamond',serif] hover:underline">
                              {order.orderNumber}
                            </a>
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
                          </div>
                          <div>
                            <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Итого</p>
                            <p className="text-[20px] md:text-right [font-family:'Cormorant_Garamond',serif]">{order.total}</p>
                          </div>
                        </div>
                      ))}

                      {visibleOrders.length === 0 ? (
                        <div className="px-8 py-10 text-[18px] text-[#6f6f69]">У пользователя пока нет заказов.</div>
                      ) : null}
                    </section>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AccountPage;
