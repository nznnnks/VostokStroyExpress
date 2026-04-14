import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (normalized.startsWith("7")) normalized = normalized.slice(1);
  const slice = normalized.slice(0, 10);
  let result = "+7";
  if (slice.length > 0) result += ` (${slice.slice(0, 3)}`;
  if (slice.length >= 3) result += ")";
  if (slice.length > 3) result += ` ${slice.slice(3, 6)}`;
  if (slice.length > 6) result += `-${slice.slice(6, 8)}`;
  if (slice.length > 8) result += `-${slice.slice(8, 10)}`;
  return result;
};

const stats = [
  ["100+", "реализованных проектов"],
  ["10+", "лет на рынке инженерных решений"],
  ["проверено", "на объектах высокого класса и в коммерческих пространствах"],
];

const trusted = [
  ["/image/trusted-1.png", "Artest", "88 Michelin"],
  ["/image/trusted-2.png", "White Rabbit", "88 Michelin"],
  ["/image/trusted-3.png", "Technikum", "рекомендовано Michelin"],
  ["/image/trusted-4.png", "Central House", "рекомендовано Michelin"],
  ["/image/trusted-5.png", "Regent", "рекомендовано Michelin"],
  ["/image/trusted-6.png", "Big Gourmet", "наградa Michelin Big Gourmand"],
  ["/image/trusted-7.png", "Co-Co Chalet", "в 10 лучших ресторанов краснодарского края"],
];

const services = [
  {
    image: "/image/services-1.png",
    title: "Тепловой контроль",
    text: "Настраиваем стабильную температуру и корректную работу систем в резиденциях, бутиках и инженерно сложных интерьерах.",
  },
  {
    image: "/image/services-2.png",
    title: "Очистка воздуха",
    text: "Подбираем фильтрацию, влажность и воздухообмен так, чтобы система работала незаметно и ощущалась как комфорт.",
  },
  {
    image: "/image/services-3.png",
    title: "Акустическая настройка",
    text: "Снижаем шум, убираем лишние вибрации и интегрируем оборудование без конфликта с архитектурой пространства.",
  },
];

const serviceHrefByTitle: Record<string, string> = {
  "Тепловой контроль": "/services/thermal-control",
  "Очистка воздуха": "/services/air-cleaning",
  "Акустическая настройка": "/services/acoustic-tuning",
};

const steps = [
  ["/image/steps-1.png", "Диагностика", "Изучаем объект, ограничения и режим эксплуатации, чтобы не перегружать проект лишними решениями."],
  ["/image/steps-2.png", "Моделирование", "Собираем инженерную схему, считаем нагрузки и согласовываем логику системы."],
  ["/image/steps-3.png", "Интеграция", "Встраиваем оборудование в архитектуру, интерьер и существующие инженерные сети."],
  ["/image/steps-4.png", "Запуск", "Проводим настройку, тестирование и передаём систему в эксплуатацию с понятным сопровождением."],
];

const blog = [
  {
    image: "/image/news-1.png",
    title: "Почему инженерия должна быть частью тихого интерьера",
    text: "Разбираем, как оборудование высокого класса интегрируется в пространство без визуального и акустического давления.",
    wide: true,
  },
  {
    image: "/image/news-2.png",
    title: "Сервис и контроль системы после запуска",
    text: "Что важно предусмотреть заранее, чтобы климатическая система не требовала постоянного внимания.",
  },
  {
    image: "/image/news-3.png",
    title: "Что нужно знать про VRF-решения",
    text: "Коротко о сценариях применения и тонкостях подбора для объектов разного масштаба.",
  },
  {
    image: "/image/news-4.png",
    title: "Надёжность как главный критерий премиальной инженерии",
    text: "Почему стабильная работа системы важнее перегруженного набора характеристик в спецификации.",
  },
];

const reviews = [
  [
    "/image/reviews-1.svg",
    "Команда спроектировала решение очень аккуратно: техника не спорит с интерьером, работает тихо и даёт ощущение полной собранности пространства.",
    "Анна Морозова",
    "дизайнер интерьеров",
  ],
  [
    "/image/reviews-2.svg",
    "Получили понятный процесс, хороший контроль на всех этапах и систему, которая реально ощущается как премиальный сервис, а не как набор оборудования.",
    "Илья Сергеев",
    "управляющий объектом",
  ],
];

export function StayseLandingTailwind() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#0f0f0e] [font-family:Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section id="hero" className="relative isolate min-h-[100svh] overflow-hidden bg-[#050505] text-white md:min-h-screen">
        <img
          src="/image/hero-menu.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width="1280"
          height="6179"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center] md:object-right"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,4,5,0.98)_0%,rgba(4,4,5,0.92)_24%,rgba(4,4,5,0.62)_46%,rgba(4,4,5,0.18)_72%)]" />
        <div className="mx-auto flex min-h-[100svh] max-w-[1480px] flex-col justify-between px-5 pb-4 pt-6 sm:px-5 md:min-h-screen md:px-10 md:pb-12 md:pt-24 2xl:max-w-[1680px]">
          <div className="max-w-[700px]">
            <h1 className="max-w-[760px] text-[clamp(34px,10vw,156px)] leading-[0.92] tracking-[-0.04em] [font-family:'Cormorant_Garamond',serif] md:leading-[0.9] md:tracking-[-0.05em]">
              Атмосферное
              <br />
              Совершенство
            </h1>
            <p className="mt-3 max-w-[720px] text-[clamp(14px,3.9vw,34px)] font-[300] leading-[1.42] text-[#f4f4f1] md:mt-6 md:leading-[1.55]">
              Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса.
              Когда тишина становится ощутимой.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[clamp(11px,0.5vw+10px,15px)] uppercase tracking-[1.1px] [font-family:'JetBrains_Mono',monospace] md:mt-8 md:gap-6 md:tracking-[1.2px]">
              <a href="/services" className="inline-flex h-10 min-w-[136px] items-center justify-center bg-[#1a1a1a] px-4 text-white md:h-11 md:min-w-[152px] md:px-5">
                услуги
              </a>
              <a href="/catalog" className="inline-flex h-10 min-w-[136px] items-center justify-center border border-white/25 bg-black/20 px-4 text-white/92 md:h-11 md:min-w-[152px] md:px-5">
                каталог
              </a>
            </div>
          </div>

          <ul className="mt-7 grid gap-3 border-t border-white/10 pt-4 text-[clamp(11px,0.45vw+9px,14px)] uppercase tracking-[0.9px] text-[#f4f4f1d6] sm:grid-cols-3 sm:gap-4 sm:tracking-[1.7px] [font-family:'JetBrains_Mono',monospace]">
            {stats.map(([value, label]) => (
              <li key={label} className="flex flex-col gap-1.5">
                <strong className="text-[clamp(16px,0.8vw+12px,24px)] font-normal leading-none tracking-[0.11em] text-white sm:tracking-[0.18em]">{value}</strong>
                <span className="max-w-[420px] leading-[1.45] sm:leading-5">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        </section>

      <section id="about" className="px-3 py-10 sm:px-5 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-[1480px] gap-8 pb-6 lg:grid-cols-[120px_380px_1fr] lg:items-start lg:gap-12 2xl:max-w-[1860px]">
          <div className="text-[clamp(56px,5.5vw,120px)] leading-[0.78] text-[#e5dfd8] [font-family:'Cormorant_Garamond',serif]">25</div>
          <div>
            <h2 className="text-[clamp(32px,3vw,72px)] leading-[0.92] [font-family:'Cormorant_Garamond',serif]">О компании</h2>
            <p className="mt-3 max-w-[300px] text-[clamp(13px,0.7vw+11px,18px)] italic leading-6 text-[#8b8b86] [font-family:'Cormorant_Garamond',serif]">
              ВостокЭкспертСтрой
            </p>
          </div>
          <p className="max-w-[760px] pt-1 text-[clamp(18px,1.6vw+12px,34px)] leading-[1.35] text-[#12120f] [font-family:'Cormorant_Garamond',serif]">
            Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса.
            Когда тишина становится ощутимой.
          </p>
        </div>
      </section>

      <section className="px-3 py-10 sm:px-5 md:px-10 md:py-16">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <h2 className="text-[clamp(36px,3.6vw,82px)] leading-[0.92] [font-family:'Cormorant_Garamond',serif]">Нам доверяют:</h2>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {trusted.map(([image, title, note]) => (
              <article key={title} className="flex min-h-[170px] flex-col items-center justify-center border border-[#f0ede7] bg-white p-4 text-center md:min-h-[210px] md:p-5 2xl:min-h-[240px]">
                <img src={image} alt={title} loading="lazy" decoding="async" width="240" height="221" className="mx-auto h-[110px] w-full object-contain md:h-[150px] 2xl:h-[170px]" />
              </article>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <a href="/about" className="inline-flex h-12 items-center justify-center bg-[#111] px-10 text-[clamp(12px,0.5vw+11px,16px)] text-white [font-family:'Cormorant_Garamond',serif]">
              Подробнее
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="px-3 py-12 sm:px-5 md:px-10 md:py-18">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <p className="text-[clamp(12px,0.4vw+10px,15px)] uppercase tracking-[1.5px] text-[#b99863] [font-family:'JetBrains_Mono',monospace]">основные услуги</p>
          <h2 className="mt-3 text-[clamp(32px,3.2vw,72px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Наши услуги</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {services.map((service) => (
              <article key={service.title} className="relative flex h-full flex-col border-l border-[#ece8e1] pl-3 transition-colors hover:border-[#d3b46a] md:pl-5">
                <a
                  href={serviceHrefByTitle[service.title] ?? "/services"}
                  aria-label={`Открыть направление: ${service.title}`}
                  className="absolute inset-0 z-10"
                />
                <img src={service.image} alt="" loading="lazy" decoding="async" width="560" height="560" className="mx-auto aspect-square w-[180px] object-cover sm:w-[220px] md:w-[250px]" />
                <h3 className="mt-5 max-w-[280px] text-[clamp(22px,1.6vw+16px,40px)] leading-[1.02] [font-family:'Cormorant_Garamond',serif]">{service.title}</h3>
                <p className="mt-4 max-w-[320px] flex-1 text-[clamp(14px,0.55vw+12px,18px)] leading-[1.65] text-[#2f2f2c]">{service.text}</p>
                <div className="relative z-20 mt-auto flex flex-wrap items-center gap-4 pt-6 text-[clamp(12px,0.4vw+10px,15px)] uppercase tracking-[1.2px] [font-family:'JetBrains_Mono',monospace]">
                  <a href="/checkout" className="inline-flex h-9 items-center justify-center bg-[#050505] px-5 text-white">заказать</a>
                  <a href={serviceHrefByTitle[service.title] ?? "/services"} className="text-[#2d2d29]">подробнее</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="px-3 py-14 sm:px-5 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Любая задача в 4 этапа</h2>
          <div className="mt-12 grid gap-12 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map(([image, title, text]) => (
              <article key={title} className="max-w-[280px]">
                <img src={image} alt="" loading="lazy" decoding="async" width="48" height="48" className="h-12 w-12 object-contain" />
                <h3 className="mt-5 text-[clamp(20px,1vw+16px,28px)] leading-none [font-family:'Cormorant_Garamond',serif]">{title}</h3>
                <p className="mt-3 text-[clamp(14px,0.5vw+12px,17px)] leading-[1.65] text-[#2f2f2c]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="px-3 py-16 sm:px-5 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[clamp(32px,3vw,60px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Новостной блог</h2>
            <a href="/news" className="pb-2 text-[clamp(12px,0.4vw+10px,15px)] uppercase tracking-[1.2px] text-[#2f2f2c] [font-family:'JetBrains_Mono',monospace]">Все новости</a>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {blog.map((article) => (
              <article key={article.title} className={`relative transition-opacity hover:opacity-95 ${article.wide ? "md:col-span-2" : ""}`}>
                <a href="/news" aria-label={`Открыть новость: ${article.title}`} className="absolute inset-0 z-10" />
                <img src={article.image} alt="" loading="lazy" decoding="async" width="1200" height="760" className="aspect-[16/10] w-full object-cover" />
                <div className="grid gap-5 border border-t-0 border-[#ece8e1] p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8">
                  <div>
                    <p className="text-[clamp(15px,0.55vw+12px,20px)] leading-[1.55] text-[#2d2d2a]">{article.text}</p>
                  </div>
                  <a href="/news" className="relative z-20 inline-flex h-10 items-center justify-center bg-[#1a1a1a] px-6 text-[clamp(12px,0.4vw+10px,14px)] uppercase tracking-[1.2px] text-white [font-family:'JetBrains_Mono',monospace]">
                    смотреть
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

        <section className="px-3 py-14 sm:px-5 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Мнения клиентов</h2>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            {reviews.map(([avatar, text, author, role]) => (
              <article key={author as string} className="grid gap-5">
                <p className="max-w-[620px] text-[clamp(24px,1.1vw+15px,44px)] leading-[1.28] italic tracking-[0.01em] text-[#1c1c19] [font-family:'Cormorant_Garamond',serif]">
                  {text}
                </p>
                <footer className="flex flex-wrap items-center gap-3">
                  <img src={avatar as string} alt={author as string} loading="lazy" decoding="async" width="120" height="120" className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-[160px]">
                    <strong className="block text-[clamp(26px,0.85vw+16px,38px)] leading-[1.04] tracking-[0.005em] [font-family:'Cormorant_Garamond',serif]">{author}</strong>
                    <span className="block text-[clamp(20px,0.7vw+13px,30px)] leading-[1.1] text-[#5f5f5b] [font-family:'Cormorant_Garamond',serif]">{role}</span>
                  </div>
                  <a href="/about" className="ml-auto inline-flex h-10 items-center justify-center bg-[#1a1a1a] px-6 text-[clamp(12px,0.4vw+10px,14px)] uppercase tracking-[1.2px] text-white [font-family:'JetBrains_Mono',monospace]">
                    отзыв
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </div>
        </section>

        <section id="contact" className="bg-white px-3 py-18 sm:px-5 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 border-b border-[#e8e3db] pb-16 lg:grid-cols-[420px_1fr] 2xl:max-w-[1860px]">
          <div>
            <h2 className="text-[clamp(40px,3.8vw,100px)] leading-[0.92] [font-family:'Cormorant_Garamond',serif]">Бесплатная консультация</h2>
            <div className="mt-8 space-y-8">
              <div>
                <p className="text-[clamp(10px,0.35vw+9px,12px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Офис</p>
                <p className="mt-3 text-[clamp(16px,0.8vw+12px,20px)] leading-8 text-[#111]">г. Москва, Калужская, 12</p>
              </div>
              <div>
                <p className="text-[clamp(10px,0.35vw+9px,12px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Запросы</p>
                <address className="mt-3 not-italic text-[clamp(16px,0.8vw+12px,20px)] leading-8 text-[#111]">
                  concierge@aeris-climate.com
                  <br />
                  +7 999 200 40 00
                </address>
              </div>
            </div>
          </div>

          <form className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[clamp(10px,0.35vw+9px,12px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Имя</span>
              <input
                className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[clamp(18px,1vw+14px,26px)] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif]"
                type="text"
                name="name"
                required
                placeholder="Ваше имя"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[clamp(10px,0.35vw+9px,12px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Телефон</span>
              <input
                className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[clamp(18px,1vw+14px,26px)] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif]"
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
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[clamp(10px,0.35vw+9px,12px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">О проекте</span>
              <div className="relative">
                <select className="h-20 w-full appearance-none border border-[#e5e3df] bg-[#fbfaf8] px-6 pr-20 text-[clamp(18px,1vw+14px,28px)] text-[#181816] [font-family:'Cormorant_Garamond',serif]" defaultValue="" name="projectType" required>
                  <option value="" disabled>
                    Жилой / Коммерческий / Другой
                  </option>
                  <option value="residence">Жилой</option>
                  <option value="commercial">Коммерческий</option>
                  <option value="other">Другой</option>
                </select>
                <span className="pointer-events-none absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 border-b-2 border-r-2 border-[#111] rotate-45" />
              </div>
            </label>
            <button className="inline-flex h-20 items-center justify-center bg-[#1a1a1a] px-10 text-[clamp(14px,0.6vw+12px,18px)] uppercase tracking-[1.6px] text-white [font-family:'JetBrains_Mono',monospace]" type="submit">
              оставить заявку
            </button>
            <span className="self-center text-[clamp(13px,0.5vw+11px,16px)] uppercase tracking-[1.4px] text-[#8a8a86] [font-family:'JetBrains_Mono',monospace]">
              отвечаем за 15 минут
            </span>
          </form>
        </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

export default StayseLandingTailwind;
