import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { newsPosts as fallbackNewsPosts, services } from "../data/site";
import type { NewsPostView } from "../lib/backend-api";

type AboutPageProps = {
  newsPosts?: NewsPostView[];
};

function getFallbackNews() {
  return fallbackNewsPosts.map((post) => ({
    id: post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    image: post.image,
    category: post.category,
    content: [...post.content],
    dateLabel: "—",
    status: "Опубликовано",
  }));
}

export function AboutPage({ newsPosts = getFallbackNews() }: AboutPageProps) {
  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />
      <section className="px-4 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">О компании / ВостокСтройЭксперт</p>
          <h1 className="mt-8 max-w-[900px] text-[56px] leading-[0.92] md:text-[92px] [font-family:'Cormorant_Garamond',serif]">
            Тихая инженерия для жилых, коммерческих и частных объектов высокого класса
          </h1>
          <div className="mt-10 grid gap-10 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8 text-[19px] leading-[1.75] text-[#565651] md:text-[24px]">
              <p>
                ВостокСтройЭксперт проектирует и интегрирует климатические системы так, чтобы техника не спорила с архитектурой, не шумела и не усложняла эксплуатацию объекта.
              </p>
              <p>
                Мы работаем с частными резиденциями, коммерческими пространствами, бутиками и объектами с высокой инженерной плотностью. Основной фокус: точность, акустический комфорт, сервис и долговечность решений.
              </p>
              <p id="privacy">
                Мы также сопровождаем объект после запуска: проводим диагностику, тонкую настройку и сервисную поддержку, чтобы климатическая система работала как часть пространства, а не как отдельный технический слой.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <article className="border border-[#e8e3db] p-8">
                <p className="text-[14px] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">Опыт</p>
                <p className="mt-5 text-[64px] leading-none [font-family:'Cormorant_Garamond',serif]">25+</p>
                <p className="mt-3 text-[17px] leading-7 text-[#5f5f5a]">лет в интеграции инженерных решений и сопровождении объектов высокого класса.</p>
              </article>
              <article className="border border-[#e8e3db] p-8">
                <p className="text-[14px] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">Подход</p>
                <p className="mt-5 text-[40px] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">Комфорт без визуального и акустического давления</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[44px] md:text-[62px] [font-family:'Cormorant_Garamond',serif]">Наши направления</h2>
            <a href="/services" className="text-[14px] uppercase tracking-[1.5px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              Все услуги
            </a>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.slug} className="border border-[#e8e3db] p-6">
                <img src={service.image} alt="" aria-hidden="true" width="500" height="500" className="mx-auto aspect-square w-[220px] object-contain" />
                <h3 className="mt-5 text-[32px] [font-family:'Cormorant_Garamond',serif]">{service.title}</h3>
                <p className="mt-4 text-[16px] leading-7 text-[#5f5f5a]">{service.shortText}</p>
                <a href={`/services/${service.slug}`} className="mt-6 inline-flex text-[14px] uppercase tracking-[1.5px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  Подробнее
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="terms" className="px-4 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[44px] md:text-[62px] [font-family:'Cormorant_Garamond',serif]">Новости и контекст</h2>
            <a href="/news" className="text-[14px] uppercase tracking-[1.5px] text-[#6f6f69] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              Весь блог
            </a>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {newsPosts.slice(0, 2).map((post) => (
              <article key={post.slug} className="border border-[#e8e3db] p-6">
                <img src={post.image} alt="" aria-hidden="true" width="1200" height="760" className="aspect-[16/10] w-full object-cover" />
                <p className="mt-5 text-[14px] uppercase tracking-[1.5px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">{post.category}</p>
                <h3 className="mt-2 text-[34px] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">{post.title}</h3>
                <p className="mt-4 text-[17px] leading-7 text-[#5f5f5a]">{post.excerpt}</p>
                <a href={`/news/${post.slug}`} className="mt-6 inline-flex text-[14px] uppercase tracking-[1.5px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  Читать
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

export default AboutPage;
