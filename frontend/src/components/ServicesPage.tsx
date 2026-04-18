import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import type { ServiceView } from "../lib/backend-api";

export function ServicesPage({ services }: { services: ServiceView[] }) {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />
        <section className="px-4 py-10 md:px-10 md:py-14">
          <div className="mx-auto max-w-[1480px]">
          <p className="breadcrumb-nav uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/" className="hover:text-[#111]">Главная</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <a href="/services" className="hover:text-[#111]">Услуги</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <span>климатическая интеграция</span>
          </p>
          <h1 className="mt-8 max-w-[900px] text-[clamp(2.6rem,5.2vw,5.75rem)] leading-[0.92] [font-family:'Cormorant_Garamond',serif]">
            Услуги проектирования, интеграции и настройки климатических систем
          </h1>
          <p className="mt-8 max-w-[900px] text-[clamp(1.05rem,1.5vw,1.6rem)] leading-[1.6] text-[#5c5c57]">
            Отдельные посадочные страницы услуг пока заполняем рабочими материалами и затычками, но переход на каждую услугу уже ведёт на самостоятельный маршрут.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.slug} className="flex h-full flex-col border border-[#e8e3db] p-7">
                <img src={service.image} alt="" aria-hidden="true" width="500" height="500" className="mx-auto aspect-square w-[220px] object-contain" />
                <h2 className="mt-6 text-[clamp(1.6rem,2.4vw,2.4rem)] leading-[1.02] [font-family:'Cormorant_Garamond',serif]">{service.title}</h2>
                <p className="mt-4 text-[clamp(0.95rem,1.1vw,1.15rem)] leading-7 text-[#5f5f5a]">{service.shortText}</p>
                <ul className="mt-6 flex-1 space-y-3 text-[clamp(0.9rem,0.9vw,1rem)] leading-6 text-[#6a6a65]">
                  {service.bullets.slice(0, 3).map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
                <a
                  href={`/services/${service.slug}`}
                  className="mt-auto inline-flex h-12 items-center justify-center bg-[#111] px-8 text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[1.5px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]"
                >
                  Открыть страницу услуги
                </a>
              </article>
            ))}
          </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}

export default ServicesPage;
