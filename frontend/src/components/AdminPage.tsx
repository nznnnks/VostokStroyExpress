import { useMemo, useState } from "react";
import { adminNav, adminUser } from "../data/admin";
import { getStoredAuthSession } from "../lib/auth";

const metrics = [
  ["Выручка (RUB)", "120 000 RUB", "", "+14%", "/админка/денюжки выручка.svg", "/админка/выручка полосочка.svg"],
  ["Заказы", "+ 2", "заказа", "+7%", "/админка/для блоков заказы и заявки в дашборд.svg", "/админка/для блоков заказы и заявки в дашборд.svg"],
  ["Заявки", "4", "заявки", "", "/админка/для блоков заказы и заявки в дашборд.svg", "/админка/для блоков заказы и заявки в дашборд.svg"],
];

const daySummary = [
  ["Заявки", "2 заявки"],
  ["Выручка", "120 000 RUB"],
  ["Прибыль", "24 000 RUB"],
];

const events = [
  ["#AE-9021", "Skyline Residences", 'ООО "Вертикаль"', "VRF Multi-Split", "Активно", "#2ebf63", "22.10.2024", "450,000 ₽", "orders"],
  ["#AE-9018", "Nordic Museum", "Архитектурное бюро A1", "Precision Chiller", "Ожидание", "#8a6a2a", "21.10.2024", "1,200,000 ₽", "orders"],
  ["#AE-8995", "Industrial Park Beta", "Технопром групп", "HVAC Central Unit", "Требует внимания", "#b24c47", "20.10.2024", "890,500 ₽", "requests"],
  ["#AE-8992", "Green Valley Office", "Инвестдевелопмент", "Smart Air Flow", "Завершено", "#d8d8d8", "19.10.2024", "210,000 ₽", "clients"],
];

const chartValues = [58, 62, 78, 32, 56, 82, 60];
const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
const eventFilters = [
  ["all", "Все события"],
  ["orders", "Заказы"],
  ["requests", "Заявки"],
  ["clients", "Клиенты"],
] as const;

type AdminPageProps = {
  activeKey?: string;
};

export function AdminPage({ activeKey = "dashboard" }: AdminPageProps) {
  const session = getStoredAuthSession();
  const adminName =
    [session?.admin?.firstName, session?.admin?.lastName].filter(Boolean).join(" ").trim() ||
    session?.admin?.email ||
    "Администратор";
  const [eventFilter, setEventFilter] = useState<(typeof eventFilters)[number][0]>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => eventFilter === "all" || event[8] === eventFilter);
  }, [eventFilter]);

  function renderEventFilters(compact = false) {
    return (
      <div className={compact ? "grid gap-3" : "flex flex-wrap items-center gap-3"}>
        {eventFilters.map(([value, label]) => {
          const active = eventFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setEventFilter(value);
                if (compact) {
                  setFiltersOpen(false);
                }
              }}
              className={`admin-filter-pill ${active ? "admin-filter-pill--active" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="grid min-h-screen xl:grid-cols-[360px_1fr] 2xl:grid-cols-[400px_1fr]">
        <aside className="hidden min-h-screen flex-col bg-[#211d1a] text-white xl:flex">
          <div className="border-b border-white/10 px-8 py-12">
            <p className="max-w-full text-[26px] italic uppercase leading-none tracking-[-0.04em] text-white 2xl:text-[30px] [font-family:'Cormorant_Garamond',serif]">
              ВОСТОКСТРОЙЭКСПЕРТ
            </p>
            <p className="mt-6 text-[14px] uppercase tracking-[4px] text-white/50 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              панель администратора
            </p>
          </div>

          <nav className="pt-6">
            {adminNav.map((item) => {
              const active = item.key === activeKey;
              return (
              <a
                key={item.key}
                href={item.href}
                className={`flex min-h-[68px] items-center gap-5 px-6 text-[18px] ${
                  active ? "border-l-4 border-white bg-white/4" : "text-white/70"
                }`}
              >
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  width="22"
                  height="22"
                  loading="lazy"
                  decoding="async"
                  className="h-5 w-5 object-contain"
                />
                <span className={active ? "text-white" : ""}>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-[16px] font-semibold text-[#111]">
                    {item.badge}
                  </span>
                ) : null}
              </a>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 px-8 py-8">
            <a href="/login" className="flex items-center gap-4 text-[18px] text-white/70">
              <img
                src="/админка/выход.svg"
                alt=""
                aria-hidden="true"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
                className="h-5 w-5 object-contain"
              />
              Выход
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[#e8e3db] bg-white px-6 py-5 md:px-10">
            <div className="flex items-center justify-end gap-6">
              <img
                src="/админка/уведомление.svg"
                alt=""
                aria-hidden="true"
                width="18"
                height="18"
                loading="lazy"
                decoding="async"
                className="h-[18px] w-[18px] object-contain"
              />
              <div className="h-10 w-px bg-[#ece8e1]" />
              <span className="text-[18px]">{adminName}</span>
              <img
                src={adminUser.avatar}
                alt="Профиль администратора"
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
                className="h-12 w-12 rounded-[4px] border border-[#ece8e1] object-cover"
              />
            </div>
          </header>

          <section className="px-6 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-[1280px]">
              <h1 className="text-[58px] leading-none md:text-[86px] [font-family:'Cormorant_Garamond',serif]">Обзор</h1>
              <p className="mt-5 text-[18px] text-[#7a7a75] md:text-[22px]">Дашборд с информацией о показателях бизнеса</p>

              <div className="mt-14 inline-flex items-center gap-4 text-[30px] uppercase tracking-[4px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span>сегодня</span>
                <img
                  src="/админка/сегодня стрелочка.png"
                  alt=""
                  aria-hidden="true"
                  width="18"
                  height="18"
                  loading="lazy"
                  decoding="async"
                  className="h-4 w-4 object-contain"
                />
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-3">
                {metrics.map(([label, value, suffix, delta, icon, bars], index) => (
                  <article key={label as string} style={{ animationDelay: `${index * 80}ms` }} className="admin-card-in border border-[#e8e3db] bg-white p-8 md:p-9">
                    <div className="flex items-start justify-between gap-6">
                      <p className="text-[14px] uppercase tracking-[4px] text-[#c2c2bf] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</p>
                      <img
                        src={icon as string}
                        alt=""
                        aria-hidden="true"
                        width="22"
                        height="22"
                        loading="lazy"
                        decoding="async"
                        className="h-[22px] w-[22px] object-contain opacity-50"
                      />
                    </div>
                    <div className="mt-12 flex min-h-[88px] items-end justify-between gap-4">
                      <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-1">
                        <p className={`${index === 0 ? "text-[34px] md:text-[42px] 2xl:text-[46px]" : "text-[40px] md:text-[48px]"} whitespace-nowrap uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}>{value}</p>
                        {suffix ? (
                          <span className="pb-2 text-[18px] text-[#9a9993] md:text-[20px]">{suffix}</span>
                        ) : null}
                      </div>
                      {delta ? <span className="shrink-0 pb-2 text-[18px] text-[#2ebf63]">{delta}</span> : null}
                    </div>
                    <div className="mt-10">
                      {index === 0 ? (
                        <div className="admin-revenue-line" aria-hidden="true">
                          <span />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <span className="h-[3px] flex-1 bg-[#111]" />
                          <span className="h-[3px] flex-1 bg-[#111]" />
                          <span className="h-[3px] flex-1 bg-[#111]" />
                          <span className="h-[3px] flex-1 bg-[#ece8e1]" />
                          <span className="h-[3px] flex-1 bg-[#ece8e1]" />
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_360px]">
                <section className="border border-[#e8e3db] bg-white p-8 md:p-10">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Статистика</h2>
                      <p className="mt-3 text-[16px] uppercase tracking-[4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        показатели за период
                      </p>
                    </div>
                    <div className="flex items-center gap-10 text-[16px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      <span className="flex items-center gap-3">
                        заказы
                        <img src="/админка/заказы стрелочка вниз.png" alt="" aria-hidden="true" width="12" height="12" className="h-3 w-3 object-contain" />
                      </span>
                      <span className="flex items-center gap-3">
                        неделя
                        <img src="/админка/неделя стрелочка вниз.png" alt="" aria-hidden="true" width="12" height="12" className="h-3 w-3 object-contain" />
                      </span>
                    </div>
                  </div>

                  <div className="mt-10 grid h-[420px] grid-cols-7 items-end gap-8 border-b border-[#ece8e1] px-4 pb-10">
                    {chartValues.map((value, index) => (
                      <div key={weekDays[index]} className="relative flex h-full items-end justify-center">
                        <div className="absolute inset-x-0 top-[22%] border-t border-[#f0ede7]" />
                        <div className="absolute inset-x-0 top-[50%] border-t border-[#f0ede7]" />
                        <div className="absolute inset-x-0 top-[78%] border-t border-[#f0ede7]" />
                        <div className="w-px bg-[#2b2b29]" style={{ height: `${value}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-7 px-4 text-center text-[14px] uppercase tracking-[2px] text-[#b1b1ac] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {weekDays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </section>

                <aside className="border border-[#e8e3db] bg-white p-8 md:p-10">
                  <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Понедельник</h2>
                  <p className="mt-3 text-[16px] uppercase tracking-[4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    показатели за период
                  </p>

                  <div className="mt-12 space-y-14">
                    {daySummary.map(([label, value]) => (
                      <div key={label as string} className="flex items-start justify-between gap-6">
                        <span className="pt-1 text-[18px] uppercase tracking-[3px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}:</span>
                        <span className="text-right text-[26px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{value}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>

              <section className="mt-24 border border-[#e8e3db] bg-white">
                <div className="flex flex-col gap-6 border-b border-[#ece8e1] px-8 py-8 md:px-12 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Последние события системы</h2>
                    <p className="mt-2 text-[15px] uppercase tracking-[3px] text-[#b1b1ac] xl:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {filteredEvents.length} события
                    </p>
                  </div>
                  <div className="hidden items-center gap-5 xl:flex">
                    {renderEventFilters(false)}
                    <span className="text-[16px] uppercase tracking-[4px] text-[#b1b1ac] [font-family:Jaldi,'JetBrains_Mono',monospace]">экспорт .csv</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="inline-flex h-12 items-center justify-center border border-[#e8e3db] px-6 text-[16px] uppercase tracking-[2px] transition-colors hover:border-[#111] xl:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    фильтры событий
                  </button>
                </div>

                <div className="hidden grid-cols-[1fr_1.5fr_1.2fr_1.2fr_1fr_1fr] border-b border-[#ece8e1] px-8 py-6 text-[14px] uppercase tracking-[3px] text-[#b1b1ac] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <span>ID события</span>
                  <span>Проект / клиент</span>
                  <span>Тип системы</span>
                  <span>Статус</span>
                  <span>Дата</span>
                  <span>Сумма</span>
                </div>

                <div key={eventFilter} className="admin-events-list">
                  {filteredEvents.map(([id, project, company, type, status, color, date, amount], index) => (
                  <div key={id as string} style={{ animationDelay: `${index * 70}ms` }} className="admin-event-row grid gap-4 border-b border-[#ece8e1] px-8 py-8 transition-colors hover:bg-[#fbfaf7] md:grid-cols-[1fr_1.5fr_1.2fr_1.2fr_1fr_1fr] md:items-center">
                    <div>
                      <p className="text-[13px] uppercase tracking-[3px] text-[#b1b1ac] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">ID события</p>
                      <p className="text-[22px] uppercase [font-family:Jaldi,'JetBrains_Mono',monospace]">{id}</p>
                    </div>
                    <div>
                      <p className="text-[13px] uppercase tracking-[3px] text-[#b1b1ac] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Проект / клиент</p>
                      <p className="text-[24px] font-medium">{project}</p>
                      <p className="mt-2 text-[14px] uppercase tracking-[2px] text-[#b1b1ac] [font-family:Jaldi,'JetBrains_Mono',monospace]">{company}</p>
                    </div>
                    <div>
                      <p className="text-[13px] uppercase tracking-[3px] text-[#b1b1ac] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Тип системы</p>
                      <p className="text-[20px]">{type}</p>
                    </div>
                    <div>
                      <p className="text-[13px] uppercase tracking-[3px] text-[#b1b1ac] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Статус</p>
                      <div className="flex items-center gap-4">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color as string }} />
                        <span className="text-[18px]">{status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] uppercase tracking-[3px] text-[#b1b1ac] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Дата</p>
                      <p className="text-[18px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{date}</p>
                    </div>
                    <div>
                      <p className="text-[13px] uppercase tracking-[3px] text-[#b1b1ac] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Сумма</p>
                      <p className="text-[22px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{amount}</p>
                    </div>
                  </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 xl:hidden ${filtersOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!filtersOpen}>
        <button
          type="button"
          aria-label="Закрыть фильтры"
          onClick={() => setFiltersOpen(false)}
          className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${filtersOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[min(86vw,420px)] bg-white px-6 py-7 shadow-2xl transition-transform duration-300 ease-out ${
            filtersOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#e8e3db] pb-5">
            <p className="text-[22px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Фильтр событий</p>
            <button type="button" onClick={() => setFiltersOpen(false)} className="text-[32px] leading-none" aria-label="Закрыть фильтры">
              ×
            </button>
          </div>
          <div className="mt-8">{renderEventFilters(true)}</div>
        </aside>
      </div>
    </main>
  );
}

export default AdminPage;
