import type { ReactNode } from "react";

import SiteHeader from "./SiteHeader";
import LogoutLink from "./LogoutLink";

type AccountNavKey = "profile" | "orders" | "support";

type Props = {
  active?: AccountNavKey;
  title?: string;
  children: ReactNode;
};

const navItems: Array<{
  key: AccountNavKey;
  icon: string;
  label: string;
  href: string;
}> = [
  { key: "profile", icon: "/account/client-data.png", label: "Данные клиента", href: "/account" },
  { key: "orders", icon: "/account/orders.svg", label: "Заказы", href: "/account/orders" },
  { key: "support", icon: "/account/support.svg", label: "Информация", href: "/account/support" },
];

export function AccountLayout({ active, title, children }: Props) {
  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />

      <section className="min-h-[calc(100svh-92px)]">
        <div className="px-4 py-8 md:px-10 md:py-12 xl:px-16 xl:py-20">
          <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
            <div className="grid xl:grid-cols-[420px_1fr]">
              <div className="hidden border-r border-[#ece8e1] xl:block">
                <aside className="xl:sticky xl:top-[calc(var(--site-header-offset,76px)+6px)] xl:max-h-[calc(100vh-var(--site-header-offset,76px)-14px)] xl:overflow-y-auto xl:self-start xl:py-16 xl:pr-10">
                  <div className="hidden pb-8 xl:block">
                    <h2 className="text-[28px] [font-family:'Cormorant_Garamond',serif]">Личный кабинет</h2>
                    <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      CLIMATRADE
                    </p>
                  </div>

                  <nav className="space-y-2 xl:mt-4 xl:border-t xl:border-[#ece8e1] xl:pt-8">
                    {navItems.map((item) => {
                      const isActive = item.key === active;
                      return (
                        <a
                          key={item.key}
                          href={item.href}
                          className={`flex min-h-[74px] items-center gap-4 rounded-[14px] px-6 text-[18px] transition-colors duration-200 hover:bg-[#f5f3ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] ${
                            isActive ? "bg-[#f5f3ef]" : "bg-transparent"
                          }`}
                        >
                          <img src={item.icon} alt="" aria-hidden="true" width="24" height="24" className="h-6 w-6 object-contain" />
                          <span className="[font-family:'Cormorant_Garamond',serif] text-[20px]">{item.label}</span>
                        </a>
                      );
                    })}
                  </nav>

                  <div className="mt-10 border-t border-[#ece8e1] pt-6">
                    <LogoutLink
                      href="/login"
                      className="flex min-h-[74px] items-center gap-4 rounded-[14px] px-6 text-[18px] transition-colors duration-200 hover:bg-[#f5f3ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
                    >
                      <img src="/admin/logout.svg" alt="" aria-hidden="true" width="24" height="24" className="h-6 w-6 object-contain opacity-70" />
                      <span className="[font-family:'Cormorant_Garamond',serif] text-[20px]">Выход</span>
                    </LogoutLink>
                  </div>
                </aside>
              </div>

              <div className="xl:pl-12">
                {title ? (
                  <h1 className="text-[clamp(2rem,7vw,5rem)] leading-none [font-family:'Cormorant_Garamond',serif]">{title}</h1>
                ) : null}
                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AccountLayout;
