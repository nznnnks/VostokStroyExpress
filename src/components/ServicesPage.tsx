import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { services } from "../data/site";

export function ServicesPage() {
  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />
      <section className="px-4 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Услуги / климатическая интеграция</p>
          <h1 className="mt-8 max-w-[900px] text-[56px] leading-[0.92] md:text-[92px] [font-family:'Cormorant_Garamond',serif]">
            Услуги проектирования, интеграции и настройки климатических систем
          </h1>
          <p className="mt-8 max-w-[900px] text-[20px] leading-[1.6] text-[#5c5c57] md:text-[26px]">
            Отдельные посадочные страницы услуг пока заполняем рабочими материалами и затычками, но переход на каждую услугу уже ведёт на самостоятельный маршрут.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.slug} className="border border-[#e8e3db] p-7">
                <img src={service.image} alt="" aria-hidden="true" width="500" height="500" className="mx-auto aspect-square w-[220px] object-contain" />
                <h2 className="mt-6 text-[36px] leading-[1.02] [font-family:'Cormorant_Garamond',serif]">{service.title}</h2>
                <p className="mt-4 text-[17px] leading-7 text-[#5f5f5a]">{service.shortText}</p>
                <ul className="mt-6 space-y-3 text-[15px] leading-6 text-[#6a6a65]">
                  {service.bullets.slice(0, 3).map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
                <a
                  href={`/services/${service.slug}`}
                  className="mt-8 inline-flex h-12 items-center justify-center bg-[#111] px-8 text-[14px] uppercase tracking-[1.5px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]"
                >
                  Открыть страницу услуги
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

export default ServicesPage;
