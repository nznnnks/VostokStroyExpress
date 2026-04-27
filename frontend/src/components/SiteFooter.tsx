import { footerColumns } from "../data/site";

export function SiteFooter() {
  const columnTitles = ["Карта сайта", "Клиенту", "Услуги"];
  return (
    <footer className="mt-16 border-t border-[#e8e3db] bg-[#f7f5f1] px-4 py-9 md:px-10 md:py-10 xl:px-12 xl:py-12 2xl:px-16 2xl:py-14">
      <div className="mx-auto grid max-w-[1480px] gap-8 xl:grid-cols-[1.1fr_1.2fr_1fr] xl:items-start xl:gap-10 2xl:max-w-[1860px] 2xl:gap-12">
        <div>
          <a href="/" className="hidden items-center transition duration-300 ease-out hover:opacity-80 xl:inline-flex">
            <img
              src="/logo.svg"
              alt="ВостокСтройЭксперт"
              loading="eager"
              decoding="async"
              width="520"
              height="178"
              className="h-14 w-auto object-contain xl:h-[92px] 2xl:h-[104px]"
            />
          </a>
          <p className="mt-6 hidden max-w-[360px] text-[14px] uppercase leading-9 tracking-[1.8px] text-[#7d7d78] xl:block md:text-[15px] md:leading-10 xl:max-w-[420px] xl:text-[16px] xl:leading-[2.9rem] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            архитектурная климатическая интеграция для нового поколения антропогенной среды.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 xl:hidden">
          {footerColumns.map((column, index) => (
            <div key={index} className="min-w-0">
              <h3 className="text-[16px] uppercase [font-family:'Cormorant_Garamond',serif] md:text-[18px]">
                {columnTitles[index] ?? "Раздел"}
              </h3>
              <div className="mt-4 space-y-3 text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] md:mt-5 md:space-y-4 md:text-[14px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                {column.map((link) => (
                  <a key={link.href + link.label} href={link.href} className="block leading-[1.45] whitespace-normal transition duration-300 ease-out hover:translate-x-1 hover:text-[#2f2f2a]">
                    {link.label}
                  </a>
                ))}
                {index === 1 ? (
                  <a href="/" className="mt-4 inline-flex items-center transition duration-300 ease-out hover:opacity-80">
                    <img
                      src="/logo.svg"
                      alt="ВостокСтройЭксперт"
                      loading="lazy"
                      decoding="async"
                      width="520"
                      height="178"
                      className="h-18 w-auto object-contain sm:h-20"
                    />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
          <div className="col-span-2 min-w-0 border-t border-[#ebe5dc] pt-6">
            <h3 className="text-[16px] uppercase [font-family:'Cormorant_Garamond',serif] md:text-[18px]">Юридическая информация</h3>
            <div className="mt-4 grid gap-3 text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] md:mt-5 md:grid-cols-2 md:gap-4 md:text-[14px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <a href="/about#privacy" className="block leading-[1.45] transition duration-300 ease-out hover:translate-x-1 hover:text-[#2f2f2a]">Соглашение о конфиденциальности</a>
              <a href="/about#terms" className="block leading-[1.45] transition duration-300 ease-out hover:translate-x-1 hover:text-[#2f2f2a]">Условия</a>
            </div>
          </div>
        </div>
        <div className="hidden xl:grid xl:grid-cols-3 xl:gap-8 xl:pt-[2px]">
          {footerColumns.map((column, index) => (
            <div key={index} className="min-w-0">
              <h3 className="text-[20px] uppercase [font-family:'Cormorant_Garamond',serif] 2xl:text-[22px]">
                {columnTitles[index] ?? "Раздел"}
              </h3>
              <div className="mt-6 space-y-6 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] 2xl:text-[17px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                {column.map((link) => (
                  <a key={link.href + link.label} href={link.href} className="block whitespace-normal transition duration-300 ease-out hover:translate-x-1 hover:text-[#2f2f2a]">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden xl:block">
          <h3 className="text-[20px] uppercase [font-family:'Cormorant_Garamond',serif] 2xl:text-[22px]">Юридическая информация</h3>
          <div className="mt-10 space-y-9 text-[16px] uppercase tracking-[1.5px] text-[#7a7a75] 2xl:text-[17px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/about#privacy" className="block leading-[1.45] transition duration-300 ease-out hover:translate-x-1 hover:text-[#2f2f2a]">Соглашение о конфиденциальности</a>
            <a href="/about#terms" className="block leading-[1.45] transition duration-300 ease-out hover:translate-x-1 hover:text-[#2f2f2a]">Условия</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
