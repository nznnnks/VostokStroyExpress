import { accountOrders, customerProfile } from "../data/account";

const navItems = [
  ["/личный кабинет/данныеклиента.png", "Данные клиента", "/account", true],
  ["/личный кабинет/заказы.svg", "Заказы", "/account/orders", false],
  ["/личный кабинет/транзакции.png", "Шаблоны заказа", "/account/templates", false],
  ["/личный кабинет/поддержка.svg", "Поддержка", "/account#support", false],
];

const stats = [
  ["Всего заказов", String(customerProfile.totalOrders), false],
  ["Персональная скидка", customerProfile.personalDiscount, true],
  ["Общий выкуп", customerProfile.totalSpent, false],
];

export function AccountPage() {
  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">
            ВостокСтройЭксперт
          </a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">главная</a>
            <a href="/about">о нас</a>
            <a href="/services">услуги</a>
            <a href="/news">проекты</a>
            <a href="/catalog">каталог</a>
            <a href="/news">блог</a>
          </nav>
          <div className="flex items-center gap-6 text-[14px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <img src="/image/лупа.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <span className="flex items-center gap-3">
              <img
                src="/личный кабинет/икокапользователя маленькая.png"
                alt=""
                aria-hidden="true"
                width="22"
                height="22"
                loading="lazy"
                decoding="async"
                className="h-[22px] w-[22px]"
              />
              алексей
            </span>
          </div>
        </div>
      </header>

      <section className="min-h-[calc(100vh-92px)]">
        <div className="grid xl:grid-cols-[360px_1fr]">
          <aside className="border-r border-[#ece8e1] bg-[#fcfbf8] px-5 py-16 md:px-8">
            <div className="border border-[#ece8e1] bg-white p-8">
              <h2 className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Личный кабинет</h2>
              <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                востокстройэксперт business
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
                  <img
                    src={icon as string}
                    alt=""
                    aria-hidden="true"
                    width="24"
                    height="24"
                    loading="lazy"
                    decoding="async"
                    className="h-6 w-6 object-contain"
                  />
                  <span className="[font-family:'Cormorant_Garamond',serif] text-[18px]">{label}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="px-4 py-12 md:px-10 xl:px-16 xl:py-20">
            <div className="mx-auto max-w-[1200px]">
              <h1 className="text-[52px] leading-none md:text-[80px] [font-family:'Cormorant_Garamond',serif]">
                Личные данные клиента
              </h1>

              <div className="mt-14 flex flex-col gap-8 md:flex-row md:items-center">
                <img
                  src="/личный кабинет/иконка пользователя большая.png"
                  alt="Профиль клиента"
                  width="170"
                  height="170"
                  loading="lazy"
                  decoding="async"
                  className="h-[170px] w-[170px] object-contain"
                />
                <div className="flex items-center gap-6">
                  <h2 className="text-[56px] uppercase tracking-[1px] text-[#74746f] [font-family:Jaldi,'JetBrains_Mono',monospace]">{customerProfile.name}</h2>
                  <img
                    src="/личный кабинет/карандаш .png"
                    alt=""
                    aria-hidden="true"
                    width="28"
                    height="28"
                    loading="lazy"
                    decoding="async"
                    className="h-7 w-7 object-contain"
                  />
                </div>
              </div>

              <div className="mt-14 max-w-[620px]">
                <p className="text-[16px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Email</p>
                <div className="mt-3 flex min-h-[74px] items-center rounded-[8px] bg-[#f3f1ed] px-7 text-[22px] uppercase tracking-[1px] text-[#b3b3ae] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  {customerProfile.email}
                </div>
              </div>

              <div className="mt-12 grid gap-6 xl:grid-cols-3">
                {stats.map(([label, value, accent]) => (
                  <article key={label as string} className="border border-[#ece8e1] bg-white p-10">
                    <p className="text-[16px] uppercase tracking-[2px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">{label}</p>
                    <p className="mt-8 text-[58px] leading-none [font-family:'Cormorant_Garamond',serif]">{value}</p>
                    <div className={`mt-12 h-px w-full ${accent ? "bg-[#d3b46a]" : "bg-[#ece8e1]"}`} />
                  </article>
                ))}
              </div>

              <div className="mt-16">
                <h2 className="text-[52px] leading-none md:text-[78px] [font-family:'Cormorant_Garamond',serif]">Активные заказы</h2>

                <section className="mt-10 overflow-hidden border border-[#ece8e1] bg-white">
                  <div className="flex items-center justify-between border-b border-[#ece8e1] px-8 py-8">
                    <h3 className="text-[18px] uppercase tracking-[1px] [font-family:'Cormorant_Garamond',serif]">Список заказов</h3>
                    <img
                      src="/личный кабинет/фильтр.svg"
                      alt=""
                      aria-hidden="true"
                      width="20"
                      height="20"
                      loading="lazy"
                      decoding="async"
                      className="h-5 w-5 object-contain opacity-70"
                    />
                  </div>

                  <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_1fr] border-b border-[#ece8e1] bg-[#faf9f6] px-8 py-6 text-[15px] uppercase tracking-[2px] text-[#8b8b86] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    <span>Заказ №</span>
                    <span>Дата</span>
                    <span>Статус</span>
                    <span className="text-right">Итого</span>
                  </div>

                  {accountOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid gap-4 border-b border-[#ece8e1] px-8 py-8 md:grid-cols-[1.2fr_1fr_1.2fr_1fr] md:items-center"
                    >
                      <div>
                        <p className="text-[14px] uppercase tracking-[2px] text-[#8b8b86] md:hidden [font-family:Jaldi,'JetBrains_Mono',monospace]">Заказ №</p>
                        <a href={`/account/orders/${order.id.toLowerCase()}`} className="text-[22px] [font-family:'Cormorant_Garamond',serif] hover:underline">
                          {order.id}
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
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AccountPage;
