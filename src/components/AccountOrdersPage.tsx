import { accountOrders, customerProfile } from "../data/account";

const navItems = [
  ["/личный кабинет/данныеклиента.png", "Данные клиента", "/account", false],
  ["/личный кабинет/заказы.svg", "Заказы", "/account/orders", true],
  ["/личный кабинет/транзакции.png", "Шаблоны заказа", "/account/templates", false],
  ["/личный кабинет/поддержка.svg", "Поддержка", "/account#support", false],
];

export function AccountOrdersPage() {
  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</a>
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
            <span>{customerProfile.name}</span>
          </div>
        </div>
      </header>
      <section className="grid xl:grid-cols-[360px_1fr]">
        <aside className="border-r border-[#ece8e1] bg-[#fcfbf8] px-5 py-16 md:px-8">
          <div className="border border-[#ece8e1] bg-white p-8">
            <h2 className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Личный кабинет</h2>
            <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">востокстройэксперт business</p>
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
        <div className="px-4 py-12 md:px-10 xl:px-16 xl:py-20">
          <div className="mx-auto max-w-[1200px]">
            <h1 className="text-[52px] leading-none md:text-[80px] [font-family:'Cormorant_Garamond',serif]">Заказы</h1>
            <div className="mt-10 overflow-hidden border border-[#ece8e1] bg-white">
              <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1fr] border-b border-[#ece8e1] bg-[#faf9f6] px-8 py-6 text-[15px] uppercase tracking-[2px] text-[#8b8b86] md:grid [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span>Заказ №</span>
                <span>Дата</span>
                <span>Статус</span>
                <span>Доставка</span>
                <span className="text-right">Итого</span>
              </div>
              {accountOrders.map((order) => (
                <div key={order.id} className="grid gap-4 border-b border-[#ece8e1] px-8 py-8 md:grid-cols-[1fr_1fr_1fr_1fr_1fr] md:items-center">
                  <a href={`/account/orders/${order.id.toLowerCase()}`} className="text-[22px] [font-family:'Cormorant_Garamond',serif] hover:underline">{order.id}</a>
                  <p className="text-[18px] text-[#8b8b86]">{order.date}</p>
                  <div className="flex items-center gap-4"><span className="h-3 w-3" style={{ backgroundColor: order.statusColor }} /><span className="text-[18px] [font-family:'Cormorant_Garamond',serif]">{order.status}</span></div>
                  <p className="text-[18px] text-[#8b8b86]">{order.delivery}</p>
                  <p className="text-[20px] md:text-right [font-family:'Cormorant_Garamond',serif]">{order.total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

