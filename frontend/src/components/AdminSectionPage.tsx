import { useEffect, useMemo, useState } from "react";

import { adminNav } from "../data/admin";
import { ApiError } from "../lib/api-client";
import { getStoredAuthSession } from "../lib/auth";
import {
  fallbackAdminSectionData,
  loadAdminSectionData,
  type AdminCatalogView,
  type AdminClientView,
  type AdminNewsView,
  type AdminOrderView,
} from "../lib/backend-api";

type AdminSectionPageProps = {
  activeKey: string;
  title: string;
  subtitle?: string;
};

function AdminTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | JSX.Element>>;
}) {
  return (
    <div className="overflow-hidden border border-[#e8e3db] bg-white">
      <div className="grid border-b border-[#ece8e1] px-8 py-5 text-[12px] uppercase tracking-[3px] text-[#b1ada6] [font-family:Jaldi,'JetBrains_Mono',monospace]" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>
      <div className="divide-y divide-[#ece8e1]">
        {rows.map((row, index) => (
          <div key={`${index}-${String(row[0])}`} className="grid items-center gap-4 px-8 py-6 text-[16px] text-[#2b2a27]" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {row.map((cell, cellIndex) => (
              <div key={`${index}-${cellIndex}`} className="min-w-0">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ tone, label }: { tone: "green" | "gold" | "gray" | "amber"; label: string }) {
  const toneClasses: Record<typeof tone, string> = {
    green: "bg-[#e7f6ee] text-[#2a7b4a]",
    gold: "bg-[#f8f0db] text-[#8a6a2a]",
    gray: "bg-[#f0efec] text-[#7f7a73]",
    amber: "bg-[#f5e9e2] text-[#8a4d2c]",
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] ${toneClasses[tone]}`}>{label}</span>;
}

function SectionMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 border border-[#e8e3db] bg-white p-8">
      <h2 className="text-[28px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 max-w-[760px] text-[18px] leading-8 text-[#7a7a75]">{description}</p>
    </div>
  );
}

export function AdminSectionPage({ activeKey, title, subtitle }: AdminSectionPageProps) {
  const session = getStoredAuthSession();
  const adminName =
    [session?.admin?.firstName, session?.admin?.lastName].filter(Boolean).join(" ").trim() ||
    session?.admin?.email ||
    "Администратор";

  const [clients, setClients] = useState<AdminClientView[]>(fallbackAdminSectionData.clients);
  const [orders, setOrders] = useState<AdminOrderView[]>(fallbackAdminSectionData.orders);
  const [news, setNews] = useState<AdminNewsView[]>(fallbackAdminSectionData.news);
  const [catalog, setCatalog] = useState<AdminCatalogView[]>(fallbackAdminSectionData.catalog);
  const [loading, setLoading] = useState(activeKey === "clients" || activeKey === "orders" || activeKey === "news" || activeKey === "catalog");
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState("");
  const [secondaryFilter, setSecondaryFilter] = useState("all");

  useEffect(() => {
    if (!["clients", "orders", "news", "catalog"].includes(activeKey)) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    async function run() {
      try {
        const data = await loadAdminSectionData();

        if (!active) {
          return;
        }

        setClients(data.clients);
        setOrders(data.orders);
        setNews(data.news);
        setCatalog(data.catalog);
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить раздел админки."));
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
  }, [activeKey]);

  const filteredClients = useMemo(() => {
    return clients.filter((item) => {
      const haystack = `${item.name} ${item.segment} ${item.manager}`.toLowerCase();
      return !query || haystack.includes(query.toLowerCase());
    });
  }, [clients, query]);

  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      const haystack = `${item.id} ${item.client} ${item.items} ${item.status}`.toLowerCase();
      return !query || haystack.includes(query.toLowerCase());
    });
  }, [orders, query]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const haystack = `${item.title} ${item.category}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = secondaryFilter === "all" || item.status === secondaryFilter;
      return matchesQuery && matchesStatus;
    });
  }, [news, query, secondaryFilter]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const haystack = `${item.title} ${item.brand}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStock = secondaryFilter === "all" || item.stock === secondaryFilter;
      return matchesQuery && matchesStock;
    });
  }, [catalog, query, secondaryFilter]);

  const authRequired = error instanceof ApiError && error.status === 401;

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="grid min-h-screen xl:grid-cols-[360px_1fr] 2xl:grid-cols-[400px_1fr]">
        <aside className="hidden min-h-screen flex-col bg-[#211d1a] text-white xl:flex">
          <div className="border-b border-white/10 px-8 py-12">
            <p className="max-w-full text-[26px] italic uppercase leading-none tracking-[-0.04em] text-white 2xl:text-[30px] [font-family:'Cormorant_Garamond',serif]">
              Р’РћРЎРўРћРљРЎРўР РћР™Р­РљРЎРџР•Р Рў
            </p>
            <p className="mt-6 text-[14px] uppercase tracking-[4px] text-white/50 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              РїР°РЅРµР»СЊ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°
            </p>
          </div>

          <nav className="pt-6">
            {adminNav.map((item) => {
              const active = item.key === activeKey;
              return (
                <a key={item.key} href={item.href} className={`flex min-h-[68px] items-center gap-5 px-6 text-[18px] ${active ? "border-l-4 border-white bg-white/4" : "text-white/70"}`}>
                  <img src={item.icon} alt="" aria-hidden="true" width="22" height="22" loading="lazy" decoding="async" className="h-5 w-5 object-contain" />
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
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[#e8e3db] bg-white px-6 py-5 md:px-10">
            <div className="flex items-center justify-end gap-6">
              <img src="/Р°РґРјРёРЅРєР°/СѓРІРµРґРѕРјР»РµРЅРёРµ.svg" alt="" aria-hidden="true" width="18" height="18" loading="lazy" decoding="async" className="h-[18px] w-[18px] object-contain" />
              <div className="h-10 w-px bg-[#ece8e1]" />
              <span className="text-[18px]">{adminName}</span>
            </div>
          </header>

          <section className="px-6 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-[1280px]">
              <h1 className="text-[46px] leading-none md:text-[64px] [font-family:'Cormorant_Garamond',serif]">{title}</h1>
              {subtitle ? <p className="mt-4 text-[18px] text-[#7a7a75] md:text-[20px]">{subtitle}</p> : null}

              {["clients", "orders", "news", "catalog"].includes(activeKey) ? (
                <div className="mt-10 flex flex-col gap-4 rounded-[8px] border border-[#e8e3db] bg-white p-5 md:flex-row md:items-end">
                  <label className="flex-1 text-[14px] text-[#7a7a75]">
                    Поиск
                    <input value={query} onChange={(event) => setQuery(event.target.value)} className="admin-input mt-2 w-full" placeholder="Поиск по разделу" />
                  </label>
                  {activeKey === "news" ? (
                    <div className="flex gap-2">
                      {["all", "Опубликовано", "Черновик", "Архив"].map((item) => (
                        <button key={item} type="button" className={`admin-filter-pill ${secondaryFilter === item ? "admin-filter-pill--active" : ""}`} onClick={() => setSecondaryFilter(item)}>
                          {item === "all" ? "Все" : item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {activeKey === "catalog" ? (
                    <div className="flex gap-2">
                      {["all", "В наличии", "Под заказ"].map((item) => (
                        <button key={item} type="button" className={`admin-filter-pill ${secondaryFilter === item ? "admin-filter-pill--active" : ""}`} onClick={() => setSecondaryFilter(item)}>
                          {item === "all" ? "Все" : item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {loading ? <SectionMessage title="Загрузка" description="Получаю данные раздела из backend API." /> : null}
              {!loading && authRequired ? <SectionMessage title="Нужен вход" description="Для доступа к административным разделам выполните вход под администратором." /> : null}
              {!loading && error && !authRequired ? <SectionMessage title="Ошибка загрузки" description={error.message || "Не удалось получить данные раздела."} /> : null}

              {!loading && !error && activeKey === "clients" ? (
                <div className="mt-10">
                  <AdminTable
                    columns={["РљР»РёРµРЅС‚", "РЎРµРіРјРµРЅС‚", "РњРµРЅРµРґР¶РµСЂ", "Р—Р°РєР°Р·С‹", "РЎС‚Р°С‚СѓСЃ"]}
                    rows={filteredClients.map((item) => [
                      item.name,
                      item.segment,
                      item.manager,
                      item.orders,
                      <StatusBadge key={item.id} tone={item.status === "Активен" ? "green" : "gray"} label={item.status} />,
                    ])}
                  />
                </div>
              ) : null}

              {!loading && !error && activeKey === "orders" ? (
                <div className="mt-10">
                  <AdminTable
                    columns={["РќРѕРјРµСЂ", "РљР»РёРµРЅС‚", "РџРѕР·РёС†РёРё", "РЎСѓРјРјР°", "РЎС‚Р°С‚СѓСЃ", "Р”Р°С‚Р°"]}
                    rows={filteredOrders.map((item) => [
                      item.id,
                      item.client,
                      item.items,
                      item.amount,
                      <StatusBadge key={item.id} tone="gold" label={item.status} />,
                      item.date,
                    ])}
                  />
                </div>
              ) : null}

              {!loading && !error && activeKey === "news" ? (
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {filteredNews.map((item) => (
                    <article key={item.id} className="border border-[#e8e3db] bg-white p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[12px] uppercase tracking-[3px] text-[#b1ada6] [font-family:Jaldi,'JetBrains_Mono',monospace]">{item.category}</p>
                          <h3 className="mt-3 text-[22px] [font-family:'Cormorant_Garamond',serif]">{item.title}</h3>
                        </div>
                        <StatusBadge tone={item.status === "Опубликовано" ? "green" : item.status === "Черновик" ? "gray" : "amber"} label={item.status} />
                      </div>
                      <div className="mt-6 flex items-center justify-between text-[14px] text-[#7a7a75]">
                        <span>{item.date}</span>
                        <span className="admin-action-btn">backend</span>
                      </div>
                    </article>
                  ))}
                  {filteredNews.length === 0 ? <SectionMessage title="Пусто" description="Материалы по текущему фильтру не найдены." /> : null}
                </div>
              ) : null}

              {!loading && !error && activeKey === "catalog" ? (
                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCatalog.map((item) => (
                    <article key={item.id} className="border border-[#e8e3db] bg-white p-7">
                      <p className="text-[12px] uppercase tracking-[3px] text-[#b1ada6] [font-family:Jaldi,'JetBrains_Mono',monospace]">{item.brand}</p>
                      <h3 className="mt-3 text-[22px] [font-family:'Cormorant_Garamond',serif]">{item.title}</h3>
                      <p className="mt-4 text-[20px]">{item.price}</p>
                      <div className="mt-6 flex items-center justify-between text-[14px] text-[#7a7a75]">
                        <span>{item.stock}</span>
                        <span className="admin-action-btn">backend</span>
                      </div>
                    </article>
                  ))}
                  {filteredCatalog.length === 0 ? <SectionMessage title="Пусто" description="Товары по текущему фильтру не найдены." /> : null}
                </div>
              ) : null}

              {!["clients", "orders", "news", "catalog"].includes(activeKey) ? (
                <SectionMessage
                  title="Раздел не подключён"
                  description="Для этого раздела в текущем backend нет подходящего endpoint, либо он не входит в текущий этап интеграции. Экран оставлен без полной API-интеграции."
                />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminSectionPage;
