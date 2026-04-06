import { accountOrders, customerProfile } from "../data/account";

type Props = {
  orderId: string;
};

export function AccountOrderDetailPage({ orderId }: Props) {
  const order = accountOrders.find((item) => item.id.toLowerCase() === orderId.toLowerCase()) ?? accountOrders[0];

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">главная</a><a href="/about">о нас</a><a href="/services">услуги</a><a href="/news">проекты</a><a href="/catalog">каталог</a><a href="/news">блог</a>
          </nav>
          <div className="flex items-center gap-6 text-[14px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <img src="/image/лупа.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <span>{customerProfile.name}</span>
          </div>
        </div>
      </header>
      <section className="px-4 py-12 md:px-10 xl:px-16 xl:py-20">
        <div className="mx-auto max-w-[1200px]">
          <a href="/account/orders" className="text-[14px] uppercase tracking-[1.6px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">← к списку заказов</a>
          <h1 className="mt-6 text-[52px] leading-none md:text-[80px] [font-family:'Cormorant_Garamond',serif]">Заказ {order.id}</h1>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="border border-[#ece8e1] bg-white p-10">
              <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Состав заказа</h2>
              <div className="mt-8 space-y-5">
                {order.items.map((item) => (
                  <div key={item.title} className="flex items-center justify-between border-b border-[#ece8e1] pb-5">
                    <div>
                      <p className="text-[24px] [font-family:'Cormorant_Garamond',serif]">{item.title}</p>
                      <p className="mt-1 text-[15px] uppercase tracking-[1.4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">Количество: {item.qty}</p>
                    </div>
                    <p className="text-[22px] [font-family:'Cormorant_Garamond',serif]">{item.price}</p>
                  </div>
                ))}
              </div>
            </section>
            <aside className="border border-[#ece8e1] bg-[#fcfbf8] p-10">
              <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">Детали</h2>
              <div className="mt-8 space-y-5 text-[17px]">
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
        </div>
      </section>
    </main>
  );
}

