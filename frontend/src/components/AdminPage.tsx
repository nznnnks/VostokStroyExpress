import { useEffect, useMemo, useState } from "react";
import { adminNav, adminUser } from "../data/admin";
import { getStoredAuthSession } from "../lib/auth";
import LogoutLink from "./LogoutLink";

type DashboardEvent = [string, string, string, string, string, string, string, string, "orders" | "requests" | "clients"];

const initialEvents: DashboardEvent[] = [
  ["#AE-9021", "Skyline Residences", 'ООО "Вертикаль"', "VRF Multi-Split", "Активно", "#2ebf63", "22.10.2024", "450,000 ₽", "orders"],
  ["#AE-9018", "Nordic Museum", "Архитектурное бюро A1", "Precision Chiller", "Ожидание", "#8a6a2a", "21.10.2024", "1,200,000 ₽", "orders"],
  ["#AE-8995", "Industrial Park Beta", "Технопром групп", "HVAC Central Unit", "Требует внимания", "#b24c47", "20.10.2024", "890,500 ₽", "requests"],
  ["#AE-8992", "Green Valley Office", "Инвестдевелопмент", "Smart Air Flow", "Завершено", "#d8d8d8", "19.10.2024", "210,000 ₽", "clients"],
];

const chartSeries = {
  orders: {
    week: [58, 62, 78, 32, 56, 82, 60],
    month: [34, 38, 41, 44, 47, 53, 49, 58, 62, 66, 72, 69],
  },
  requests: {
    week: [42, 28, 64, 51, 37, 48, 45],
    month: [22, 29, 31, 36, 33, 41, 39, 44, 48, 46, 50, 52],
  },
  revenue: {
    week: [36, 55, 48, 62, 70, 64, 76],
    month: [28, 30, 34, 42, 46, 44, 52, 58, 60, 63, 67, 71],
  },
} as const;

const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"] as const;
const monthLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
const eventFilters = [
  ["all", "Все события"],
  ["orders", "Заказы"],
  ["requests", "Заявки"],
  ["clients", "Клиенты"],
] as const;
const statusCycle: Array<Pick<DashboardEvent, 4 | 5>> = [
  ["Активно", "#2ebf63"],
  ["Ожидание", "#8a6a2a"],
  ["Требует внимания", "#b24c47"],
  ["Завершено", "#d8d8d8"],
];

type AdminPageProps = {
  activeKey?: string;
};

export function AdminPage({ activeKey = "dashboard" }: AdminPageProps) {
  const session = getStoredAuthSession();
  const adminName =
    [session?.admin?.firstName, session?.admin?.lastName].filter(Boolean).join(" ").trim() ||
    session?.admin?.email ||
    "Администратор";
  const [eventsData, setEventsData] = useState<DashboardEvent[]>(initialEvents);
  const [eventFilter, setEventFilter] = useState<(typeof eventFilters)[number][0]>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [chartType, setChartType] = useState<keyof typeof chartSeries>("orders");
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.type !== "admin") {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
    }
  }, [session]);

  const filteredEvents = useMemo(() => {
    return eventsData.filter((event) => eventFilter === "all" || event[8] === eventFilter);
  }, [eventFilter, eventsData]);

  const metrics = useMemo(() => {
    const totalRevenue = eventsData.reduce((sum, event) => sum + Number(event[7].replace(/[^\d]/g, "")), 0);
    const ordersCount = eventsData.filter((event) => event[8] === "orders").length;
    const requestsCount = eventsData.filter((event) => event[8] === "requests").length;

    return [
      ["Выручка (RUB)", `${totalRevenue.toLocaleString("ru-RU")} RUB`, "", "+14%", "/admin/revenue.svg"],
      ["Заказы", `+ ${ordersCount}`, "заказа", "+7%", "/admin/dashboard-blocks.svg"],
      ["Заявки", String(requestsCount), "заявки", "", "/admin/dashboard-blocks.svg"],
    ] as const;
  }, [eventsData]);

  const daySummary = useMemo(() => {
    const ordersCount = eventsData.filter((event) => event[8] === "orders").length;
    const requestsCount = eventsData.filter((event) => event[8] === "requests").length;
    const totalRevenue = eventsData.reduce((sum, event) => sum + Number(event[7].replace(/[^\d]/g, "")), 0);
    const profit = Math.round(totalRevenue * 0.2);

    return [
      ["Заявки", `${requestsCount} заявки`],
      ["Выручка", `${totalRevenue.toLocaleString("ru-RU")} RUB`],
      ["Прибыль", `${profit.toLocaleString("ru-RU")} RUB`],
      ["Заказы", `${ordersCount} заказа`],
    ] as const;
  }, [eventsData]);

  const chartValues = chartSeries[chartType][chartPeriod];
  const chartLabels = chartPeriod === "week" ? weekDays : monthLabels;

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  function rotateStatus(id: string) {
    setEventsData((prev) =>
      prev.map((event) => {
        if (event[0] !== id) return event;
        const index = statusCycle.findIndex(([status]) => status === event[4]);
        const next = statusCycle[(index + 1) % statusCycle.length];
        return [event[0], event[1], event[2], event[3], next[0], next[1], event[6], event[7], event[8]];
      }),
    );
    setToastMessage(`Статус ${id} обновлен`);
  }

  function addTestRequest() {
    const serial = 9100 + eventsData.length;
    const id = `#AE-${serial}`;
    const now = new Date();
    const date = now.toLocaleDateString("ru-RU");
    const amountValue = 180000 + Math.round(Math.random() * 420000);
    const amount = `${amountValue.toLocaleString("en-US")} ₽`;

    setEventsData((prev) => [[id, "Новая заявка", "С сайта", "Air Handling Unit", "Ожидание", "#8a6a2a", date, amount, "requests"], ...prev]);
    setEventFilter("all");
    setToastMessage("Тестовая заявка добавлена");
  }

  function exportFilteredCsv() {
    const header = ["ID", "Проект", "Клиент", "Тип системы", "Статус", "Дата", "Сумма", "Категория"];
    const rows = filteredEvents.map((event) => [event[0], event[1], event[2], event[3], event[4], event[6], event[7], event[8]]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMessage("CSV выгружен");
  }

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
      {navOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button type="button" aria-label="Закрыть меню" className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[85vw] max-w-[340px] bg-[#211d1a] text-white">
            <div className="border-b border-white/10 px-6 py-8">
              <div className="flex items-center justify-between">
                <p className="max-w-full text-[20px] italic uppercase leading-none tracking-[-0.04em] text-white [font-family:'Cormorant_Garamond',serif]">
                  ВОСТОКСТРОЙЭКСПЕРТ
                </p>
                <button type="button" aria-label="Закрыть меню" className="h-10 w-10 border border-white/20 text-white" onClick={() => setNavOpen(false)}>
                  ✕
                </button>
              </div>
              <p className="mt-5 text-[12px] uppercase tracking-[4px] text-white/50 [font-family:Jaldi,'JetBrains_Mono',monospace]">
                панель администратора
              </p>
            </div>
            <nav className="pt-4">
              {adminNav.map((item) => {
                const active = item.key === activeKey;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className={`flex min-h-[56px] items-center gap-4 px-5 text-[16px] ${active ? "border-l-4 border-white bg-white/4" : "text-white/70"}`}
                    onClick={() => setNavOpen(false)}
                  >
                    <img src={item.icon} alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain" />
                    <span className={active ? "text-white" : ""}>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[14px] font-semibold text-[#111]">
                        {item.badge}
                      </span>
                    ) : null}
                  </a>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-white/10 p-5">
              <LogoutLink className="flex w-full items-center justify-center rounded-md border border-white/20 px-4 py-3 text-[14px] uppercase tracking-[2px] text-white/90 [font-family:Jaldi,'JetBrains_Mono',monospace] hover:bg-white/5">
                Выйти
              </LogoutLink>
            </div>
          </aside>
        </div>
      ) : null}
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

          <div className="mt-auto border-t border-white/10 px-8 py-6">
            <LogoutLink className="flex w-full items-center justify-center rounded-md border border-white/20 px-4 py-3 text-[14px] uppercase tracking-[2px] text-white/90 [font-family:Jaldi,'JetBrains_Mono',monospace] hover:bg-white/5">
              Выйти
            </LogoutLink>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[#e8e3db] bg-white px-6 py-5 md:px-10">
            <div className="flex items-center justify-between gap-6">
              <button
                type="button"
                aria-label="Открыть меню админки"
                onClick={() => setNavOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center border border-[#e8e3db] xl:hidden"
              >
                <span className="relative h-[12px] w-[20px]">
                  <span className="absolute left-0 top-0 h-[2px] w-full bg-[#111]" />
                  <span className="absolute left-0 top-[5px] h-[2px] w-full bg-[#111]" />
                  <span className="absolute left-0 top-[10px] h-[2px] w-full bg-[#111]" />
                </span>
              </button>
              <div className="flex items-center justify-end gap-6">
              <img
                src="/admin/notification.svg"
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
            </div>
          </header>

          <section className="px-6 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-[1280px] 2xl:max-w-[1480px]">
              <h1 className="text-[42px] leading-none md:text-[58px] xl:text-[86px] [font-family:'Cormorant_Garamond',serif]">Обзор</h1>
              <p className="mt-5 text-[16px] text-[#7a7a75] md:text-[18px] xl:text-[22px]">Дашборд с информацией о показателях бизнеса</p>

              <div className="mt-10 inline-flex items-center gap-4 text-[20px] uppercase tracking-[4px] md:mt-14 md:text-[30px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span>сегодня</span>
                <img
                  src="/admin/today-arrow.png"
                  alt=""
                  aria-hidden="true"
                  width="18"
                  height="18"
                  loading="lazy"
                  decoding="async"
                  className="h-4 w-4 object-contain"
                />
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {metrics.map(([label, value, suffix, delta, icon], index) => (
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
                    <div className="mt-12 flex min-h-[96px] items-end justify-between gap-4">
                      <div className="flex min-w-0 max-w-[80%] flex-wrap items-end gap-x-3 gap-y-1">
                        <p
                          className={`${
                            index === 0 ? "text-[34px] md:text-[40px] 2xl:text-[44px]" : "text-[38px] md:text-[44px]"
                          } leading-[0.98] uppercase tracking-[1px] break-words [font-family:Jaldi,'JetBrains_Mono',monospace]`}
                        >
                          {value}
                        </p>
                        {suffix ? (
                          <span className="pb-2 text-[18px] text-[#9a9993] md:text-[20px]">{suffix}</span>
                        ) : null}
                      </div>
                      {delta ? (
                        <span className="shrink-0 rounded border border-[#d6efdf] bg-[#f3fbf6] px-2.5 py-1 text-[16px] text-[#2ebf63]">
                          {delta}
                        </span>
                      ) : null}
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

              <section className="mt-8 border border-[#e8e3db] bg-white p-8 md:p-10">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-[30px] [font-family:'Cormorant_Garamond',serif]">Быстрые действия</h2>
                    <p className="mt-2 text-[14px] uppercase tracking-[3px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      интерактивные операции дашборда
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={addTestRequest}
                      className="admin-action-btn inline-flex h-11 items-center justify-center bg-[#111] px-5 text-[14px] uppercase tracking-[2px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]"
                    >
                      добавить заявку
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEventFilter("all");
                        setToastMessage("Фильтр сброшен");
                      }}
                      className="admin-action-btn admin-action-btn--ghost inline-flex h-11 items-center justify-center px-5 text-[14px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                    >
                      сбросить фильтр
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMaintenanceMode((prev) => !prev);
                        setToastMessage(`Режим: ${maintenanceMode ? "рабочий" : "техобслуживание"}`);
                      }}
                      className={`admin-action-btn inline-flex h-11 items-center justify-center px-5 text-[14px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                        maintenanceMode ? "bg-[#b24c47] text-white" : "bg-[#1f2a1f] text-white"
                      }`}
                    >
                      {maintenanceMode ? "отключить maintenance" : "включить maintenance"}
                    </button>
                  </div>
                </div>
              </section>

              <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_420px]">
                <section className="border border-[#e8e3db] bg-white p-8 md:p-10">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Статистика</h2>
                      <p className="mt-3 text-[16px] uppercase tracking-[4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        показатели за период
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[13px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {(["orders", "requests", "revenue"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setChartType(type)}
                          className={`rounded border px-3 py-1.5 ${chartType === type ? "border-[#111] text-[#111]" : "border-[#d9d4cc] text-[#7a7a75]"}`}
                        >
                          {type === "orders" ? "заказы" : type === "requests" ? "заявки" : "выручка"}
                        </button>
                      ))}
                      {(["week", "month"] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setChartPeriod(period)}
                          className={`rounded border px-3 py-1.5 ${chartPeriod === period ? "border-[#111] text-[#111]" : "border-[#d9d4cc] text-[#7a7a75]"}`}
                        >
                          {period === "week" ? "неделя" : "месяц"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 grid h-[420px] items-end gap-8 border-b border-[#ece8e1] px-4 pb-10" style={{ gridTemplateColumns: `repeat(${chartValues.length}, minmax(0, 1fr))` }}>
                    {chartValues.map((value, index) => (
                      <div key={`${chartLabels[index]}-${index}`} className="relative flex h-full items-end justify-center">
                        <div className="absolute inset-x-0 top-[22%] border-t border-[#f0ede7]" />
                        <div className="absolute inset-x-0 top-[50%] border-t border-[#f0ede7]" />
                        <div className="absolute inset-x-0 top-[78%] border-t border-[#f0ede7]" />
                        <div className="w-px bg-[#2b2b29]" style={{ height: `${value}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid px-4 text-center text-[14px] uppercase tracking-[2px] text-[#b1b1ac] [font-family:Jaldi,'JetBrains_Mono',monospace]" style={{ gridTemplateColumns: `repeat(${chartLabels.length}, minmax(0, 1fr))` }}>
                    {chartLabels.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </section>

                <aside className="border border-[#e8e3db] bg-white p-8 md:p-10">
                  <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Понедельник</h2>
                  <p className="mt-3 text-[16px] uppercase tracking-[4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    показатели за период
                  </p>

                  <div className="mt-12 space-y-10">
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
                    <button
                      type="button"
                      onClick={exportFilteredCsv}
                      className="text-[16px] uppercase tracking-[4px] text-[#b1b1ac] transition-colors hover:text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                    >
                      экспорт .csv
                    </button>
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
                      <button
                        type="button"
                        onClick={() => rotateStatus(String(id))}
                        className="flex items-center gap-4 rounded px-2 py-1 text-left transition-colors hover:bg-[#f5f2ec]"
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color as string }} />
                        <span className="text-[18px]">{status}</span>
                      </button>
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

      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-[70] rounded border border-[#d9d4cc] bg-white px-4 py-3 text-[14px] uppercase tracking-[1.5px] text-[#111] shadow-[0_8px_24px_rgba(0,0,0,0.12)] [font-family:Jaldi,'JetBrains_Mono',monospace]">
          {toastMessage}
        </div>
      ) : null}

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
