import { Suspense, lazy, useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const LazyHeroDesktopModel = lazy(() => import("./HeroDesktopModel"));

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits === "7" || digits === "8") return "+7";
  let normalized = digits;
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (normalized.startsWith("7")) normalized = normalized.slice(1);
  const slice = normalized.slice(0, 10);
  if (!slice) return "";
  let result = "+7";
  if (slice.length > 0) result += ` (${slice.slice(0, 3)}`;
  if (slice.length > 3) result += ")";
  if (slice.length > 3) result += ` ${slice.slice(3, 6)}`;
  if (slice.length > 6) result += `-${slice.slice(6, 8)}`;
  if (slice.length > 8) result += `-${slice.slice(8, 10)}`;
  return result;
};

const stats = [
  {
    value: "100+",
    mobileLines: ["реализовано", "проектов"],
    desktopLabel: "реализованных проектов",
  },
  {
    value: "10+",
    mobileLines: ["лет", "практики"],
    desktopLabel: "лет на рынке инженерных решений",
  },
  {
    value: "проверено",
    mobileLines: ["премиальные", "объекты"],
    desktopLabel: "на объектах высокого класса и в коммерческих пространствах",
  },
] as const;

const trustHighlights = [
  {
    value: "25",
    lines: ["лет на", "российском рынке"],
  },
  {
    value: "100+",
    lines: ["реализованных", "проектов"],
  },
  {
    value: "10+",
    lines: ["лет инженерной", "практики"],
  },
  {
    value: "62+",
    lines: ["брендов в", "ассортименте"],
  },
] as const;

const trustLogos = [
  { path: "/image/clear_logo/artest.png", alt: "Artest" },
  { path: "/image/clear_logo/white-rabbit.png", alt: "White Rabbit" },
  { path: "/image/clear_logo/regent.png", alt: "Regent" },
  { path: "/image/clear_logo/co-co-chalet.png", alt: "Co-Co Chalet" },
  { path: "/image/clear_logo/ugolek.png", alt: "Ugolek" },
  { path: "/image/clear_logo/restaurant-central-house-of-writers.png", alt: "Central House of Writers" },
  { path: "/image/clear_logo/tehnikum.png", alt: "Tehnikum" },
] as const;

const trustLogoTopRow = trustLogos.slice(0, 4);
const trustLogoBottomRow = trustLogos.slice(4);
const trustLogoDesktopTopRow = [
  { path: "/image/clear_logo/artest.png", alt: "Artest" },
  { path: "/image/clear_logo/white-rabbit.png", alt: "White Rabbit" },
  { path: "/image/clear_logo/tehnikum.png", alt: "Tehnikum" },
  { path: "/image/clear_logo/restaurant-central-house-of-writers.png", alt: "Central House of Writers" },
  { path: "/image/clear_logo/regent.png", alt: "Regent" },
  { path: "/image/clear_logo/ugolek.png", alt: "Ugolek" },
  { path: "/image/clear_logo/co-co-chalet.png", alt: "Co-Co Chalet" },
] as const;
const trustLogoDesktopBottomRow = [
  { path: "/image/clear_logo/burger-king.png", alt: "Burger King" },
  { path: "/image/clear_logo/KFC.png", alt: "KFC" },
  { path: "/image/clear_logo/bowl-room.png", alt: "Bowl Room" },
  { path: "/image/clear_logo/papa-johns.png", alt: "Papa Johns" },
  { path: "/image/clear_logo/kabuki.png", alt: "Kabuki" },
  { path: "/image/clear_logo/vanwok.png", alt: "Vanwok" },
] as const;

const services = [
  {
    poster: "/image/services-preview-2026.png",
    video: "/video/about-trust.mp4",
    title: "Тепловой контроль",
    text: "Настраиваем стабильную температуру и корректную работу систем в резиденциях, бутиках и инженерно сложных интерьерах.",
    accentClassName: "bg-[#9fd6f0]",
  },
  {
    poster: "/image/services-preview-2026.png",
    video: "/video/about-trust.mp4",
    title: "Очистка воздуха",
    text: "Подбираем фильтрацию, влажность и воздухообмен так, чтобы система работала незаметно и ощущалась как комфорт.",
    accentClassName: "bg-[#ecd693]",
  },
  {
    poster: "/image/services-preview-2026.png",
    video: "/video/about-trust.mp4",
    title: "Акустическая настройка",
    text: "Снижаем шум, убираем лишние вибрации и интегрируем оборудование без конфликта с архитектурой пространства.",
    accentClassName: "bg-[#ead79d]",
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
  const [animatedStats, setAnimatedStats] = useState([0, 1]);
  const [heroStatsVisible, setHeroStatsVisible] = useState(false);
  const [showHeroModel, setShowHeroModel] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setAnimatedStats([100, 10]);
      setHeroStatsVisible(true);
      return;
    }

    let frameId = 0;
    let revealTimeout = 0;
    let startTimeout = 0;
    const duration = 3400;
    const delays = [0, 420];
    const targets = [100, 10];
    let start = 0;

    const tick = (now: number) => {
      const nextValues = targets.map((target, index) => {
        const elapsed = now - start - delays[index];
        if (elapsed <= 0) return index === 1 ? 1 : 0;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        return index === 1 ? Math.max(1, value) : value;
      });

      setAnimatedStats(nextValues as [number, number]);

      if (nextValues[0] < targets[0] || nextValues[1] < targets[1]) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    startTimeout = window.setTimeout(() => {
      start = performance.now();
      frameId = window.requestAnimationFrame(tick);
    }, 520);
    revealTimeout = window.setTimeout(() => setHeroStatsVisible(true), 1450);

    return () => {
      window.clearTimeout(startTimeout);
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(revealTimeout);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia("(min-width: 768px)");
    const update = () => setShowHeroModel(mediaQueryList.matches);
    update();

    if ("addEventListener" in mediaQueryList) {
      mediaQueryList.addEventListener("change", update);
      return () => mediaQueryList.removeEventListener("change", update);
    }

    mediaQueryList.addListener(update);
    return () => mediaQueryList.removeListener(update);
  }, []);
  const blogTopRow = blog.slice(0, 2);
  const blogBottomRow = blog.slice(2, 4);
  const renderBlogCard = (article: (typeof blog)[number], isWide: boolean, imageClassName: string, contentClassName: string) => (
    <article key={article.title} className={`group relative overflow-hidden transition duration-500 ease-out hover:-translate-y-1 hover:opacity-100 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${isWide ? "md:col-span-8" : "md:col-span-4"}`}>
      <a href="/news" aria-label={`Открыть новость: ${article.title}`} className="absolute inset-0 z-10" />
      <img
        src={article.image}
        alt=""
        loading="lazy"
        decoding="async"
        width="1200"
        height="760"
        className={`w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025] ${imageClassName}`}
      />
      {isWide ? (
        <div className={`grid border border-t-0 border-[#ece8e1] bg-white p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8 md:p-6 ${contentClassName}`}>
          <p className="max-w-[90%] text-[clamp(15px,0.55vw+12px,20px)] leading-[1.5] text-[#2d2d2a]">{article.text}</p>
          <a
            href="/news"
            className="relative z-20 inline-flex h-11 w-fit items-center justify-center self-start bg-[#1a1a1a] px-7 text-[clamp(12px,0.4vw+10px,14px)] uppercase tracking-[1.2px] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#2a2a2a] md:self-end [font-family:'JetBrains_Mono',monospace]"
          >
            смотреть
          </a>
        </div>
      ) : (
        <div className={`border border-t-0 border-[#ece8e1] bg-white p-5 md:p-6 ${contentClassName}`}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-5">
            <p className="max-w-[22ch] text-[clamp(15px,0.55vw+12px,20px)] leading-[1.5] text-[#2d2d2a]">{article.text}</p>
            <a
              href="/news"
              className="relative z-20 inline-flex h-11 w-fit items-center justify-center self-start bg-[#1a1a1a] px-7 text-[clamp(12px,0.4vw+10px,14px)] uppercase tracking-[1.2px] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#2a2a2a] md:self-end [font-family:'JetBrains_Mono',monospace]"
            >
              смотреть
            </a>
          </div>
        </div>
      )}
    </article>
  );

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#0f0f0e] [font-family:Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section id="hero" className="hero">
          <div className="hero__background" aria-hidden="true">
            <img
              src="/image/hero-menu.png"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              width="1280"
              height="6179"
              className="hero__bg hero__bg--mobile"
            />
            <img
              src="/image/hero-desktop-bg.jpeg"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              width="1280"
              height="720"
              className="hero__bg hero__bg--desktop"
            />
          </div>

          <div className="hero__inner">
            <div className="hero__stage">
              {showHeroModel ? (
                <div className="hero__media" aria-hidden="true">
                  <Suspense fallback={null}>
                    <LazyHeroDesktopModel />
                  </Suspense>
                </div>
              ) : null}

              <div className="hero__content">
                <h1 className="hero__title">
              Атмосферное
              <br />
              Совершенство
            </h1>
            <p className="hero__lead">
              Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса.
              Когда тишина становится ощутимой.
            </p>
            <div className="hero__actions">
              <a
                href="/services"
                className="hero__button hero__button--primary"
              >
                <span className="translate-y-[0.04em] leading-none">услуги</span>
              </a>
              <a
                href="/catalog"
                className="hero__button hero__button--secondary"
              >
                <span className="translate-y-[0.04em] leading-none">каталог</span>
              </a>
            </div>
              </div>
            </div>

            <div className="hero__achievements">
              <ul className="hero__stats">
            {stats.map(({ value, mobileLines, desktopLabel }, index) => (
              <li
                key={value}
                className={`hero__stat ${heroStatsVisible ? "is-visible" : ""}`}
                style={{ transitionDelay: `${index * 130}ms` }}
              >
                {index > 0 ? (
                  <span className="hero__stat-divider" aria-hidden="true" />
                ) : null}
                <strong
                  className="hero__stat-value"
                  style={index === 2 ? { transitionDelay: "260ms" } : undefined}
                >
                  {index === 0 ? `${animatedStats[0]}+` : index === 1 ? `${animatedStats[1]}+` : value}
                </strong>
                <div className="hero__stat-mobile-label">
                  {mobileLines.map((line) => (
                    <p
                      key={line}
                      className="hero__stat-mobile-line"
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <span className="hero__stat-label">{desktopLabel}</span>
              </li>
            ))}
              </ul>
            </div>
          </div>
        </section>

      <section id="about" className="relative overflow-hidden bg-[#050505] px-3 pt-12 pb-0 text-white sm:px-5 md:pt-18 md:pb-0">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-screen -translate-x-1/2 overflow-hidden">
            <img
              src="/image/about-trust-mobile.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.03] md:hidden"
            />
            <img
              src="/image/hero-desktop-bg.jpeg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
            />
            <video
              className="absolute inset-0 hidden h-full w-full object-cover md:block"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/image/hero-desktop-bg.jpeg"
            >
              <source src="/video/about-trust.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,15,0.08)_0%,rgba(8,11,16,0.08)_18%,rgba(8,11,16,0.14)_46%,rgba(8,11,16,0.24)_100%)] md:bg-[linear-gradient(180deg,rgba(7,10,15,0.56)_0%,rgba(8,11,16,0.52)_16%,rgba(8,11,16,0.62)_42%,rgba(8,11,16,0.72)_72%,rgba(8,11,16,0.84)_100%)]" />
          </div>
        </div>

        <div className="relative z-10 left-1/2 w-screen -translate-x-1/2">
          <div className="px-3 sm:px-5 md:px-10 xl:px-12 2xl:px-20">
            <div className="grid gap-4 xl:grid-cols-4 xl:items-stretch xl:gap-6 2xl:gap-8">
            <div className="flex min-h-[118px] flex-col justify-start rounded-[18px] bg-white px-6 py-5 text-[#12120f] md:min-h-[124px] md:px-8 md:py-5 xl:min-h-[132px] xl:justify-between xl:px-10 xl:py-6">
              <p className="text-[clamp(10px,0.32vw+9px,14px)] uppercase tracking-[0.22em] text-[#7f8ea3] [font-family:'JetBrains_Mono',monospace]">25 лет на российском рынке</p>
              <h2 className="mt-7 max-w-[12ch] text-[clamp(32px,8vw,46px)] leading-[0.92] tracking-[-0.03em] [font-family:'Cormorant_Garamond',serif] md:mt-0 md:max-w-[14ch] md:text-[clamp(28px,2vw,40px)] md:leading-[0.98] md:tracking-[-0.02em]">ВостокСтройЭксперт</h2>
            </div>
            <div className="flex min-h-[116px] items-center rounded-[18px] bg-white px-6 py-5 text-[#12120f] md:min-h-[124px] md:px-8 md:py-5 xl:col-span-3 xl:min-h-[132px] xl:px-14 2xl:px-16">
              <p className="max-w-[68ch] text-[clamp(24px,1.55vw,42px)] leading-[1.08] [font-family:'Cormorant_Garamond',serif]">
                Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса. Когда тишина становится ощутимой.
              </p>
            </div>
          </div>
          </div>

          <div className="relative z-10 left-1/2 mt-8 w-screen -translate-x-1/2">
            <div className="px-3 py-10 sm:px-5 md:px-10 xl:px-12 xl:py-12 2xl:px-20">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-6 2xl:gap-8">
                {trustHighlights.map(({ value, lines }) => (
                  <article
                    key={value}
                    className="flex min-h-[128px] flex-col justify-between rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(89,98,116,0.42)_0%,rgba(68,74,89,0.32)_100%)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-[10px] xl:min-h-[176px] xl:px-7 xl:py-6"
                  >
                    <strong className="block text-[clamp(2rem,6vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#eef0f4] xl:text-[clamp(2.45rem,2.4vw,3.7rem)]">{value}</strong>
                    <p className="text-[clamp(13px,1.1vw,18px)] font-semibold leading-[0.98] text-[#d7dae1] xl:text-[clamp(17px,0.72vw+13px,26px)]">
                      <span className="block whitespace-nowrap">{lines[0]}</span>
                      <span className="block whitespace-nowrap">{lines[1]}</span>
                    </p>
                  </article>
                ))}
              </div>

            </div>

            <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 sm:mt-10 2xl:mt-12">
              <div className="hidden flex-col gap-4 px-3 sm:flex sm:flex-row sm:items-end sm:justify-between sm:px-4 md:px-6 2xl:px-8">
                <div className="space-y-4 sm:self-end">
                  <div className="inline-flex min-h-[92px] w-fit items-center rounded-[18px] border border-[#e7e2d9] bg-[linear-gradient(180deg,#ffffff_0%,#f6f3ee_100%)] px-6 py-4 text-[clamp(18px,1vw+14px,28px)] font-semibold text-[#12120f] shadow-[0_10px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] xl:px-7">
                    Более 62 брендов нам доверяют
                  </div>
                </div>
                <a
                  href="/about"
                  className="inline-flex min-h-[78px] w-full items-center justify-center self-start rounded-[20px] border border-[#d8c6a3] bg-white px-8 text-center text-[clamp(18px,1vw+14px,28px)] font-semibold leading-none tracking-[0.01em] text-[#12120f] shadow-[0_14px_34px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.82)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#c9ae7a] hover:shadow-[0_24px_40px_rgba(0,0,0,0.2)] sm:min-h-[92px] sm:w-[320px] sm:self-end"
                >
                  О нас
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 px-3 sm:hidden">
              <div className="inline-flex w-fit rounded-[18px] border border-[#e7e2d9] bg-[linear-gradient(180deg,#ffffff_0%,#f6f3ee_100%)] px-5 py-3 text-[22px] font-semibold text-[#12120f] shadow-[0_10px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]">
                Более 62 брендов
              </div>
            </div>

            <div className="mt-5 bg-white/98 px-3 py-3 xl:px-0 xl:py-4 2xl:mt-12">
              <div className="xl:max-w-none">
                <div className="sm:hidden">
                  <div className="space-y-2 overflow-hidden">
                    <div className="flex w-max gap-2 -translate-x-16">
                      {trustLogoTopRow.map(({ path, alt }) => (
                        <article
                          key={path}
                          className="flex h-[94px] w-[172px] shrink-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3"
                        >
                          <img
                            src={path}
                            alt={alt}
                            loading="lazy"
                            decoding="async"
                            className="max-h-[48px] w-full max-w-[148px] object-contain object-center"
                          />
                        </article>
                      ))}
                    </div>
                    <div className="flex w-max gap-2 -translate-x-4">
                      {trustLogoBottomRow.map(({ path, alt }) => (
                        <article
                          key={path}
                          className="flex h-[94px] w-[172px] shrink-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3"
                        >
                          <img
                            src={path}
                            alt={alt}
                            loading="lazy"
                            decoding="async"
                            className="max-h-[48px] w-full max-w-[148px] object-contain object-center"
                          />
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block xl:hidden">
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      {trustLogoTopRow.map(({ path, alt }) => (
                        <article
                          key={path}
                          className="group flex min-h-[112px] items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)]"
                        >
                          <img
                            src={path}
                            alt={alt}
                            loading="lazy"
                            decoding="async"
                            className="max-h-[66px] w-full max-w-[172px] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)]"
                          />
                        </article>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:mx-auto sm:w-[86%]">
                      {trustLogoBottomRow.map(({ path, alt }) => (
                        <article
                          key={path}
                          className="group flex min-h-[112px] items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)]"
                        >
                          <img
                            src={path}
                            alt={alt}
                            loading="lazy"
                            decoding="async"
                            className="max-h-[66px] w-full max-w-[172px] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)]"
                          />
                        </article>
                      ))}
                    </div>

                  </div>
                </div>

                <div className="hidden overflow-hidden space-y-3 xl:block">
                  <div className="flex w-max gap-3 -translate-x-[3.5rem] 2xl:gap-4 2xl:-translate-x-[4.5rem]">
                    {trustLogoDesktopTopRow.map(({ path, alt }, index) => (
                      <article
                        key={`${path}-${index}`}
                        className="group flex h-[112px] w-[250px] shrink-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)] xl:w-[260px] 2xl:h-[118px] 2xl:w-[300px]"
                      >
                        <img
                          src={path}
                          alt={alt}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[66px] w-full max-w-[172px] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)] xl:max-h-[68px] 2xl:max-h-[70px]"
                        />
                      </article>
                    ))}
                  </div>

                  <div className="flex w-max gap-3 translate-x-[1.5rem] 2xl:gap-4 2xl:translate-x-[2rem]">
                    {trustLogoDesktopBottomRow.map(({ path, alt }, index) => (
                      <article
                        key={`${path}-${index}`}
                        className="group flex h-[112px] w-[250px] shrink-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)] xl:w-[260px] 2xl:h-[118px] 2xl:w-[300px]"
                      >
                        <img
                          src={path}
                          alt={alt}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[66px] w-full max-w-[172px] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)] xl:max-h-[68px] 2xl:max-h-[70px]"
                        />
                      </article>
                    ))}
                  </div>

                </div>
              </div>
            </div>

            <div className="mt-6 mb-8 px-3 sm:hidden">
              <a
                href="/about"
                className="inline-flex min-h-[74px] w-full items-center justify-center rounded-[20px] border border-[#b99863] bg-white px-5 text-center text-[22px] font-semibold leading-none tracking-[0.01em] text-[#12120f] shadow-[0_18px_32px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.86)]"
              >
                <span className="whitespace-nowrap">Больше о нас</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="px-3 py-12 sm:px-5 md:px-10 md:py-18">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <p className="text-[clamp(12px,0.45vw+10px,17px)] uppercase tracking-[1.5px] text-[#b99863] [font-family:'JetBrains_Mono',monospace]">основные услуги</p>
          <h2 className="mt-3 text-[clamp(32px,3.2vw,72px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Наши услуги</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {services.map((service, index) => (
              <article
                key={service.title}
                className={`group relative flex h-full flex-col border-l border-[#ece8e1] px-0 transition duration-500 ease-out hover:-translate-y-1 hover:border-[#d3b46a] md:pl-5 md:pr-0 ${
                  index === services.length - 1 ? "xl:border-r xl:pr-5" : ""
                }`}
                onMouseEnter={(event) => {
                  if (window.innerWidth < 768) return;
                  const video = event.currentTarget.querySelector("video");
                  if (video instanceof HTMLVideoElement) {
                    void video.play().catch(() => {});
                  }
                }}
                onMouseLeave={(event) => {
                  if (window.innerWidth < 768) return;
                  const video = event.currentTarget.querySelector("video");
                  if (video instanceof HTMLVideoElement) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
              >
                <a
                  href={serviceHrefByTitle[service.title] ?? "/services"}
                  aria-label={`Открыть направление: ${service.title}`}
                  className="absolute inset-0 z-10"
                />
                <div className="relative w-full overflow-hidden rounded-none md:mx-auto md:w-full md:max-w-[400px] md:rounded-[22px]">
                  <div className={`pointer-events-none absolute left-1/2 top-[8%] h-[58%] w-[46%] -translate-x-1/2 rounded-full opacity-65 blur-[2px] ${service.accentClassName}`} />
                  <div className={`pointer-events-none absolute bottom-[2%] left-1/3 h-[18%] w-[26%] -translate-x-1/2 rotate-[-8deg] opacity-95 ${service.accentClassName}`} style={{ clipPath: "polygon(0 0, 100% 0, 100% 68%, 0 100%)" }} />
                  <div className="relative aspect-[1.32] overflow-hidden rounded-none bg-[#f4f1ea] md:aspect-[1.3] md:rounded-[22px]">
                    <video
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster={service.poster}
                      className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition duration-500 ease-out md:block group-hover:opacity-100"
                    >
                      <source src={service.video} type="video/mp4" />
                    </video>
                    <img
                      src={service.poster}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width="560"
                      height="560"
                      className="relative z-[1] h-full w-full rounded-none object-cover transition duration-500 ease-out group-hover:scale-[1.02] group-hover:opacity-0 md:rounded-[22px]"
                    />
                    <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(11,12,14,0.16)_0%,rgba(11,12,14,0.18)_26%,rgba(11,12,14,0.36)_52%,rgba(11,12,14,0.72)_100%)] md:hidden" />
                    <div className="absolute inset-x-0 bottom-0 z-[3] px-6 pb-10 pt-12 text-white md:hidden">
                      <h3 className="max-w-[12ch] text-[clamp(1.9rem,7.2vw,3rem)] uppercase leading-[0.88] tracking-[-0.03em] [font-family:'Cormorant_Garamond',serif]">
                        {service.title}
                      </h3>
                      <p className="mt-4 max-w-[78%] text-[clamp(1.14rem,4.2vw,1.38rem)] leading-[1.12] tracking-[-0.01em] text-white/92 [font-family:'Cormorant_Garamond',serif]">
                        {service.text}
                      </p>
                    </div>
                  </div>
                </div>
                <h3 className="mt-8 hidden max-w-[280px] text-[clamp(22px,1.6vw+16px,38px)] font-semibold uppercase leading-[1.06] transition-colors duration-300 group-hover:text-[#8f6c38] md:block [font-family:'Cormorant_Garamond',serif]">
                  {service.title}
                </h3>
                <p className="mt-6 hidden max-w-[340px] flex-1 text-[clamp(14px,0.6vw+12px,20px)] leading-[1.55] text-[#2f2f2c] md:block [font-family:'Cormorant_Garamond',serif]">{service.text}</p>
                <div className="relative z-20 mt-5 flex items-center justify-center gap-8 px-4 text-[clamp(12px,0.45vw+10px,16px)] uppercase tracking-[1.2px] [font-family:'JetBrains_Mono',monospace] md:mt-auto md:justify-between md:gap-4 md:px-0 md:pt-8 md:pr-4">
                  <a href="/checkout" className="inline-flex h-11 min-w-[132px] items-center justify-center bg-[#050505] px-5 text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#1f1f1f] xl:h-12 xl:min-w-[164px] xl:px-7">заказать</a>
                  <a href={serviceHrefByTitle[service.title] ?? "/services"} className="inline-flex items-center text-[#2d2d29] transition-colors duration-300 hover:text-[#8f6c38] xl:text-[17px] 2xl:text-[18px]">подробнее</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="px-3 py-14 sm:px-5 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Любая задача в 4 этапа</h2>
          <div className="mt-10 grid justify-items-center gap-8 sm:mt-12 sm:grid-cols-2 sm:justify-items-stretch sm:gap-x-8 sm:gap-y-10 xl:grid-cols-4 xl:gap-12">
            {steps.map(([image, title, text]) => (
              <article key={title} className="max-w-[320px] text-center transition duration-500 ease-out hover:-translate-y-1 sm:max-w-none sm:text-left">
                <img src={image} alt="" loading="lazy" decoding="async" width="48" height="48" className="mx-auto h-11 w-11 object-contain transition duration-300 ease-out hover:scale-110 sm:mx-0 sm:h-12 sm:w-12" />
                <h3 className="mt-4 text-[clamp(20px,1.1vw+16px,32px)] leading-none [font-family:'Cormorant_Garamond',serif]">{title}</h3>
                <p className="mt-2 text-[clamp(14px,0.55vw+12px,19px)] leading-[1.6] text-[#2f2f2c]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="px-3 py-16 sm:px-5 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[clamp(32px,3vw,60px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Новостной блог</h2>
            <a href="/news" className="pb-2 text-[clamp(12px,0.45vw+10px,17px)] uppercase tracking-[1.2px] text-[#2f2f2c] [font-family:'JetBrains_Mono',monospace]">Все новости</a>
          </div>
          <div className="mt-12 space-y-6 xl:space-y-8">
            <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
              {blogTopRow.map((article, index) =>
                renderBlogCard(
                  article,
                  index === 0,
                  index === 0 ? "aspect-[16/9] md:h-[420px] md:aspect-auto" : "aspect-[4/3] md:h-[420px] md:aspect-auto",
                  "md:h-[196px] 2xl:h-[212px]",
                ),
              )}
            </div>
            <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
              {blogBottomRow.map((article, index) =>
                renderBlogCard(
                  article,
                  index === 1,
                  index === 1 ? "aspect-[16/9] md:h-[360px] md:aspect-auto" : "aspect-[4/3] md:h-[360px] md:aspect-auto",
                  "md:h-[196px] 2xl:h-[212px]",
                ),
              )}
            </div>
          </div>
        </div>
      </section>

        <section className="px-3 py-14 sm:px-5 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Мнения клиентов</h2>
          <div className="mt-10 grid gap-10 sm:mt-12 xl:grid-cols-2 xl:gap-x-28 xl:gap-y-12">
            {reviews.map(([avatar, text, author, role]) => (
              <article key={author as string} className="grid gap-6 lg:gap-8">
                <p className="max-w-[620px] text-[clamp(24px,1.1vw+15px,44px)] leading-[1.28] italic tracking-[0.01em] text-[#1c1c19] [font-family:'Cormorant_Garamond',serif]">
                  {text}
                </p>
                <footer className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 md:gap-6 lg:justify-start lg:gap-8 xl:gap-10">
                  <div className="flex min-w-0 items-center gap-3 md:gap-4">
                    <img src={avatar as string} alt={author as string} loading="lazy" decoding="async" width="120" height="120" className="h-11 w-11 rounded-full object-cover" />
                    <div className="min-w-0">
                      <strong className="block text-[clamp(26px,0.85vw+16px,38px)] leading-[1.04] tracking-[0.005em] [font-family:'Cormorant_Garamond',serif]">{author}</strong>
                      <span className="block text-[clamp(20px,0.7vw+13px,30px)] leading-[1.1] text-[#5f5f5b] [font-family:'Cormorant_Garamond',serif]">{role}</span>
                    </div>
                  </div>
                  <a href="/about" className="inline-flex h-10 w-fit shrink-0 items-center justify-center self-start bg-[#1a1a1a] px-5 text-[clamp(12px,0.45vw+10px,16px)] uppercase tracking-[1.2px] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#2b2b2b] sm:self-center xl:h-11 xl:px-6 2xl:h-12 2xl:px-7 [font-family:'JetBrains_Mono',monospace]">
                    отзыв
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </div>
        </section>

        <section id="contact" className="bg-white px-3 py-18 sm:px-5 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 border-b border-[#e8e3db] pb-16 xl:grid-cols-[minmax(460px,560px)_minmax(0,1fr)] xl:gap-20 2xl:max-w-[1860px]">
          <div>
            <h2 className="max-w-[10ch] text-[clamp(40px,3.6vw,96px)] leading-[0.92] [font-family:'Cormorant_Garamond',serif] xl:max-w-[11ch]">Бесплатная консультация</h2>
            <div className="mt-8 space-y-8">
              <div>
                <p className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Офис</p>
                <p className="mt-3 text-[clamp(16px,0.9vw+12px,22px)] leading-8 text-[#111]">г. Москва, Калужская, 12</p>
              </div>
              <div>
                <p className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Запросы</p>
                <address className="mt-3 not-italic text-[clamp(16px,0.9vw+12px,22px)] leading-8 text-[#111]">
                  concierge@aeris-climate.com
                  <br />
                  +7 999 200 40 00
                </address>
              </div>
            </div>
          </div>

          <form className="grid max-w-[820px] gap-5 2xl:max-w-none 2xl:grid-cols-2 xl:gap-x-6">
            <label className="grid gap-2">
              <span className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Имя</span>
              <input
                className="h-20 border border-[#e5e3df] bg-[#fbfaf8] px-6 text-[clamp(18px,1.1vw+14px,30px)] text-[#6b6b67] [font-family:'Liberation_Sans',Manrope,sans-serif] xl:h-[5.5rem] 2xl:h-24"
                type="text"
                name="name"
                required
                placeholder="Ваше имя"
              />
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
                <select className="h-20 w-full appearance-none border border-[#e5e3df] bg-[#fbfaf8] px-6 pr-20 text-[clamp(18px,1.1vw+14px,30px)] text-[#181816] [font-family:'Cormorant_Garamond',serif] xl:h-[5.5rem] 2xl:h-24" defaultValue="" name="projectType" required>
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
            <button className="inline-flex h-20 items-center justify-center bg-[#1a1a1a] px-10 text-[clamp(14px,0.7vw+12px,20px)] uppercase tracking-[1.6px] text-white xl:h-[5.5rem] xl:px-12 2xl:h-24 2xl:px-14 [font-family:'JetBrains_Mono',monospace]" type="submit">
              оставить заявку
            </button>
            <span className="self-center text-[clamp(13px,0.55vw+11px,18px)] uppercase tracking-[1.4px] text-[#8a8a86] [font-family:'JetBrains_Mono',monospace]">
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
