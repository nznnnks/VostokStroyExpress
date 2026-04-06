const stats = [
  ["100+", "реализованных проектов"],
  ["10+", "лет на рынке инженерных решений"],
  ["проверено", "на объектах высокого класса и в коммерческих пространствах"],
];

const trusted = [
  ["/image/намдоверяют1.png", "Artest", "88 Michelin"],
  ["/image/намдоверяют2.png", "White Rabbit", "88 Michelin"],
  ["/image/намдоверяют3.png", "Technikum", "рекомендовано Michelin"],
  ["/image/намдоверяют4.png", "Central House", "рекомендовано Michelin"],
  ["/image/намдоверяют5.png", "Regent", "рекомендовано Michelin"],
  ["/image/намдоверяют6.png", "Big Gourmet", "наградa Michelin Big Gourmand"],
  ["/image/намдоверяют7.png", "Co-Co Chalet", "в 10 лучших ресторанов краснодарского края"],
];

const services = [
  {
    image: "/image/Нашиуслуги1.png",
    title: "Тепловой контроль",
    text: "Настраиваем стабильную температуру и корректную работу систем в резиденциях, бутиках и инженерно сложных интерьерах.",
  },
  {
    image: "/image/нашиуслуги2.png",
    title: "Очистка воздуха",
    text: "Подбираем фильтрацию, влажность и воздухообмен так, чтобы система работала незаметно и ощущалась как комфорт.",
  },
  {
    image: "/image/нашиуслуги3.png",
    title: "Акустическая настройка",
    text: "Снижаем шум, убираем лишние вибрации и интегрируем оборудование без конфликта с архитектурой пространства.",
  },
];

const steps = [
  ["/image/любаязадача1.png", "Диагностика", "Изучаем объект, ограничения и режим эксплуатации, чтобы не перегружать проект лишними решениями."],
  ["/image/любаязадача2.png", "Моделирование", "Собираем инженерную схему, считаем нагрузки и согласовываем логику системы."],
  ["/image/любаязадача3.png", "Интеграция", "Встраиваем оборудование в архитектуру, интерьер и существующие инженерные сети."],
  ["/image/любаязадача4.png", "Запуск", "Проводим настройку, тестирование и передаём систему в эксплуатацию с понятным сопровождением."],
];

const blog = [
  {
    image: "/image/новостнойблок1.png",
    title: "Почему инженерия должна быть частью тихого интерьера",
    text: "Разбираем, как оборудование высокого класса интегрируется в пространство без визуального и акустического давления.",
    wide: true,
  },
  {
    image: "/image/новостнойблок2.png",
    title: "Сервис и контроль системы после запуска",
    text: "Что важно предусмотреть заранее, чтобы климатическая система не требовала постоянного внимания.",
  },
  {
    image: "/image/новостнойблок3.png",
    title: "Что нужно знать про VRF-решения",
    text: "Коротко о сценариях применения и тонкостях подбора для объектов разного масштаба.",
  },
  {
    image: "/image/новостнойблок4.png",
    title: "Надёжность как главный критерий премиальной инженерии",
    text: "Почему стабильная работа системы важнее перегруженного набора характеристик в спецификации.",
  },
];

const reviews = [
  [
    "/image/мнениеклиентов1.svg",
    "Команда спроектировала решение очень аккуратно: техника не спорит с интерьером, работает тихо и даёт ощущение полной собранности пространства.",
    "Анна Морозова",
    "дизайнер интерьеров",
  ],
  [
    "/image/мнениеклиентов2.svg",
    "Получили понятный процесс, хороший контроль на всех этапах и систему, которая реально ощущается как премиальный сервис, а не как набор оборудования.",
    "Илья Сергеев",
    "управляющий объектом",
  ],
];

export function StayseLandingTailwind() {
  return (
    <main className="bg-white text-[#0f0f0e] [font-family:Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#efefec] px-3 py-3 md:px-10">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 text-[10px] uppercase tracking-[1.2px] text-[#6b6b67] sm:text-[11px] md:gap-8 [font-family:'JetBrains_Mono',monospace]">
          <a href="/" className="shrink-0 text-[#050505] [font-family:'Cormorant_Garamond',serif] text-[28px] normal-case tracking-[-0.03em] sm:text-[32px]">
            ВостокСтройЭксперт
          </a>
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <a href="/">главная</a>
            <a href="/about">о нас</a>
            <a href="/services">услуги</a>
            <a href="/news">проекты</a>
            <a href="/catalog">каталог</a>
            <a href="/news">блог</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a href="/catalog" aria-label="Поиск по каталогу">
              <img src="/image/лупа.png" alt="" aria-hidden="true" loading="eager" decoding="async" width="18" height="18" className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4" />
            </a>
            <a href="/cart" aria-label="Корзина">
              <img src="/image/cart.png" alt="" aria-hidden="true" loading="eager" decoding="async" width="18" height="18" className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4" />
            </a>
            <a href="/login" className="inline-flex h-10 items-center justify-center bg-[#050505] px-6 text-[11px] text-white [font-family:'JetBrains_Mono',monospace]">
              войти
            </a>
          </div>
        </div>
      </header>

      <section id="hero" className="relative isolate overflow-hidden bg-[#050505] text-white">
        <img
          src="/image/Главноефото в меню.png"
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
        <div className="mx-auto flex min-h-[620px] max-w-[1280px] flex-col justify-between px-3 pb-5 pt-10 sm:px-5 md:min-h-[790px] md:px-10 md:pb-10 md:pt-24">
          <div className="max-w-[700px]">
            <h1 className="max-w-[760px] text-[56px] leading-[0.88] tracking-[-0.05em] sm:text-[72px] md:text-[108px] [font-family:'Cormorant_Garamond',serif]">
              Атмосферное
              <br />
              Совершенство
            </h1>
            <p className="mt-4 max-w-[820px] text-[16px] font-[200] leading-[1.55] text-[#f4f4f1] sm:text-[18px] md:mt-6 md:max-w-[900px] md:text-[30px]">
              Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса.
              Когда тишина становится ощутимой.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-[1.2px] sm:text-[11px] [font-family:'JetBrains_Mono',monospace]">
              <a href="/services" className="inline-flex h-11 min-w-[152px] items-center justify-center bg-[#1a1a1a] px-5 text-white">
                услуги
              </a>
              <a href="/catalog" className="inline-flex h-11 items-center justify-center px-5 text-white/92">
                каталог
              </a>
            </div>
          </div>

          <ul className="mt-10 grid gap-6 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[1.7px] text-[#f4f4f1d6] sm:grid-cols-3 sm:text-[11px] [font-family:'JetBrains_Mono',monospace]">
            {stats.map(([value, label]) => (
              <li key={label} className="flex flex-col gap-2">
                <strong className="text-[15px] font-normal leading-none tracking-[0.18em] text-white sm:text-[17px] md:text-[18px]">{value}</strong>
                <span className="max-w-[420px] leading-5">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="about" className="px-3 pb-5 pt-6 sm:px-5 md:px-10 md:pt-8">
        <div className="mx-auto grid max-w-[1280px] gap-6 pb-6 md:grid-cols-[120px_380px_1fr] md:items-start md:gap-10">
          <div className="text-[76px] leading-[0.78] text-[#e5dfd8] md:text-[112px] [font-family:'Cormorant_Garamond',serif]">25</div>
          <div>
            <h2 className="text-[42px] leading-[0.92] md:text-[56px] [font-family:'Cormorant_Garamond',serif]">О компании</h2>
            <p className="mt-3 max-w-[300px] text-[14px] italic leading-6 text-[#8b8b86] [font-family:'Cormorant_Garamond',serif] sm:text-[18px]">
              ВостокЭкспертСтрой
            </p>
          </div>
          <p className="max-w-[760px] pt-1 text-[20px] leading-[1.35] text-[#12120f] sm:text-[24px] md:text-[30px] [font-family:'Cormorant_Garamond',serif]">
            Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса.
            Когда тишина становится ощутимой.
          </p>
        </div>
      </section>

      <section className="px-3 py-5 sm:px-5 md:px-10 md:py-8">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-[42px] leading-[0.92] md:text-[64px] [font-family:'Cormorant_Garamond',serif]">Нам доверяют:</h2>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {trusted.map(([image, title, note]) => (
              <article key={title} className="flex min-h-[170px] flex-col justify-between border border-[#f0ede7] bg-white p-3 text-center md:min-h-[220px] md:p-3">
                <img src={image} alt={title} loading="lazy" decoding="async" width="240" height="221" className="mx-auto h-[92px] w-full object-contain md:h-[132px]" />
                <div className="mt-3">
                  <p className="mx-auto max-w-[220px] text-[11px] font-semibold leading-[1.2] text-[#050505] md:text-[12px]">{note}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <a href="/about" className="inline-flex h-12 items-center justify-center bg-[#111] px-10 text-[14px] text-white [font-family:'Cormorant_Garamond',serif]">
              Подробнее
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="px-3 py-10 sm:px-5 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-[11px] uppercase tracking-[1.5px] text-[#cdb89b] [font-family:'JetBrains_Mono',monospace]">основные услуги</p>
          <h2 className="mt-3 text-[40px] leading-[0.95] md:text-[54px] [font-family:'Cormorant_Garamond',serif]">Наши услуги</h2>
          <div className="mt-7 grid gap-8 md:grid-cols-3 md:gap-5">
            {services.map((service) => (
              <article key={service.title} className="flex flex-col border-l border-[#ece8e1] pl-3 md:pl-5">
                <img src={service.image} alt="" loading="lazy" decoding="async" width="560" height="560" className="mx-auto aspect-square w-[180px] object-cover sm:w-[220px] md:w-[250px]" />
                <h3 className="mt-5 max-w-[280px] text-[28px] leading-[1.02] md:text-[40px] [font-family:'Cormorant_Garamond',serif]">{service.title}</h3>
                <p className="mt-4 max-w-[300px] text-[13px] leading-6 text-[#4f4f4b] sm:text-[14px]">{service.text}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[1.2px] sm:text-[11px] [font-family:'JetBrains_Mono',monospace]">
                  <a href="/checkout" className="inline-flex h-9 items-center justify-center bg-[#050505] px-5 text-white">заказать</a>
                  <a href={`/services/${service.title === "Тепловой контроль" ? "thermal-control" : service.title === "Очистка воздуха" ? "air-cleaning" : "acoustic-tuning"}`} className="text-[#2d2d29]">подробнее</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="px-3 py-8 sm:px-5 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-[40px] leading-[0.95] md:text-[54px] [font-family:'Cormorant_Garamond',serif]">Любая задача в 4 этапа</h2>
          <div className="mt-7 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map(([image, title, text]) => (
              <article key={title} className="max-w-[280px]">
                <img src={image} alt="" loading="lazy" decoding="async" width="48" height="48" className="h-12 w-12 object-contain" />
                <h3 className="mt-5 text-[24px] leading-none md:text-[28px] [font-family:'Cormorant_Garamond',serif]">{title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-[#4f4f4b] sm:text-[14px]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="px-3 py-8 sm:px-5 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[40px] leading-[0.95] md:text-[54px] [font-family:'Cormorant_Garamond',serif]">Новостной блог</h2>
            <a href="/news" className="pb-2 text-[10px] uppercase tracking-[1.2px] text-[#3e3e39] sm:text-[11px] [font-family:'JetBrains_Mono',monospace]">Все новости</a>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {blog.map((article) => (
              <article key={article.title} className={`${article.wide ? "md:col-span-2" : ""}`}>
                <img src={article.image} alt="" loading="lazy" decoding="async" width="1200" height="760" className="aspect-[16/10] w-full object-cover" />
                <div className="grid gap-3 border border-t-0 border-[#ece8e1] p-3 md:grid-cols-[1fr_auto] md:items-end md:gap-4">
                  <div>
                    <p className="text-[13px] leading-5 text-[#4f4f4b]">{article.text}</p>
                  </div>
                  <a href="/news" className="inline-flex h-9 items-center justify-center bg-[#1a1a1a] px-5 text-[10px] uppercase tracking-[1.2px] text-white sm:text-[11px] [font-family:'JetBrains_Mono',monospace]">
                    смотреть
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-3 py-8 sm:px-5 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-[40px] leading-[0.95] md:text-[54px] [font-family:'Cormorant_Garamond',serif]">Мнения клиентов</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {reviews.map(([avatar, text, author, role]) => (
              <article key={author as string} className="grid gap-5">
                <p className="max-w-[540px] text-[13px] leading-6 text-[#4f4f4b] sm:text-[14px]">{text}</p>
                <footer className="flex flex-wrap items-center gap-3">
                  <img src={avatar as string} alt={author as string} loading="lazy" decoding="async" width="120" height="120" className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-[160px]">
                    <strong className="block text-[13px]">{author}</strong>
                    <span className="block text-[12px] text-[#75756f]">{role}</span>
                  </div>
                  <a href="/about" className="ml-auto inline-flex h-9 items-center justify-center bg-[#1a1a1a] px-5 text-[10px] uppercase tracking-[1.2px] text-white sm:text-[11px] [font-family:'JetBrains_Mono',monospace]">
                    отзыв
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-3 py-14 sm:px-5 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-12 border-b border-[#e8e3db] pb-14 lg:grid-cols-[420px_1fr]">
          <div>
            <h2 className="text-[52px] leading-[0.92] md:text-[82px] [font-family:'Cormorant_Garamond',serif]">Бесплатная консультация</h2>
            <div className="mt-8 space-y-8">
              <div>
                <p className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Офис</p>
                <p className="mt-3 text-[18px] leading-8 text-[#111]">г. Москва, Калужская, 12</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Запросы</p>
                <address className="mt-3 not-italic text-[18px] leading-8 text-[#111]">
                  concierge@aeris-climate.com
                  <br />
                  +7 999 200 40 00
                </address>
              </div>
            </div>
          </div>

          <form className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Имя</span>
              <input className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[24px] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif]" type="text" defaultValue="АЛЬФА ДЕВЕЛОПМЕНТ" />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Телефон</span>
              <input className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[24px] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif]" type="tel" defaultValue="+7 (985) 386-22-22" />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">О проекте</span>
              <div className="relative">
                <select className="h-20 w-full appearance-none border border-[#e5e3df] bg-[#fbfaf8] px-6 pr-20 text-[26px] text-[#181816] [font-family:'Cormorant_Garamond',serif]" defaultValue="other">
                  <option value="other">Жилой / Коммерческий / Другой</option>
                  <option value="residence">Жилой</option>
                  <option value="commercial">Коммерческий</option>
                </select>
                <span className="pointer-events-none absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 border-b-2 border-r-2 border-[#111] rotate-45" />
              </div>
            </label>
            <button className="inline-flex h-20 items-center justify-center bg-[#1a1a1a] px-10 text-[18px] uppercase tracking-[1.6px] text-white [font-family:'JetBrains_Mono',monospace]" type="submit">
              оставить заявку
            </button>
            <span className="self-center text-[16px] uppercase tracking-[1.4px] text-[#8a8a86] [font-family:'JetBrains_Mono',monospace]">
              отвечаем за 15 минут
            </span>
          </form>
        </div>

        <footer className="mx-auto grid max-w-[1280px] gap-10 bg-[#f7f5f1] px-4 py-10 md:grid-cols-[1.1fr_1.2fr_1fr] md:px-6">
          <div>
            <div className="flex items-center gap-3">
              <img src="/image/Icon.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" width="16" height="16" className="h-4 w-4 object-contain" />
              <span className="text-[24px] italic text-[#050505] [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</span>
            </div>
            <p className="mt-8 max-w-[360px] text-[16px] uppercase leading-10 tracking-[1.8px] text-[#7d7d78] [font-family:'JetBrains_Mono',monospace]">
              архитектурная климатическая интеграция для нового поколения антропогенной среды.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-[18px] font-semibold uppercase tracking-[1.2px] text-[#111] [font-family:'Cormorant_Garamond',serif]">Карта сайта</h3>
              <div className="mt-6 space-y-4 text-[16px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[38px]">
              <div className="space-y-4 text-[16px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[38px]">
              <div className="space-y-4 text-[16px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[18px] font-semibold uppercase tracking-[1.2px] text-[#111] [font-family:'Cormorant_Garamond',serif]">Юридическая информация</h3>
            <div className="mt-10 space-y-6 text-[16px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">
              <p>Соглашение о конфиденциальности</p>
              <p>Условия</p>
            </div>
          </div>
        </footer>

        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 border-t border-[#e8e3db] bg-[#f7f5f1] px-4 pb-6 pt-6 text-[12px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace] md:flex-row md:items-center md:justify-between md:px-6">
          <p>© 2026 <span className="[font-family:'Cormorant_Garamond',serif] italic text-[#5b5b56]">ВостокСтройЭксперт</span> climate technologies. Все права защищены.</p>
          <div className="flex items-center gap-6">
            <img src="/image/planet.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" width="16" height="16" className="h-5 w-5 object-contain opacity-70" />
            <img src="/image/cart.png" alt="" aria-hidden="true" loading="lazy" decoding="async" width="18" height="18" className="h-4 w-4 object-contain opacity-70" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default StayseLandingTailwind;
