import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export function CodeEntryPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section className="px-4 py-8 md:px-10 md:py-20">
          <div className="mx-auto max-w-[1120px] border border-[#e8e3db] bg-white 2xl:max-w-[1480px]">
          <div className="grid md:grid-cols-[140px_1fr]">
            <div className="bg-[#111]">
              <img
                src="/code-entry/code-photo.png"
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

            <div className="px-5 py-7 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:px-18 lg:py-16">
              <p className="text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <a href="/" className="hover:text-[#111]">Главная</a>
                <span className="mx-2 text-[#b5b2ab]">/</span>
                <span>Ввод кода</span>
              </p>
              <h1 className="mt-4 text-[clamp(2rem,8.5vw,5.5rem)] leading-none [font-family:'Cormorant_Garamond',serif] md:mt-6">Введите код</h1>
              <p className="mt-5 max-w-[630px] text-[clamp(0.95rem,1.4vw,1.35rem)] leading-[1.5] text-[#7d7d78] md:mt-8 md:leading-[1.55]">
                Мы отправили 6-значный код на вашу почту. Пожалуйста, проверьте папку «Входящие» и «Спам».
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3 md:mt-16 md:grid-cols-6 md:gap-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <label key={index} className="block">
                    <span className="sr-only">Цифра {index + 1}</span>
                    <input
                      inputMode="numeric"
                      maxLength={1}
                      placeholder="0"
                      className="h-16 w-full border-b border-[#e8e3db] bg-transparent text-center text-[clamp(1.5rem,3.5vw,2.75rem)] text-[#d8d8d3] outline-none placeholder:text-[#e0e0db] md:h-20 [font-family:'Cormorant_Garamond',serif]"
                    />
                  </label>
                ))}
              </div>

              <button className="mt-8 inline-flex h-12 w-full items-center justify-center bg-[#1f1f1f] px-8 text-[clamp(0.9rem,1.2vw,1.4rem)] uppercase tracking-[1.8px] text-white md:mt-16 md:h-20 md:tracking-[4px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                подтвердить
              </button>

              <div className="mt-7 text-center md:mt-12">
                <p className="text-[clamp(0.82rem,0.9vw,1.15rem)] uppercase tracking-[1.8px] text-[#8f8f89] md:tracking-[3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  отправить код повторно через 00:59
                </p>
                <button className="mt-3 text-[clamp(0.78rem,0.8vw,1rem)] uppercase tracking-[1.6px] text-[#d0d0cb] md:mt-4 md:tracking-[3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  отправить код
                </button>
              </div>
            </div>
          </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

export default CodeEntryPage;
