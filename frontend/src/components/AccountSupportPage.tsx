import { useEffect, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountSnapshot, type AccountProfileView } from "../lib/backend-api";
import SiteHeader from "./SiteHeader";

const navItems = [
  ["/account/client-data.png", "Данные клиента", "/account", false],
  ["/account/orders.svg", "Заказы", "/account/orders", false],
  ["/account/templates.png", "Шаблоны заказа", "/account/templates", false],
  ["/account/support.svg", "Поддержка", "/account/support", true],
];

const supportChannels = [
  {
    title: "Персональный менеджер",
    label: "Ответ в рабочее время",
    value: "+7 999 200-40-00",
    href: "tel:+79992004000",
    action: "позвонить",
  },
  {
    title: "Почта поддержки",
    label: "Документы и сервисные запросы",
    value: "support@vostokstroyexpert.ru",
    href: "mailto:support@vostokstroyexpert.ru",
    action: "написать",
  },
  {
    title: "Telegram",
    label: "Оперативные уточнения по заказам",
    value: "@vostok_support",
    href: "https://t.me/vostok_support",
    action: "открыть",
  },
];

const supportTopics = [
  "Статус и состав заказа",
  "Изменение адреса или шаблона доставки",
  "Сервисное обслуживание и выезд инженера",
  "Документы, закрывающие акты и счета",
];

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 border border-[#ece8e1] bg-white px-8 py-10">
      <h2 className="text-[30px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 text-[18px] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function AccountSupportPage() {
  const [profile, setProfile] = useState<AccountProfileView | null>(null);
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
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить поддержку."));
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

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />

      <section className="grid xl:grid-cols-[360px_1fr]">
        <aside className="order-2 border-t border-[#ece8e1] bg-[#fcfbf8] px-4 py-8 md:px-8 xl:order-1 xl:border-r xl:border-t-0 xl:py-16">
          <div className="border border-[#ece8e1] bg-white p-8">
            <h2 className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Личный кабинет</h2>
            <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              ВостокСтройЭксперт business
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map(([icon, label, href, active]) => (
              <a key={label as string} href={href as string} className={`flex min-h-[74px] items-center gap-4 px-6 text-[18px] ${active ? "bg-[#f5f3ef]" : "bg-transparent"}`}>
                <img src={icon as string} alt="" aria-hidden="true" width="24" height="24" className="h-6 w-6 object-contain" />
                <span className="[font-family:'Cormorant_Garamond',serif] text-[18px]">{label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="order-1 px-4 py-8 md:px-10 md:py-12 xl:order-2 xl:px-16 xl:py-20">
          <div className="mx-auto max-w-[1240px] 2xl:max-w-[1480px]">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#e6e0d7] bg-[#faf8f4]">
                <img src="/account/support.svg" alt="" aria-hidden="true" width="32" height="32" className="h-8 w-8 object-contain opacity-70" />
              </div>
              <h1 className="text-[clamp(2rem,7vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Поддержка</h1>
            </div>

            {loading ? <StateMessage title="Загрузка" description="Загружаю данные пользователя." /> : null}
            {!loading && authRequired ? (
              <StateMessage title="Нужен вход" description="Для обращения в поддержку войдите под пользовательской учетной записью." />
            ) : null}
            {!loading && error && !authRequired ? (
              <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось загрузить поддержку."} />
            ) : null}

            {!loading && !error ? (
              <>
                <p className="mt-6 max-w-[780px] text-[clamp(1rem,1.8vw,1.2rem)] leading-[1.6] text-[#6f6f69]">
                  Поможем со статусом заказа, документами, изменением адреса доставки и сервисными вопросами. Выберите удобный канал, и мы быстро подключимся.
                </p>

                <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3">
                  {supportChannels.map((channel) => (
                    <article key={channel.title} className="border border-[#ece8e1] bg-white p-6 md:p-8">
                      <p className="text-[15px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">{channel.label}</p>
                      <h2 className="mt-5 text-[clamp(1.7rem,3.5vw,2.2rem)] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">{channel.title}</h2>
                      <p className="mt-6 break-all text-[clamp(1.2rem,3vw,1.7rem)] leading-[1.2] text-[#111] [font-family:'Cormorant_Garamond',serif]">{channel.value}</p>
                      <a
                        href={channel.href}
                        target={channel.href.startsWith("https://") ? "_blank" : undefined}
                        rel={channel.href.startsWith("https://") ? "noreferrer" : undefined}
                        className="mt-10 inline-flex h-12 items-center justify-center bg-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-white transition-colors duration-200 hover:bg-[#2a2a2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                      >
                        {channel.action}
                      </a>
                    </article>
                  ))}
                </div>

                <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-[1.1fr_0.9fr]">
                  <section className="border border-[#ece8e1] bg-[#fcfbf8] p-6 md:p-10">
                    <p className="text-[15px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Чаще всего помогаем с этим</p>
                    <ul className="mt-8 grid gap-4">
                      {supportTopics.map((topic) => (
                        <li key={topic} className="flex items-start gap-4 border-b border-[#ece8e1] pb-4 last:border-b-0 last:pb-0">
                          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#111]" />
                          <span className="text-[clamp(1.2rem,2.6vw,1.5rem)] leading-[1.3] [font-family:'Cormorant_Garamond',serif]">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <aside className="border border-[#ece8e1] bg-white p-6 md:p-10">
                    <p className="text-[15px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Регламент</p>
                    <div className="mt-8 space-y-5 text-[17px] text-[#6f6f69]">
                      <p><span className="text-[#8b8b86]">Часы работы:</span> пн-пт, 09:00-19:00</p>
                      <p><span className="text-[#8b8b86]">Срочные вопросы:</span> Telegram и телефон</p>
                      <p><span className="text-[#8b8b86]">Документы:</span> ответ в течение 1 рабочего дня</p>
                      <p><span className="text-[#8b8b86]">Сервисный выезд:</span> согласуем отдельным подтверждением</p>
                    </div>
                    <div className="mt-10 border-t border-[#ece8e1] pt-6">
                      <a
                        href="/account/orders"
                        className="inline-flex h-12 items-center justify-center border border-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-[#111] transition-colors duration-200 hover:bg-[#111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                      >
                        открыть заказы
                      </a>
                    </div>
                  </aside>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AccountSupportPage;
