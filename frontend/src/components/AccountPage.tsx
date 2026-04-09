import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountSnapshot, type AccountOrderView, type AccountProfileView } from "../lib/backend-api";

const navItems = [
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/РґР°РЅРЅС‹РµРєР»РёРµРЅС‚Р°.png", "Р”Р°РЅРЅС‹Рµ РєР»РёРµРЅС‚Р°", "/account", true],
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/Р·Р°РєР°Р·С‹.svg", "Р—Р°РєР°Р·С‹", "/account/orders", false],
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/С‚СЂР°РЅР·Р°РєС†РёРё.png", "РЁР°Р±Р»РѕРЅС‹ Р·Р°РєР°Р·Р°", "/account/templates", false],
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/РїРѕРґРґРµСЂР¶РєР°.svg", "РџРѕРґРґРµСЂР¶РєР°", "/account#support", false],
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
      ["Р’СЃРµРіРѕ Р·Р°РєР°Р·РѕРІ", String(profile.totalOrders), false],
      ["РџРµСЂСЃРѕРЅР°Р»СЊРЅР°СЏ СЃРєРёРґРєР°", profile.personalDiscount, true],
      ["РћР±С‰РёР№ РІС‹РєСѓРї", profile.totalSpent, false],
    ] as const;
  }, [profile]);

  const visibleOrders = orders.slice(0, 5);
  const authRequired = error instanceof ApiError && error.status === 401;

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4">
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
          <div className="flex items-center gap-6 text-[14px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <img src="/image/Р»СѓРїР°.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <span>{profile?.name ?? "Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚"}</span>
          </div>
        </div>
      </header>

      <section className="min-h-[calc(100vh-92px)]">
        <div className="grid xl:grid-cols-[360px_1fr]">
          <aside className="border-r border-[#ece8e1] bg-[#fcfbf8] px-5 py-16 md:px-8">
            <div className="border border-[#ece8e1] bg-white p-8">
              <h2 className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚</h2>
              <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                РІРѕСЃС‚РѕРєСЃС‚СЂРѕР№СЌРєСЃРїРµСЂС‚ business
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

          <div className="px-4 py-12 md:px-10 xl:px-16 xl:py-20">
            <div className="mx-auto max-w-[1200px]">
              <h1 className="text-[52px] leading-none md:text-[80px] [font-family:'Cormorant_Garamond',serif]">
                Р›РёС‡РЅС‹Рµ РґР°РЅРЅС‹Рµ РєР»РёРµРЅС‚Р°
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
                  <div className="mt-14 flex flex-col gap-8 md:flex-row md:items-center">
                    <img
                      src="/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/РёРєРѕРЅРєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р±РѕР»СЊС€Р°СЏ.png"
                      alt="РџСЂРѕС„РёР»СЊ РєР»РёРµРЅС‚Р°"
                      width="170"
                      height="170"
                      loading="lazy"
                      decoding="async"
                      className="h-[170px] w-[170px] object-contain"
                    />
                    <div className="flex items-center gap-6">
                      <h2 className="text-[56px] uppercase tracking-[1px] text-[#74746f] [font-family:Jaldi,'JetBrains_Mono',monospace]">{profile.name}</h2>
                    </div>
                  </div>

                  <div className="mt-14 max-w-[620px]">
                    <p className="text-[16px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Email</p>
                    <div className="mt-3 flex min-h-[74px] items-center rounded-[8px] bg-[#f3f1ed] px-7 text-[22px] uppercase tracking-[1px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {profile.email}
                    </div>
                  </div>

                  <div className="mt-12 grid gap-6 xl:grid-cols-3">
                    {stats.map(([label, value, accent]) => (
                      <article key={label} className="border border-[#ece8e1] bg-white p-10">
                        <p className="text-[16px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</p>
                        <p className="mt-8 text-[58px] leading-none [font-family:'Cormorant_Garamond',serif]">{value}</p>
                        <div className={`mt-12 h-px w-full ${accent ? "bg-[#d3b46a]" : "bg-[#ece8e1]"}`} />
                      </article>
                    ))}
                  </div>

                  <div className="mt-16">
                    <h2 className="text-[52px] leading-none md:text-[78px] [font-family:'Cormorant_Garamond',serif]">РђРєС‚РёРІРЅС‹Рµ Р·Р°РєР°Р·С‹</h2>

                    <section className="mt-10 overflow-hidden border border-[#ece8e1] bg-white">
                      <div className="flex items-center justify-between border-b border-[#ece8e1] px-8 py-8">
                        <h3 className="text-[18px] uppercase tracking-[1px] [font-family:'Cormorant_Garamond',serif]">РЎРїРёСЃРѕРє Р·Р°РєР°Р·РѕРІ</h3>
                      </div>

                      <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_1fr] border-b border-[#ece8e1] bg-[#faf9f6] px-8 py-6 text-[15px] uppercase tracking-[2px] text-[#8b8b86] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        <span>Р—Р°РєР°Р· в„–</span>
                        <span>Р”Р°С‚Р°</span>
                        <span>РЎС‚Р°С‚СѓСЃ</span>
                        <span className="text-right">РС‚РѕРіРѕ</span>
                      </div>

                      {visibleOrders.map((order) => (
                        <div key={order.id} className="grid gap-4 border-b border-[#ece8e1] px-8 py-8 md:grid-cols-[1.2fr_1fr_1.2fr_1fr] md:items-center">
                          <div>
                            <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Р—Р°РєР°Р· в„–</p>
                            <a href={`/account/orders/${order.id}`} className="text-[22px] [font-family:'Cormorant_Garamond',serif] hover:underline">
                              {order.orderNumber}
                            </a>
                          </div>
                          <div>
                            <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Р”Р°С‚Р°</p>
                            <p className="text-[18px] text-[#8b8b86]">{order.date}</p>
                          </div>
                          <div>
                            <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">РЎС‚Р°С‚СѓСЃ</p>
                            <div className="flex items-center gap-4">
                              <span className="h-3 w-3" style={{ backgroundColor: order.statusColor }} />
                              <span className="text-[18px] [font-family:'Cormorant_Garamond',serif]">{order.status}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">РС‚РѕРіРѕ</p>
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
