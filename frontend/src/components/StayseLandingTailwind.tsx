import { Suspense, lazy, useEffect, useRef, useState } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ServiceOrderModal from "./ServiceOrderModal";

const LazyHeroDesktopModel = lazy(() => import("./HeroDesktopModel"));
const PRELOADER_TEXT = "подготавливаем каталог и инженерные решения";

function HomePagePreloader({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[260] flex items-center justify-center overflow-hidden bg-[#e1ddd6] transition-[opacity,visibility] duration-700 ease-out ${
        visible ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.55)_0%,rgba(225,221,214,0.82)_34%,rgba(225,221,214,1)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-black/8" />
      <div className="relative flex w-full max-w-[920px] flex-col items-center justify-center gap-8 px-6 text-center md:gap-10">
        <img
          src="/logo.png"
          alt="Climatrade"
          width="320"
          height="86"
          className="h-auto w-[min(64vw,320px)] object-contain opacity-90"
        />
        <div className="flex flex-wrap items-center justify-center gap-y-2 text-[11px] uppercase tracking-[0.28em] text-[#6f685d] md:text-[13px] [font-family:'JetBrains_Mono',monospace]">
          {PRELOADER_TEXT.split("").map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="inline-block animate-[preloaderLetterIn_1.8s_ease-in-out_infinite]"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    mobileLines: ["на объектах", "высокого класса"],
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
  { path: "/image/clear_logo/burger-king.png", alt: "Burger King" },
  { path: "/image/clear_logo/KFC.png", alt: "KFC" },
  { path: "/image/clear_logo/papa-johns.png", alt: "Papa Johns" },
  { path: "/image/clear_logo/vanwok.png", alt: "Vanwok" },
  { path: "/image/clear_logo/kabuki.png", alt: "Kabuki" },
  { path: "/image/clear_logo/bowl-room.png", alt: "Bowl Room" },
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
    publishedAt: "2026-04-20T11:30:00+03:00",
  },
  {
    image: "/image/news-2.png",
    title: "Сервис и контроль системы после запуска",
    text: "Что важно предусмотреть заранее, чтобы климатическая система не требовала постоянного внимания.",
    publishedAt: "2026-04-20T11:05:00+03:00",
  },
  {
    image: "/image/news-3.png",
    title: "Что нужно знать про VRF-решения",
    text: "Коротко о сценариях применения и тонкостях подбора для объектов разного масштаба.",
    publishedAt: "2026-04-20T10:20:00+03:00",
  },
  {
    image: "/image/news-4.png",
    title: "Надёжность как главный критерий премиальной инженерии",
    text: "Почему стабильная работа системы важнее перегруженного набора характеристик в спецификации.",
    publishedAt: "2026-04-20T09:15:00+03:00",
  },
];

const clampTextStyle = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
  }) as const;

const formatRelativePublication = (value: string, nowTimestamp: number | null) => {
  if (nowTimestamp === null) return "недавно";

  const diffMs = nowTimestamp - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "только что";
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? "минуту" : diffMinutes < 5 ? "минуты" : "минут"} назад`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"} назад`;
};

const reviews = [
  {
    rating: 5,
    text: "Инженерную систему для бутика собрали очень аккуратно: воздух ровный, техника не шумит, архитектура пространства не пострадала. Получили именно премиальное ощущение, а не набор оборудования.",
    company: 'ООО "Архитект Дизайн"',
    meta: "частный интерьерный проект",
  },
  {
    rating: 5,
    text: "Процесс был понятный от первой диагностики до запуска. Команда взяла на себя согласование, настройку и проверку режимов, поэтому объект вошёл в эксплуатацию без нервов и переделок.",
    company: 'ООО "Ритейл-Плюс"',
    meta: "коммерческий объект",
  },
  {
    rating: 5,
    text: "Для ресторана критично было убрать лишний шум и сохранить стабильный климат в зале и на кухне. Система работает спокойно, персонал не отвлекается, а гости это просто не замечают.",
    company: 'ООО "Гастро Групп"',
    meta: "ресторанный проект",
  },
  {
    rating: 5,
    text: "Понравилось, что инженерию не навязывали, а подстраивали под архитектуру. Все решения объясняли по-человечески, а после запуска оставили понятное сопровождение и контрольные точки.",
    company: 'ООО "Премиум Девелопмент"',
    meta: "объект высокого класса",
  },
  {
    rating: 5,
    text: "После запуска не осталось ощущения, что систему нужно постоянно контролировать. Температура стабильная, сервис реагирует быстро, а само решение работает спокойно и предсказуемо.",
    company: 'ООО "Городская Среда"',
    meta: "проект mixed-use формата",
  },
  {
    rating: 5,
    text: "Для нас было важно, чтобы инженерию встроили деликатно и без визуального шума. Команда аккуратно прошла все этапы, а объект сдали без лишних согласований и доработок.",
    company: 'ООО "Статус Концепт"',
    meta: "приватный объект",
  },
] as const;

export function StayseLandingTailwind() {
  const [animatedStats, setAnimatedStats] = useState([0, 1]);
  const [heroStatsVisible, setHeroStatsVisible] = useState(false);
  const reviewsTrackRef = useRef<HTMLDivElement | null>(null);
  const mobileReviewsFirstEnteringRef = useRef<HTMLElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const [mobileReviewsVisible, setMobileReviewsVisible] = useState(3);
  const [mobileReviewsEnteringFrom, setMobileReviewsEnteringFrom] = useState<number | null>(null);
  const [showHeroModel, setShowHeroModel] = useState(false);
  const [heroModelReady, setHeroModelReady] = useState(false);
  const [preloaderVisible, setPreloaderVisible] = useState(true);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number | null>(null);
  const preloaderDismissedRef = useRef(false);

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
    setNowTimestamp(Date.now());
  }, []);

  useEffect(() => {
    if (!preloaderVisible) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [preloaderVisible]);

  useEffect(() => {
    if (!consultationModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConsultationModalOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [consultationModalOpen]);

  useEffect(() => {
    if (mobileReviewsEnteringFrom === null) return;

    const scrollFrameId = window.requestAnimationFrame(() => {
      mobileReviewsFirstEnteringRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    const timeoutId = window.setTimeout(() => {
      setMobileReviewsEnteringFrom(null);
    }, 650);

    return () => {
      window.cancelAnimationFrame(scrollFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [mobileReviewsEnteringFrom]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      preloaderDismissedRef.current = true;
      setPreloaderVisible(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia("(min-width: 1280px)");
    const heroSection = heroSectionRef.current;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const scheduleModelMount = () => {
      if (!mediaQueryList.matches || !heroSection) {
        setShowHeroModel(false);
        setHeroModelReady(true);
        return;
      }

      const mount = () => setShowHeroModel(true);
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(mount, { timeout: 1200 });
        return;
      }

      timeoutId = window.setTimeout(mount, 180);
    };

    const cancelScheduledMount = () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      idleId = null;
      timeoutId = null;
    };

    const update = () => {
      cancelScheduledMount();

      if (!mediaQueryList.matches || !heroSection) {
        setShowHeroModel(false);
        return;
      }

      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) {
            setShowHeroModel(false);
            return;
          }

          scheduleModelMount();
        },
        { rootMargin: "160px 0px" },
      );

      intersectionObserver.observe(heroSection);
    };

    update();

    if ("addEventListener" in mediaQueryList) {
      mediaQueryList.addEventListener("change", update);
      return () => {
        mediaQueryList.removeEventListener("change", update);
        intersectionObserver?.disconnect();
        cancelScheduledMount();
      };
    }

    mediaQueryList.addListener(update);
    return () => {
      mediaQueryList.removeListener(update);
      intersectionObserver?.disconnect();
      cancelScheduledMount();
    };
  }, []);

  useEffect(() => {
    if (!heroModelReady) return;
    if (preloaderDismissedRef.current) return;

    const timeoutId = window.setTimeout(() => {
      preloaderDismissedRef.current = true;
      setPreloaderVisible(false);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [heroModelReady]);

  const scrollReviews = (direction: "prev" | "next") => {
    const track = reviewsTrackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-review-card]");
    const cardWidth = firstCard?.offsetWidth ?? 420;
    const gap = 24;
    track.scrollBy({
      left: direction === "next" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  };
  const blogTopRow = blog.slice(0, 2);
  const blogBottomRow = blog.slice(2, 4);
  const mobileBlogLead = blog[0];
  const mobileBlogMiddle = blog.slice(1, 3);
  const mobileBlogTail = blog[3];
  const handleConsultationSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    form.reset();
    setConsultationModalOpen(true);
  };

  const renderBlogCard = (article: (typeof blog)[number], isWide: boolean, imageClassName: string, contentClassName: string) => (
    <article
      key={article.title}
      className={`group relative flex h-full flex-col overflow-hidden border border-[#ddd6cc] bg-white transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${isWide ? "md:col-span-8" : "md:col-span-4"}`}
    >
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
      <div className={`flex h-full flex-col border-t border-[#ddd6cc] bg-[#e1ddd6] px-5 py-4 md:px-6 md:py-5 ${contentClassName}`}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 md:gap-5">
          <h3
            className="max-w-none pr-2 text-[clamp(24px,1.55vw,42px)] font-semibold leading-[0.9] tracking-[-0.03em] text-[#0d0d0b] [font-family:'Cormorant_Garamond',serif]"
            style={clampTextStyle(2)}
          >
            {article.title}
          </h3>
          <span className="shrink-0 pt-1 text-[clamp(12px,0.55vw+10px,17px)] leading-none text-[#9a9891]">
            {formatRelativePublication(article.publishedAt, nowTimestamp)}
          </span>
        </div>
        <p
          className="mt-4 max-w-[34ch] text-[clamp(15px,0.5vw+13px,21px)] leading-[1.28] text-[#30302c] md:max-w-[52ch]"
          style={clampTextStyle(isWide ? 2 : 3)}
        >
          {article.text}
        </p>
        <div className="mt-auto flex justify-end pt-5">
          <span className="inline-flex h-12 min-w-[144px] items-center justify-center bg-[#1a1a1a] px-8 text-[clamp(12px,0.4vw+10px,14px)] uppercase tracking-[1.2px] text-white [font-family:'JetBrains_Mono',monospace]">
            читать
          </span>
        </div>
      </div>
    </article>
  );
  const renderMobileBlogCard = (article: (typeof blog)[number], isWide: boolean) => (
    <article
      key={`${article.title}-${isWide ? "wide" : "narrow"}`}
      className={`group relative flex h-full flex-col overflow-hidden border border-[#ddd6cc] bg-white transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${
        isWide ? "" : "min-w-0"
      }`}
    >
      <a href="/news" aria-label={`Открыть новость: ${article.title}`} className="absolute inset-0 z-10" />
      <img
        src={article.image}
        alt=""
        loading="lazy"
        decoding="async"
        width="1200"
        height="760"
        className={`w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025] ${
          isWide ? "aspect-[16/7.7]" : "aspect-[4/3.2]"
        }`}
      />
      <div className={`flex h-full flex-col border-t border-[#ddd6cc] bg-[#e1ddd6] ${isWide ? "px-4 py-3" : "px-3 py-3"}`}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3
            className={`max-w-none pr-2 font-semibold leading-[0.92] tracking-[-0.03em] text-[#0d0d0b] [font-family:'Cormorant_Garamond',serif] ${
              isWide ? "text-[clamp(22px,5.6vw,32px)]" : "text-[clamp(18px,4.6vw,24px)]"
            }`}
            style={clampTextStyle(isWide ? 2 : 3)}
          >
            {article.title}
          </h3>
          <span className="shrink-0 pt-1 text-[12px] leading-none text-[#9a9891]">
            {formatRelativePublication(article.publishedAt, nowTimestamp)}
          </span>
        </div>
        <div className="mt-4 flex justify-end">
          <span
            className={`inline-flex items-center justify-center bg-[#1a1a1a] text-[11px] uppercase tracking-[1.2px] text-white [font-family:'JetBrains_Mono',monospace] ${
              isWide ? "h-11 min-w-[132px] px-6" : "h-10 min-w-[112px] px-4"
            }`}
          >
            читать
          </span>
        </div>
      </div>
    </article>
  );

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#0f0f0e] [font-family:Manrope,'Liberation_Sans',sans-serif]">
      <div
        aria-hidden={!consultationModalOpen}
        className={`fixed inset-0 z-[280] flex items-center justify-center px-4 transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          consultationModalOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Закрыть сообщение"
          onClick={() => setConsultationModalOpen(false)}
          className="absolute inset-0 bg-[rgba(16,15,13,0.38)] backdrop-blur-[10px]"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consultation-success-title"
          className={`relative z-[1] w-full max-w-[560px] overflow-hidden rounded-[32px] border border-[#ddd1bf] bg-[linear-gradient(180deg,#fffdfa_0%,#f2ece4_100%)] px-7 py-8 text-center shadow-[0_36px_90px_rgba(0,0,0,0.2)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-10 md:py-10 ${
            consultationModalOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-[0.96] opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-[16%] top-[-16%] h-44 rounded-full bg-[#d5ab5d]/18 blur-[75px]" />
          <div className="pointer-events-none absolute bottom-[-18%] right-[-8%] h-40 w-40 rounded-full bg-white/70 blur-[90px]" />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#dcc8aa] bg-white/78 shadow-[0_12px_26px_rgba(145,122,81,0.12)] md:h-20 md:w-20">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#8c6732] md:h-10 md:w-10" aria-hidden="true">
              <path d="M5 12.5 9.2 16.7 19 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="relative mt-6 text-[12px] uppercase tracking-[0.34em] text-[#8f887c] [font-family:'JetBrains_Mono',monospace]">
            заявка отправлена
          </p>
          <h3
            id="consultation-success-title"
            className="relative mt-4 text-[clamp(32px,2.2vw,48px)] leading-[0.94] text-[#171511] [font-family:'Cormorant_Garamond',serif]"
          >
            Спасибо за отзыв
          </h3>
          <p className="relative mt-4 text-[clamp(16px,0.8vw+13px,22px)] leading-[1.55] text-[#4d473f]">
            В ближайшее время свяжемся с вами и уточним детали заявки.
          </p>
          <button
            type="button"
            onClick={() => setConsultationModalOpen(false)}
            className="relative mt-8 inline-flex h-14 min-w-[220px] items-center justify-center rounded-[18px] bg-[#111] px-8 text-[13px] uppercase tracking-[0.28em] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#25211b] md:h-16 md:min-w-[240px]"
          >
            закрыть
          </button>
        </div>
      </div>
      <HomePagePreloader visible={preloaderVisible} />
      <div className="flex-1">
        <SiteHeader />

        <section id="hero" ref={heroSectionRef} className="hero">
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
                    <LazyHeroDesktopModel onReady={() => setHeroModelReady(true)} />
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
                  className="inline-flex min-h-[78px] w-full items-center justify-center self-start rounded-[24px] border border-[#e7ddd0] bg-[linear-gradient(180deg,#fffdfa_0%,#f3eee7_100%)] px-8 text-center text-[clamp(18px,1vw+14px,28px)] font-semibold leading-none tracking-[-0.01em] text-[#141310] shadow-[0_16px_36px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.92)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#dbc9aa] hover:bg-[linear-gradient(180deg,#fffefc_0%,#f7f1e7_100%)] hover:shadow-[0_24px_44px_rgba(0,0,0,0.18)] sm:min-h-[92px] sm:w-[320px] sm:self-end"
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

            <div className="mt-5 bg-white/98 px-0 py-3 xl:py-4 2xl:mt-12">
              <div className="xl:max-w-none">
                <div className="sm:hidden">
                  <div className="space-y-2 overflow-hidden">
                    <div className="flex w-max gap-2">
                      {trustLogoTopRow.map(({ path, alt }, index) => (
                        <article
                          key={`${path}-${index}`}
                          className="flex h-[94px] w-[calc((100vw-8px)/2)] min-w-0 shrink-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3"
                        >
                          <div className="flex h-[clamp(52px,9vw,74px)] w-full items-center justify-center">
                            <img
                              src={path}
                              alt={alt}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-auto max-w-[clamp(150px,38vw,220px)] object-contain object-center"
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="flex w-max gap-2">
                      {trustLogoBottomRow.map(({ path, alt }, index) => (
                        <article
                          key={`${path}-${index}`}
                          className="flex h-[94px] w-[calc((100vw-8px)/2)] min-w-0 shrink-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3"
                        >
                          <div className="flex h-[clamp(52px,9vw,74px)] w-full items-center justify-center">
                            <img
                              src={path}
                              alt={alt}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-auto max-w-[clamp(150px,38vw,220px)] object-contain object-center"
                            />
                          </div>
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
                          <div className="flex h-[clamp(58px,6vw,82px)] w-full items-center justify-center">
                            <img
                              src={path}
                              alt={alt}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-auto max-w-[clamp(172px,16vw,248px)] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)]"
                            />
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:mx-auto sm:w-[86%]">
                      {trustLogoBottomRow.map(({ path, alt }) => (
                        <article
                          key={path}
                          className="group flex min-h-[112px] items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)]"
                        >
                          <div className="flex h-[clamp(58px,6vw,82px)] w-full items-center justify-center">
                            <img
                              src={path}
                              alt={alt}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-auto max-w-[clamp(172px,16vw,248px)] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)]"
                            />
                          </div>
                        </article>
                      ))}
                    </div>

                  </div>
                </div>

                <div className="hidden space-y-3 xl:block 2xl:space-y-4">
                  <div className="grid grid-cols-7 gap-3 2xl:gap-4">
                    {trustLogoDesktopTopRow.map(({ path, alt }, index) => (
                      <article
                        key={`${path}-${index}`}
                        className="group flex h-[112px] min-w-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)] 2xl:h-[118px] 2xl:px-5"
                      >
                        <div className="flex h-[clamp(62px,4.6vw,90px)] w-full items-center justify-center">
                          <img
                            src={path}
                            alt={alt}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-auto max-w-[clamp(180px,11vw,250px)] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)]"
                          />
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mx-auto grid w-[calc(100%-96px)] grid-cols-6 gap-3 2xl:w-[calc(100%-120px)] 2xl:gap-4">
                    {trustLogoDesktopBottomRow.map(({ path, alt }, index) => (
                      <article
                        key={`${path}-${index}`}
                        className="group flex h-[112px] min-w-0 items-center justify-center rounded-[18px] border border-[#f1eee8] bg-white px-4 py-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e1d3bb] hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)] 2xl:h-[118px] 2xl:px-5"
                      >
                        <div className="flex h-[clamp(62px,4.6vw,90px)] w-full items-center justify-center">
                          <img
                            src={path}
                            alt={alt}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-auto max-w-[clamp(180px,11vw,250px)] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.06] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.06)]"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 mb-8 px-3 sm:hidden">
              <a
                href="/about"
                className="group relative flex min-h-[108px] w-full items-center justify-between overflow-hidden rounded-[18px] border border-[#e3dbcf] bg-[linear-gradient(180deg,#fbf8f3_0%,#f0e9e0_100%)] px-6 py-5 text-[#12120f] shadow-[0_18px_32px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
              >
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/75 blur-[28px]" />
                <div className="relative flex min-w-0 flex-col items-start text-left">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#8f8578] [font-family:'JetBrains_Mono',monospace]">
                    о компании
                  </span>
                  <span className="mt-2 text-[clamp(30px,8vw,38px)] leading-[0.92] tracking-[-0.03em] [font-family:'Cormorant_Garamond',serif]">
                    Больше о нас
                  </span>
                </div>
                <span className="relative ml-4 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-[#d9cfbf] bg-white/80 shadow-[0_10px_22px_rgba(0,0,0,0.08)] transition duration-300 group-hover:translate-x-1">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#12120f]" aria-hidden="true">
                    <path d="M6 12h12M13 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
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
                <div className="relative w-full overflow-hidden rounded-none md:mx-auto md:w-full md:max-w-[460px] md:rounded-[22px] xl:max-w-[480px] 2xl:max-w-[520px]">
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
                <div className="relative z-20 mt-5 flex items-center justify-center gap-8 px-4 text-[clamp(12px,0.45vw+10px,16px)] uppercase tracking-[1.2px] [font-family:'JetBrains_Mono',monospace] md:mt-auto md:justify-between md:gap-5 md:px-3 md:pt-8 xl:px-4 2xl:px-5">
                  <ServiceOrderModal
                    serviceTitle={service.title}
                    triggerClassName="inline-flex h-11 min-w-[132px] items-center justify-center bg-[#050505] px-5 text-[clamp(12px,0.45vw+10px,16px)] uppercase tracking-[1.2px] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#1f1f1f] [font-family:'JetBrains_Mono',monospace] xl:h-12 xl:min-w-[164px] xl:px-7"
                    trigger={<span className="translate-y-[0.04em] leading-none">заказать</span>}
                  />
                  <a href={serviceHrefByTitle[service.title] ?? "/services"} className="inline-flex items-center text-[#2d2d29] transition-colors duration-300 hover:text-[#8f6c38] xl:text-[17px] 2xl:text-[18px]">подробнее</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="bg-[#0d0d0b] px-3 py-14 text-[#e1ddd6] sm:px-5 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] text-[#e1ddd6] [font-family:'Cormorant_Garamond',serif]">Любая задача в 4 этапа</h2>

          <div className="relative mt-9 space-y-4 md:hidden">
            <div className="pointer-events-none absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-[#242420]" />
            {steps.map(([image, title, text], index) => {
              const isRight = index % 2 === 1;

              return (
                <article
                  key={title}
                  className={`relative z-[1] w-[82%] rounded-[24px] border border-[#252520] bg-[#11110f] px-5 py-5 shadow-[0_16px_34px_rgba(0,0,0,0.28)] ${
                    isRight ? "ml-auto text-right" : "mr-auto text-left"
                  }`}
                >
                  <div className={`flex items-center gap-3 ${isRight ? "justify-end" : "justify-start"}`}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2d2c28] bg-[#0d0d0b]">
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width="44"
                        height="44"
                        className="h-7 w-7 object-contain opacity-90 [filter:brightness(0)_invert(92%)_sepia(7%)_saturate(172%)_hue-rotate(357deg)_brightness(96%)_contrast(90%)]"
                      />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#807d75] [font-family:'JetBrains_Mono',monospace]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[26px] leading-none text-[#e1ddd6] [font-family:'Cormorant_Garamond',serif]">
                    {title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.45] text-[#d6d2ca]">
                    {text}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 hidden justify-items-center gap-8 md:grid sm:mt-12 sm:grid-cols-2 sm:justify-items-stretch sm:gap-x-8 sm:gap-y-10 xl:grid-cols-4 xl:gap-12">
            {steps.map(([image, title, text]) => (
              <article key={title} className="max-w-[320px] text-center transition duration-500 ease-out hover:-translate-y-1 sm:max-w-none sm:text-left">
                <img src={image} alt="" loading="lazy" decoding="async" width="48" height="48" className="mx-auto h-11 w-11 object-contain opacity-90 transition duration-300 ease-out hover:scale-110 sm:mx-0 sm:h-12 sm:w-12 [filter:brightness(0)_invert(92%)_sepia(7%)_saturate(172%)_hue-rotate(357deg)_brightness(96%)_contrast(90%)]" />
                <h3 className="mt-4 text-[clamp(20px,1.1vw+16px,32px)] leading-none text-[#e1ddd6] [font-family:'Cormorant_Garamond',serif]">{title}</h3>
                <p className="mt-2 text-[clamp(14px,0.55vw+12px,19px)] leading-[1.6] text-[#e1ddd6]">{text}</p>
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
            <div className="space-y-4 md:hidden">
              {mobileBlogLead ? renderMobileBlogCard(mobileBlogLead, true) : null}
              <div className="grid grid-cols-2 gap-4">
                {mobileBlogMiddle.map((article) => renderMobileBlogCard(article, false))}
              </div>
              {mobileBlogTail ? renderMobileBlogCard(mobileBlogTail, true) : null}
            </div>

            <div className="hidden gap-6 md:grid lg:grid-cols-12 xl:gap-8">
              {blogTopRow.map((article, index) =>
                renderBlogCard(
                  article,
                  index === 0,
                  index === 0 ? "aspect-[16/9] md:h-[300px] md:aspect-auto" : "aspect-[4/3] md:h-[300px] md:aspect-auto",
                  "min-h-[180px] md:min-h-[188px]",
                ),
              )}
            </div>
            <div className="hidden gap-6 md:grid lg:grid-cols-12 xl:gap-8">
              {blogBottomRow.map((article, index) =>
                renderBlogCard(
                  article,
                  index === 1,
                  index === 1 ? "aspect-[16/9] md:h-[260px] md:aspect-auto" : "aspect-[4/3] md:h-[260px] md:aspect-auto",
                  "min-h-[180px] md:min-h-[188px]",
                ),
              )}
            </div>
          </div>
        </div>
      </section>

        <section className="relative overflow-hidden bg-[#0d0d0b] px-3 py-12 sm:px-4 md:px-6 lg:px-8 md:py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8%] top-[14%] h-[280px] w-[280px] rounded-full bg-[#d4a24d]/10 blur-[120px]" />
            <div className="absolute right-[-6%] bottom-[8%] h-[320px] w-[320px] rounded-full bg-white/6 blur-[140px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
          </div>
          <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] text-[#e1ddd6] [font-family:'Cormorant_Garamond',serif]">Мнения клиентов</h2>
            </div>

            <div className="mt-8 space-y-5 md:hidden">
              {reviews.slice(0, mobileReviewsVisible).map((review, index) => {
                const isEntering =
                  mobileReviewsEnteringFrom !== null && index >= mobileReviewsEnteringFrom;

                return (
                <article
                  key={`mobile-${review.company}`}
                  ref={(node) => {
                    if (isEntering && index === mobileReviewsEnteringFrom) {
                      mobileReviewsFirstEnteringRef.current = node;
                    }
                  }}
                  className={`relative overflow-hidden rounded-[30px] border border-[#d7cec1] bg-[linear-gradient(180deg,#f8f4ee_0%,#efe9e0_100%)] px-5 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.14)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isEntering ? "translate-y-4 opacity-0 animate-[mobileReviewReveal_560ms_cubic-bezier(0.22,1,0.36,1)_forwards]" : "translate-y-0 opacity-100"
                  }`}
                  style={
                    isEntering
                      ? { animationDelay: `${(index - mobileReviewsEnteringFrom) * 90}ms` }
                      : undefined
                  }
                >
                  <div className="pointer-events-none absolute right-[-16px] top-[-22px] text-[84px] leading-none text-[#b9ae9e]/20 [font-family:'Cormorant_Garamond',serif]">
                    ”
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-1 rounded-full border border-[#d8c5aa] bg-white/72 px-3 py-2 shadow-[0_8px_20px_rgba(135,116,78,0.08)]">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <span key={`${review.company}-mobile-${index}`} className="text-[18px] leading-none text-[#f3b23a] drop-shadow-[0_0_10px_rgba(243,178,58,0.16)]">★</span>
                      ))}
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-[#8a8175] [font-family:'JetBrains_Mono',monospace]">
                      verified review
                    </span>
                  </div>
                  <p className="mt-6 text-[17px] leading-[1.56] text-[#25231e]">
                    {review.text}
                  </p>
                  <div className="mt-6 border-t border-[#d8d0c4] pt-5">
                    <strong className="block text-[20px] font-semibold leading-[1.08] text-[#171511] [font-family:'Cormorant_Garamond',serif]">
                      {review.company}
                    </strong>
                    <span className="mt-2 block text-[12px] uppercase tracking-[0.16em] leading-[1.45] text-[#7c7469] [font-family:'JetBrains_Mono',monospace]">
                      {review.meta}
                    </span>
                  </div>
                </article>
                );
              })}

              {mobileReviewsVisible < reviews.length ? (
                <button
                  type="button"
                  onClick={() =>
                    setMobileReviewsVisible((current) => {
                      const next = Math.min(current + 3, reviews.length);
                      if (next > current) {
                        setMobileReviewsEnteringFrom(current);
                      }
                      return next;
                    })
                  }
                  className="flex h-14 w-full items-center justify-center rounded-[20px] border border-[#2d2a24] bg-[#161513] text-[12px] uppercase tracking-[0.28em] text-[#ece5db] transition hover:border-[#53483a] hover:bg-[#1d1b18]"
                >
                  Загрузить ещё
                </button>
              ) : null}
            </div>

            <div
              ref={reviewsTrackRef}
              className="mt-8 hidden snap-x snap-mandatory gap-5 overflow-x-auto pt-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:ml-[calc(50%-50vw)] md:mr-[calc(50%-50vw)] md:flex [&::-webkit-scrollbar]:hidden md:mt-10 md:gap-6"
            >
              {reviews.map((review) => (
                <article
                  key={review.company}
                  data-review-card
                  className="group relative flex min-h-[292px] w-[min(82vw,520px)] shrink-0 snap-start flex-col overflow-hidden rounded-[30px] border border-[#d7cec1] bg-[linear-gradient(180deg,#f8f4ee_0%,#efe9e0_100%)] px-6 py-6 shadow-[0_20px_44px_rgba(0,0,0,0.14)] transition duration-500 ease-out hover:-translate-y-1 hover:border-[#cbb79b] hover:shadow-[0_28px_60px_rgba(0,0,0,0.18)] md:min-h-[312px] md:w-[min(37vw,520px)] md:px-7 md:py-7"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-10%] top-[-10%] h-32 w-32 rounded-full bg-[#d5a44e]/12 blur-[70px] transition duration-500 group-hover:bg-[#d5a44e]/18" />
                    <div className="absolute right-[-8%] bottom-[-16%] h-40 w-40 rounded-full bg-white/55 blur-[90px]" />
                    <div className="absolute right-6 top-3 text-[120px] leading-none text-[#b9ae9e]/22 [font-family:'Cormorant_Garamond',serif]">
                      ”
                    </div>
                  </div>
                  <div className="relative z-[1] flex items-center gap-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d8c5aa] bg-white/72 px-3 py-2 shadow-[0_8px_20px_rgba(135,116,78,0.08)]">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <span key={`${review.company}-${index}`} className="text-[22px] leading-none text-[#f3b23a] drop-shadow-[0_0_12px_rgba(243,178,58,0.18)]">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="relative z-[1] mt-6 text-[clamp(19px,0.75vw+14px,27px)] leading-[1.5] text-[#25231e]">
                    {review.text}
                  </p>
                  <div className="relative z-[1] mt-auto border-t border-[#d8d0c4] pt-5">
                    <strong className="block text-[clamp(24px,0.8vw+17px,34px)] font-semibold leading-[1.02] text-[#171511] [font-family:'Cormorant_Garamond',serif]">
                      {review.company}
                    </strong>
                    <span className="mt-2 block text-[clamp(12px,0.28vw+11px,15px)] uppercase tracking-[0.18em] leading-[1.45] text-[#7c7469] [font-family:'JetBrains_Mono',monospace]">
                      {review.meta}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-white px-3 pt-18 pb-8 sm:px-5 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 border-b border-[#e8e3db] pb-8 md:pb-16 xl:grid-cols-[minmax(460px,560px)_minmax(0,1fr)] xl:gap-20 2xl:max-w-[1860px]">
          <div className="grid gap-8 md:gap-10">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(132px,164px)] items-start gap-5 md:block">
              <h2 className="max-w-[6.2ch] text-[clamp(40px,3.6vw,96px)] leading-[0.92] [font-family:'Cormorant_Garamond',serif] md:max-w-[10ch] xl:max-w-[11ch]">
                Бесплатная консультация
              </h2>
              <div className="justify-self-end pt-3 text-right md:mt-8 md:justify-self-auto md:pt-0 md:text-left">
                <p className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Офис</p>
                <p className="mt-3 text-[clamp(15px,0.75vw+11px,22px)] leading-[1.45] text-[#111] md:leading-8">г. Москва, Калужская, 12</p>
              </div>
            </div>

            <div>
              <p className="text-[clamp(10px,0.38vw+9px,14px)] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Запросы</p>
              <address className="mt-3 not-italic text-[clamp(16px,0.9vw+12px,22px)] leading-[1.65] text-[#111] md:leading-8">
                concierge@aeris-climate.com
                <br />
                +7 999 200 40 00
              </address>
            </div>
          </div>

          <form onSubmit={handleConsultationSubmit} className="grid max-w-[820px] gap-5 2xl:max-w-none 2xl:grid-cols-2 xl:gap-x-6">
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
                <select
                  className="h-20 w-full appearance-none border border-[#e5e3df] bg-[#fbfaf8] px-6 pr-20 text-[clamp(16px,0.45vw+14px,22px)] text-[#181816] [font-family:'Liberation_Sans',Manrope,sans-serif] xl:h-[5.5rem] 2xl:h-24"
                  defaultValue=""
                  name="projectType"
                  required
                >
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
