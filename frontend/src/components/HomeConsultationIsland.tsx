import { useEffect, useState } from "react";
import { formatPhone } from "../data/home";

export default function HomeConsultationIsland() {
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);

  useEffect(() => {
    if (!consultationModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConsultationModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [consultationModalOpen]);

  return (
    <>
      <div
        aria-hidden={!consultationModalOpen}
        className={`fixed inset-0 z-[280] flex items-center justify-center px-4 transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${consultationModalOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
      >
        <button type="button" aria-label="Закрыть сообщение" onClick={() => setConsultationModalOpen(false)} className="absolute inset-0 bg-[rgba(16,15,13,0.38)] backdrop-blur-[10px]" />
        <div role="dialog" aria-modal="true" aria-labelledby="consultation-success-title" className={`relative z-[1] w-full max-w-[560px] overflow-hidden rounded-[32px] border border-[#ddd1bf] bg-[linear-gradient(180deg,#fffdfa_0%,#f2ece4_100%)] px-7 py-8 text-center shadow-[0_36px_90px_rgba(0,0,0,0.2)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-10 md:py-10 ${consultationModalOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.96] opacity-0"}`}>
          <div className="pointer-events-none absolute inset-x-[16%] top-[-16%] h-44 rounded-full bg-[#d5ab5d]/18 blur-[75px]" />
          <div className="pointer-events-none absolute bottom-[-18%] right-[-8%] h-40 w-40 rounded-full bg-white/70 blur-[90px]" />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#dcc8aa] bg-white/78 shadow-[0_12px_26px_rgba(145,122,81,0.12)] md:h-20 md:w-20">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#8c6732] md:h-10 md:w-10" aria-hidden="true"><path d="M5 12.5 9.2 16.7 19 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p className="relative mt-6 text-[12px] uppercase tracking-[0.34em] text-[#8f887c] [font-family:'JetBrains_Mono',monospace]">заявка отправлена</p>
          <h3 id="consultation-success-title" className="relative mt-4 text-[clamp(32px,2.2vw,48px)] leading-[0.94] text-[#171511] [font-family:'Cormorant_Garamond',serif]">Спасибо за отзыв</h3>
          <p className="relative mt-4 text-[clamp(16px,0.8vw+13px,22px)] leading-[1.55] text-[#4d473f]">В ближайшее время свяжемся с вами и уточним детали заявки.</p>
          <button type="button" onClick={() => setConsultationModalOpen(false)} className="relative mt-8 inline-flex h-14 min-w-[220px] items-center justify-center rounded-[18px] bg-[#111] px-8 text-[13px] uppercase tracking-[0.28em] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#25211b] md:h-16 md:min-w-[240px]">закрыть</button>
        </div>
      </div>
      <section id="contact" className="bg-white px-3 pt-18 pb-8 sm:px-5 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 border-b border-[#e8e3db] pb-8 md:pb-16 xl:grid-cols-[minmax(460px,560px)_minmax(0,1fr)] xl:gap-20 2xl:max-w-[1860px]">
          <div className="grid gap-8 md:gap-10">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(132px,164px)] items-start gap-5 md:block">
              <h2 className="max-w-[6.2ch] text-[clamp(40px,3.6vw,96px)] leading-[0.92] [font-family:'Cormorant_Garamond',serif] md:max-w-[10ch] xl:max-w-[11ch]">Бесплатная консультация</h2>
              <div className="justify-self-end pt-3 text-right md:mt-8 md:justify-self-auto md:pt-0 md:text-left">
                <p className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Офис</p>
                <p className="mt-3 text-[clamp(15px,0.75vw+11px,22px)] leading-[1.45] text-[#111] md:leading-8">г. Москва, Калужская, 12</p>
              </div>
            </div>
            <div>
              <p className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Запросы</p>
              <address className="mt-3 not-italic text-[clamp(16px,0.9vw+12px,22px)] leading-[1.65] text-[#111] md:leading-8">concierge@aeris-climate.com<br />+7 999 200 40 00</address>
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!event.currentTarget.reportValidity()) return;
              event.currentTarget.reset();
              setConsultationModalOpen(true);
            }}
            className="grid max-w-[820px] gap-5 2xl:max-w-none 2xl:grid-cols-2 xl:gap-x-6"
          >
            <label className="grid gap-2">
              <span className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Имя</span>
              <input className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[clamp(18px,1.1vw+14px,30px)] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif] xl:h-[5.5rem] 2xl:h-24" type="text" name="name" required placeholder="Ваше имя" />
            </label>
            <label className="grid gap-2">
              <span className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Телефон</span>
              <input
                className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[clamp(18px,1.1vw+14px,30px)] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif] xl:h-[5.5rem] 2xl:h-24"
                type="tel"
                name="phone"
                inputMode="tel"
                required
                placeholder="+7 (777) 777-77-77"
                onInput={(event) => {
                  const input = event.currentTarget;
                  input.value = formatPhone(input.value);
                  input.setCustomValidity("");
                }}
                onBlur={(event) => {
                  const input = event.currentTarget;
                  if (!input.value) return;
                  const valid = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(input.value);
                  input.setCustomValidity(valid ? "" : "Введите телефон в формате +7 (777) 777-77-77");
                }}
              />
            </label>
            <label className="grid gap-2 2xl:col-span-2">
              <span className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">О проекте</span>
              <div className="relative">
                <select className="h-20 w-full appearance-none border border-[#e5e3df] bg-[#fbfaf8] px-6 pr-20 text-[clamp(16px,0.45vw+14px,22px)] text-[#181816] [font-family:'Liberation_Sans',Manrope,sans-serif] xl:h-[5.5rem] 2xl:h-24" defaultValue="" name="projectType" required>
                  <option value="" disabled>Жилой / Коммерческий / Другой</option>
                  <option value="residence">Жилой</option>
                  <option value="commercial">Коммерческий</option>
                  <option value="other">Другой</option>
                </select>
                <span className="pointer-events-none absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 border-b-2 border-r-2 border-[#111] rotate-45" />
              </div>
            </label>
            <button className="inline-flex h-20 items-center justify-center bg-[#1a1a1a] px-10 text-[clamp(14px,0.7vw+12px,20px)] uppercase tracking-[1.6px] text-white xl:h-[5.5rem] xl:px-12 2xl:h-24 2xl:px-14 [font-family:'JetBrains_Mono',monospace]" type="submit">оставить заявку</button>
            <span className="self-center text-[clamp(13px,0.55vw+11px,18px)] uppercase tracking-[1.4px] text-[#8a8a86] [font-family:'JetBrains_Mono',monospace]">отвечаем за 15 минут</span>
          </form>
        </div>
      </section>
    </>
  );
}
