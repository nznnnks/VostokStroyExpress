import SiteHeader from "./SiteHeader";
import type { ServiceView } from "../lib/backend-api";

export function ServicesPage({ services }: { services: ServiceView[] }) {
  return (
    <main className="flex min-h-screen overflow-x-hidden bg-[#e1ddd6] text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-0 w-full flex-col">
        <SiteHeader />
        <section className="flex min-h-0 flex-1 px-4 py-4 md:px-10 md:py-5 xl:px-12 2xl:px-16">
          <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-col justify-start">
            <p className="breadcrumb-nav shrink-0 uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <a href="/" className="hover:text-[#111]">Главная</a>
              <span className="mx-2 text-[#b5b2ab]">/</span>
              <a href="/services" className="hover:text-[#111]">Услуги</a>
            </p>
            <div className="mt-5 grid shrink-0 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.58fr)] xl:items-end">
              <h1 className="max-w-[880px] text-[clamp(2.3rem,4.7vw,5.25rem)] leading-[0.9] [font-family:'Cormorant_Garamond',serif]">
                Услуги проектирования, интеграции и настройки климатических систем
              </h1>
            </div>
            <div className="mt-7 flex min-h-0 flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-5 lg:[max-height:min(760px,calc(100vh-360px))] xl:mt-8 xl:gap-6">
              {services.map((service, index) => (
                <a
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group relative flex min-h-[300px] overflow-hidden rounded-[22px] bg-[#10100f] text-[#e1ddd6] shadow-[0_18px_44px_rgba(0,0,0,0.16)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b99863] md:min-h-[420px] lg:h-full lg:min-h-0 lg:flex-1 lg:hover:flex-[1.55]"
                >
                  <video
                    muted
                    playsInline
                    loop
                    autoPlay
                    preload="metadata"
                    poster="/image/services-card-bg-2026.png"
                    className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.03]"
                  >
                    <source src="/video/about-trust.mp4" type="video/mp4" />
                  </video>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[42%] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.52)_44%,rgba(0,0,0,0.9)_100%)] opacity-90 transition duration-700 group-hover:opacity-95" />
                  <div className="absolute inset-0 border border-white/10 transition duration-500 group-hover:border-[#b99863]/55" />
                  <div className="absolute right-5 top-5 h-9 w-9 border-r border-t border-[#e1ddd6]/20 opacity-0 transition duration-500 group-hover:opacity-100" />

                  <div className="relative z-[1] flex h-full w-full flex-col justify-end p-8 pt-10 md:p-10 lg:p-8 xl:p-10">
                    <div className="mb-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#e1ddd6]/20 text-[13px] tracking-[0.18em] text-[#b99863] [font-family:Jaldi,'JetBrains_Mono',monospace] md:h-14 md:w-14 lg:h-12 lg:w-12">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-16 transition duration-500 md:mt-24 lg:mt-10">
                      <h2 className="max-w-[11ch] text-[clamp(1.7rem,7.3vw,2.7rem)] uppercase leading-[0.9] text-[#f4f1ea] [font-family:'Cormorant_Garamond',serif] sm:text-[clamp(1.95rem,8.1vw,3.25rem)] lg:max-w-[10.5ch] lg:text-[clamp(2rem,2.25vw,3.35rem)] xl:text-[clamp(2.2rem,2.35vw,3.55rem)] 2xl:max-w-[10.5ch] 2xl:text-[clamp(2.15rem,2vw,3.15rem)]">
                        {service.title}
                      </h2>
                      <p className="mt-4 max-w-[520px] text-[0.9rem] leading-[1.42] text-[#e1ddd6]/78 opacity-100 transition duration-500 sm:mt-5 sm:text-[0.96rem] lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:group-hover:max-h-32 lg:group-hover:opacity-100 xl:text-[1.06rem]">
                        {service.shortText}
                      </p>
                      <span className="mt-7 inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#b99863] opacity-100 transition duration-500 [font-family:Jaldi,'JetBrains_Mono',monospace] lg:opacity-0 lg:group-hover:opacity-100">
                        перейти на услугу
                        <span aria-hidden="true" className="h-px w-10 bg-[#b99863]" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ServicesPage;
