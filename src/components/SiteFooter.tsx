import { footerColumns } from "../data/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#e8e3db] bg-[#f7f5f1] px-4 py-12 md:px-10">
      <div className="mx-auto grid max-w-[1480px] gap-10 md:grid-cols-[1.1fr_1.2fr_1fr]">
        <div>
          <p className="text-[26px] italic [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</p>
          <p className="mt-10 max-w-[360px] text-[15px] uppercase leading-10 tracking-[1.8px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            архитектурная климатическая интеграция для нового поколения антропогенной среды.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {footerColumns.map((column, index) => (
            <div key={index}>
              {index === 0 ? (
                <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Карта сайта</h3>
              ) : null}
              <div className={`${index === 0 ? "mt-6" : "pt-10 md:pt-[36px]"} space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]`}>
                {column.map((link) => (
                  <a key={link.href + link.label} href={link.href} className="block">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Юридическая информация</h3>
          <div className="mt-10 space-y-8 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/about#privacy">Соглашение о конфиденциальности</a>
            <a href="/about#terms">Условия</a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1480px] flex-col gap-4 border-t border-[#e8e3db] pt-6 text-[12px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace] md:flex-row md:items-center md:justify-between">
        <p>
          © 2026 <span className="[font-family:'Cormorant_Garamond',serif] italic text-[#5b5b56]">ВостокСтройЭксперт</span> climate technologies. Все права защищены.
        </p>
        <div className="flex items-center gap-6">
          <img src="/image/planet.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
          <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4 object-contain opacity-70" />
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
