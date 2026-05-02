import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import type { ServiceView } from "../lib/backend-api";

export function ServicesPage({ services }: { services: ServiceView[] }) {
  const serviceCards = [
    {
      slug: "restaurant",
      titleLines: ["Проект вентиляции", "в\u00A0Ресторане."],
      description:
        "Учитываем высокие теплопритоки кухни и зала, акустику, требования к запахам и санитарным нормам. Настраиваем систему так, чтобы гостям было комфортно, а персоналу — удобно работать.",
      image: "/image/restaurant.jpg",
    },
    {
      slug: "country-house",
      titleLines: ["Проект вентиляции", "в\u00A0загородном доме."],
      description:
        "Проектируем тихую и эффективную вентиляцию для круглогодичного проживания: приток, вытяжка, рекуперация и увлажнение по задаче. Закладываем трассы так, чтобы не ломать архитектуру и отделку.",
      image: "/image/house.jpg",
    },
    {
      slug: "apartment",
      titleLines: ["Проект вентиляции", "в\u00A0квартире."],
      description:
        "Интегрируем вентиляцию в интерьер без лишних коробов: прорабатываем шахты, трассы и размещение оборудования. Добиваемся стабильного воздухообмена при минимальном уровне шума.",
      image: "/image/apartments.jpg",
    },
    {
      slug: "warehouse",
      titleLines: ["Проект вентиляции", "в\u00A0складском комплексе."],
      description:
        "Считаем воздухообмен под логистику и зоны хранения, учитываем высоты, ворота и теплопотери. Помогаем подобрать оборудование и режимы, чтобы сократить эксплуатационные затраты.",
      image: "/image/complex.jpg",
    },
    {
      slug: "mall",
      titleLines: ["Проект вентиляции", "в\u00A0Торговом Центре."],
      description:
        "Проектируем распределение воздуха по зонам с разной проходимостью и тепловой нагрузкой. Продумываем баланс притока/вытяжки и интеграцию с системами кондиционирования и дымоудаления.",
      image: "/image/mall.jpg",
    },
    {
      slug: "business-center",
      titleLines: ["Проект вентиляции", "в\u00A0Бизнес Центре."],
      description:
        "Готовим проект под офисные планировки и меняющихся арендаторов…",
      image: "/image/center.jpg",
    },
  ] as const;

  const serviceBySlug = new Map(services.map((service) => [service.slug, service] as const));

  const resolvedCards = serviceCards.map((card) => {
    const resolved = serviceBySlug.get(card.slug);
    return {
      ...card,
      image: resolved?.image || card.image,
    };
  });

  return (
    <main className="flex min-h-screen overflow-x-hidden bg-[#e1ddd6] text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex min-h-0 w-full flex-col">
        <SiteHeader />

        <section className="flex min-h-0 flex-1 px-4 py-4 md:px-10 md:py-5 xl:px-12 2xl:px-16">
          <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-col justify-start">
            <p className="breadcrumb-nav shrink-0 uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <a href="/" className="hover:text-[#111]">
                Главная
              </a>
              <span className="mx-2 text-[#b5b2ab]">/</span>
              <a href="/services" className="hover:text-[#111]">
                Услуги
              </a>
            </p>

            <div className="mt-5 shrink-0">
              <h1 className="max-w-[980px] text-[clamp(2.3rem,4.7vw,5.25rem)] leading-[0.9] [font-family:'Cormorant_Garamond',serif]">
                Услуги проектирования, интеграции и настройки климатических систем
              </h1>
              <p className="mt-6 max-w-[980px] text-[clamp(15px,0.65vw+13px,19px)] leading-[1.55] text-[#3a3936]">
                Комплексные решения в области вентиляции и кондиционирования: экспертный монтаж в частном секторе (дома, пентхаусы) и на объектах бизнеса (рестораны, складские комплексы)
                <br />
                Инженерное совершенство для вашего интерьера. Мы создаем невидимые системы вентиляции, которые сохраняют чистоту линий дизайна и обеспечивают высочайший стандарт качества воздуха. Для тех, кто не готов идти на компромиссы в вопросах комфорта и здоровья
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:mt-10 xl:gap-6">
              {resolvedCards.map((service, index) => (
                <article
                  key={service.slug}
                  className="group relative flex min-h-[300px] cursor-pointer overflow-hidden rounded-[22px] bg-[#10100f] text-[#e1ddd6] shadow-[0_18px_44px_rgba(0,0,0,0.16)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 md:min-h-[420px]"
                >
                  <img
                    src={service.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.03]"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.34)_22%,rgba(0,0,0,0.58)_54%,rgba(0,0,0,0.9)_100%)] opacity-95 transition duration-700 group-hover:opacity-100" />
                  <div className="absolute inset-0 border border-white/10 transition duration-500 group-hover:border-[#b99863]/55" />
                  <div className="absolute right-5 top-5 h-9 w-9 border-r border-t border-[#e1ddd6]/20 opacity-0 transition duration-500 group-hover:opacity-100" />

                  <div className="relative z-[1] flex h-full w-full flex-col justify-end p-8 pt-10 md:p-10 lg:p-8 xl:p-10">
                    <div className="mb-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#e1ddd6]/20 text-[13px] tracking-[0.18em] text-[#b99863] [font-family:Jaldi,'JetBrains_Mono',monospace] md:h-14 md:w-14 lg:h-12 lg:w-12">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="mt-16 transition duration-500 md:mt-24 lg:mt-10">
                      <h2 className="max-w-[13ch] text-[clamp(1.7rem,7.3vw,2.7rem)] uppercase leading-[0.9] text-[#f4f1ea] [text-shadow:0_3px_20px_rgba(0,0,0,0.52),0_1px_4px_rgba(0,0,0,0.42)] [font-family:'Cormorant_Garamond',serif] sm:text-[clamp(1.95rem,8.1vw,3.25rem)] lg:max-w-[12.5ch] lg:text-[clamp(2rem,2.25vw,3.35rem)] xl:text-[clamp(2.2rem,2.35vw,3.55rem)] 2xl:max-w-[12.5ch] 2xl:text-[clamp(2.15rem,2vw,3.15rem)]">
                        <span className="block">{service.titleLines[0]}</span>
                        <span className="block">{service.titleLines[1]}</span>
                      </h2>

                      <p className="mt-4 max-w-[520px] text-[0.9rem] leading-[1.42] text-[#f0ece5]/92 [text-shadow:0_2px_14px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.32)] opacity-100 transition duration-500 sm:mt-5 sm:text-[0.96rem] lg:max-h-0 lg:translate-y-2 lg:overflow-hidden lg:opacity-0 lg:transition-[max-height,opacity,transform] lg:duration-700 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:group-hover:max-h-32 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 xl:text-[1.06rem]">
                        {service.description}
                      </p>

                      <span className="mt-7 inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#b99863] opacity-100 transition duration-500 [font-family:Jaldi,'JetBrains_Mono',monospace] lg:translate-y-2 lg:opacity-0 lg:transition-[opacity,transform] lg:duration-700 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                        Подробнее
                        <span aria-hidden="true" className="h-px w-10 bg-[#b99863]" />
                      </span>
                    </div>
                  </div>

                  <a
                    href={`/services/${service.slug}`}
                    aria-label={`${service.titleLines[0]} ${service.titleLines[1]}`}
                    className="absolute inset-0 z-[2] rounded-[22px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b99863] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10100f]"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}

export default ServicesPage;
