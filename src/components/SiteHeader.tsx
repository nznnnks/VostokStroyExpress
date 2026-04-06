import { navLinks } from "../data/site";

type SiteHeaderProps = {
  light?: boolean;
};

export function SiteHeader({ light = true }: SiteHeaderProps) {
  return (
    <header className={`border-b px-4 py-4 md:px-10 ${light ? "border-[#ece8e1] bg-white" : "border-white/10 bg-transparent"}`}>
      <div className="mx-auto flex max-w-[1480px] items-center gap-4">
        <a href="/" className={`text-[28px] italic tracking-[-0.03em] [font-family:'Cormorant_Garamond',serif] ${light ? "text-[#050505]" : "text-white"}`}>
          ВостокСтройЭксперт
        </a>
        <nav className={`ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#6d6d67]" : "text-white/80"}`}>
          {navLinks.map((link) => (
            <a key={link.href + link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a href="/catalog" aria-label="Поиск по каталогу">
            <img src="/image/лупа.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
          </a>
          <a href="/cart" aria-label="Корзина">
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
          </a>
          <a
            href="/login"
            className={`inline-flex h-12 items-center justify-center px-7 text-[14px] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
              light ? "bg-[#050505] text-white" : "border border-white/20 bg-white/10 text-white"
            }`}
          >
            войти
          </a>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
