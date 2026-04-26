import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountSnapshot, updateAccountProfile, type AccountOrderView, type AccountProfileView } from "../lib/backend-api";
import { AccountInfoContent } from "./AccountInfoContent";
import { AccountLayout } from "./AccountLayout";

const MAX_ACCOUNT_NAME_LENGTH = 40;

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
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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
        setNameDraft(data.profile.firstName ?? data.profile.name);
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

  async function handleSaveName() {
    if (!profile) {
      return;
    }

    const nextName = nameDraft.trim();

    if (!nextName) {
      setNameError("Введите имя.");
      return;
    }

    if (nextName.length > MAX_ACCOUNT_NAME_LENGTH) {
      setNameError(`Максимальная длина имени — ${MAX_ACCOUNT_NAME_LENGTH} символов.`);
      return;
    }

    setNameSaving(true);
    setNameError(null);

    try {
      await updateAccountProfile({ clientProfile: { firstName: nextName } });
      const data = await loadAccountSnapshot();
      setProfile(data.profile);
      setOrders(data.orders);
      setEditingName(false);
    } catch (nextError) {
      setNameError(nextError instanceof Error ? nextError.message : "Не удалось обновить имя.");
    } finally {
      setNameSaving(false);
    }
  }

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

  const authRequired = error instanceof ApiError && error.status === 401;

  return (
    <AccountLayout active="profile">
      <h1 className="text-[clamp(2rem,7vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif]">
        <span className="md:hidden">Личный кабинет</span>
        <span className="hidden md:inline">Личные данные клиента</span>
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
              <div className="w-full max-w-[620px]">
                <div
                  className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                    editingName ? "grid-rows-[0fr] -translate-y-1 opacity-0 pointer-events-none" : "grid-rows-[1fr] translate-y-0 opacity-100"
                  }`}
                  aria-hidden={editingName}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-4">
                      <h2 className="break-words text-[clamp(1.8rem,7vw,3.5rem)] uppercase tracking-[1px] text-[#74746f] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {profile.name}
                      </h2>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ece8e1] bg-white transition-colors duration-200 hover:bg-[#f5f3ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
                        aria-label="Изменить имя"
                        onClick={() => {
                          setEditingName(true);
                          setNameError(null);
                          setNameDraft((profile.firstName ?? profile.name).slice(0, MAX_ACCOUNT_NAME_LENGTH));
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                          <path
                            fill="currentColor"
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-.92l9.06-9.06.92.92-9.06 9.06ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                    editingName ? "grid-rows-[1fr] translate-y-0 opacity-100 delay-150" : "grid-rows-[0fr] translate-y-1 opacity-0 pointer-events-none delay-0"
                  }`}
                  aria-hidden={!editingName}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      <input
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        maxLength={MAX_ACCOUNT_NAME_LENGTH}
                        className="h-12 min-w-[240px] flex-1 rounded-[8px] border border-[#ece8e1] bg-white px-4 text-[18px] uppercase tracking-[1px] text-[#74746f] [font-family:Jaldi,'JetBrains_Mono',monospace] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
                        placeholder="Введите имя"
                        disabled={nameSaving}
                      />
                      <button
                        type="button"
                        className="inline-flex h-12 min-w-[140px] items-center justify-center bg-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-white transition-colors duration-200 hover:bg-[#2a2a2a] disabled:opacity-60 [font-family:Jaldi,'JetBrains_Mono',monospace]"
                        onClick={handleSaveName}
                        disabled={nameSaving}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-12 min-w-[140px] items-center justify-center border border-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-[#111] transition-colors duration-200 hover:bg-[#111] hover:text-white disabled:opacity-60 [font-family:Jaldi,'JetBrains_Mono',monospace]"
                        onClick={() => {
                          setNameError(null);
                          setNameDraft(profile.firstName ?? profile.name);
                          setEditingName(false);
                        }}
                        disabled={nameSaving}
                      >
                        Отмена
                      </button>
                    </div>
                    {nameError ? <p className="mt-3 text-[14px] text-[#b91c1c]">{nameError}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 max-w-[620px] md:mt-14">
            <p className="text-[12px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace] md:text-[16px]">Email</p>
            <div className="mt-3 flex min-h-[52px] items-center rounded-[8px] bg-[#f3f1ed] px-4 text-[14px] tracking-[0.4px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace] md:min-h-[74px] md:px-7 md:text-[18px] md:uppercase md:tracking-[1px]">
              {profile.email}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 md:mt-12 md:grid-cols-1 md:gap-6 xl:grid-cols-3">
            {stats.map(([label, value, accent]) => (
              <article key={label} className="border border-[#ece8e1] bg-white p-4 md:p-10">
                <p className="whitespace-nowrap text-[11px] uppercase tracking-[0.6px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace] sm:text-[12px] md:text-[16px] md:tracking-[2px]">
                  {label}
                </p>
                <p className="mt-4 break-words tabular-nums text-[clamp(1.2rem,5.8vw,1.9rem)] leading-none md:mt-6 md:text-[clamp(2rem,8vw,3.6rem)] [font-family:DM_Sans,Manrope,sans-serif]">
                  {value}
                </p>
                <div className={`mt-5 h-px w-full md:mt-12 ${accent ? "bg-[#d3b46a]" : "bg-[#ece8e1]"}`} />
              </article>
            ))}
          </div>

          <div className="mt-12 md:hidden">
            <h2 className="text-[clamp(2rem,7vw,4.8rem)] leading-none [font-family:'Cormorant_Garamond',serif]">Заказы</h2>

            <section className="mt-8 overflow-hidden border border-[#ece8e1] bg-white md:mt-10">
              <div className="flex items-center justify-between border-b border-[#ece8e1] px-5 py-6 md:px-8 md:py-8">
                <h3 className="text-[18px] uppercase tracking-[1px] [font-family:'Cormorant_Garamond',serif]">Список заказов</h3>
                {orders.length > 3 ? (
                  <a
                    href="/account/orders"
                    className="hidden h-12 items-center justify-center border border-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-[#111] transition-colors duration-200 hover:bg-[#111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] md:inline-flex [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    Все заказы
                  </a>
                ) : null}
              </div>

              <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_1fr] border-b border-[#ece8e1] bg-[#faf9f6] px-8 py-6 text-[15px] uppercase tracking-[2px] text-[#8b8b86] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span>Заказ №</span>
                <span>Дата</span>
                <span>Статус</span>
                <span className="text-right">Итого</span>
              </div>

              {orders.slice(0, 3).map((order) => (
                <a
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="group grid gap-4 border-b border-[#ece8e1] px-5 py-6 transition-colors duration-200 hover:bg-[#fcfbf8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] md:grid-cols-[1.2fr_1fr_1.2fr_1fr] md:items-center md:px-8 md:py-8"
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
                  </div>
                  <div>
                    <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Итого</p>
                    <p className="text-[20px] tabular-nums md:text-right [font-family:DM_Sans,Manrope,sans-serif]">{order.total}</p>
                  </div>
                </a>
              ))}

              {orders.length === 0 ? (
                <div className="px-8 py-10 text-[18px] text-[#6f6f69]">У пользователя пока нет заказов.</div>
              ) : null}
            </section>

            {orders.length > 3 ? (
              <div className="mt-6 md:hidden">
                <a
                  href="/account/orders"
                  className="inline-flex h-12 w-full items-center justify-center border border-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-[#111] transition-colors duration-200 hover:bg-[#111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                >
                  Все заказы
                </a>
              </div>
            ) : null}

            <div className="mt-10 md:hidden">
              <AccountInfoContent variant="embedded" />
            </div>
          </div>
        </>
      ) : null}
    </AccountLayout>
  );
}

export default AccountPage;
