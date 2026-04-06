export function RegisterPage() {
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

      <section className="border-b border-[#ece8e1]">
        <div className="grid xl:grid-cols-[1.12fr_1fr]">
          <div className="border-r border-[#ece8e1] bg-[#efefec]">
            <img
              src="/регистрация/регистрация фото.png"
              alt="Геометрическая композиция"
              width="1600"
              height="2100"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-full min-h-[560px] w-full object-cover"
            />
          </div>

          <div className="flex items-center px-6 py-14 md:px-12 xl:px-18 xl:py-20">
            <div className="mx-auto w-full max-w-[560px]">
              <h1 className="text-[52px] leading-none md:text-[84px] [font-family:'Cormorant_Garamond',serif]">Регистрация</h1>
              <div className="mt-6 h-px w-[74px] bg-[#d3b46a]" />

              <form className="mt-20">
                <label className="block">
                  <span className="text-[16px] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">Имя</span>
                  <input
                    type="text"
                    placeholder="Ваше полное имя"
                    className="mt-8 h-16 w-full border-b border-[#d9d4cc] bg-transparent text-[24px] text-[#c8c7c2] outline-none placeholder:text-[#c9c9c4]"
                  />
                </label>

                <label className="mt-14 block">
                  <span className="text-[16px] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Электронная почта
                  </span>
                  <input
                    type="email"
                    placeholder="example@aura.com"
                    className="mt-8 h-16 w-full border-b border-[#d9d4cc] bg-transparent text-[24px] text-[#c8c7c2] outline-none placeholder:text-[#c9c9c4]"
                  />
                </label>

                <button className="mt-20 inline-flex h-20 w-full items-center justify-center gap-8 bg-[#111] px-10 text-[20px] uppercase tracking-[3px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <span>зарегистрироваться</span>
                  <img
                    src="/вход/стрелочка.svg"
                    alt=""
                    aria-hidden="true"
                    width="18"
                    height="18"
                    loading="lazy"
                    decoding="async"
                    className="h-[18px] w-[18px] object-contain"
                  />
                </button>
              </form>

              <div className="mt-20 flex items-center gap-6 text-[14px] uppercase tracking-[2px] text-[#9a9993] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <span className="h-px flex-1 bg-[#e1ddd5]" />
                <span>Precise Control</span>
                <span className="h-px flex-1 bg-[#e1ddd5]" />
              </div>

              <p className="mt-8 text-center text-[18px] text-[#7d7d78]">
                Уже есть аккаунт?{" "}
                <a href="/login" className="border-b border-[#d3b46a] font-semibold text-[#111]">
                  Войти
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#f7f5f1] px-4 py-12 md:px-10">
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

export default RegisterPage;
