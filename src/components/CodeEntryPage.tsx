export function CodeEntryPage() {
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
          <div className="flex items-center gap-4">
            <img src="/image/лупа.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <a href="/login" className="inline-flex h-12 items-center justify-center bg-[#050505] px-7 text-[14px] uppercase tracking-[1.2px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
              войти
            </a>
          </div>
        </div>
      </header>

      <section className="px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1120px] border border-[#e8e3db] bg-white">
          <div className="grid md:grid-cols-[140px_1fr]">
            <div className="bg-[#111]">
              <img
                src="/ввод кода/фото маленькое.png"
                alt=""
                aria-hidden="true"
                width="280"
                height="1200"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>

            <div className="px-6 py-10 md:px-10 md:py-12 lg:px-18 lg:py-16">
              <h1 className="text-[58px] leading-none md:text-[88px] [font-family:'Cormorant_Garamond',serif]">Введите код</h1>
              <p className="mt-8 max-w-[630px] text-[20px] leading-[1.55] text-[#7d7d78] md:text-[22px]">
                Мы отправили 6-значный код на вашу почту. Пожалуйста, проверьте папку «Входящие» и «Спам».
              </p>

              <div className="mt-16 grid grid-cols-3 gap-4 md:grid-cols-6 md:gap-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <label key={index} className="block">
                    <span className="sr-only">Цифра {index + 1}</span>
                    <input
                      inputMode="numeric"
                      maxLength={1}
                      placeholder="0"
                      className="h-20 w-full border-b border-[#e8e3db] bg-transparent text-center text-[44px] text-[#d8d8d3] outline-none placeholder:text-[#e0e0db] [font-family:'Cormorant_Garamond',serif]"
                    />
                  </label>
                ))}
              </div>

              <button className="mt-16 inline-flex h-20 w-full items-center justify-center bg-[#1f1f1f] px-8 text-[22px] uppercase tracking-[4px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                подтвердить
              </button>

              <div className="mt-12 text-center">
                <p className="text-[18px] uppercase tracking-[3px] text-[#8f8f89] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  отправить код повторно через 00:59
                </p>
                <button className="mt-4 text-[16px] uppercase tracking-[3px] text-[#d0d0cb] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  отправить код
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e8e3db] bg-[#f7f5f1] px-4 py-12 md:px-10">
        <div className="mx-auto grid max-w-[1480px] gap-10 md:grid-cols-[1.1fr_1.2fr_1fr]">
          <div>
            <p className="text-[26px] italic [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</p>
            <p className="mt-10 max-w-[360px] text-[15px] uppercase leading-10 tracking-[1.8px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              архитектурная климатическая интеграция для нового поколения антропогенной среды.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Карта сайта</h3>
              <div className="mt-6 space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[36px]">
              <div className="space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[36px]">
              <div className="space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Юридическая информация</h3>
            <div className="mt-10 space-y-8 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <p>Соглашение о конфиденциальности</p>
              <p>Условия</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1480px] flex-col gap-4 border-t border-[#e8e3db] pt-6 text-[12px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace] md:flex-row md:items-center md:justify-between">
          <p>© 2026 <span className="[font-family:'Cormorant_Garamond',serif] italic text-[#5b5b56]">ВостокСтройЭксперт</span> climate technologies. Все права защищены.</p>
          <div className="flex items-center gap-6">
            <img src="/image/planet.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
            <img src="/корзина/поделится.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
          </div>
        </div>
      </footer>
    </main>
  );
}

export default CodeEntryPage;
