import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { heroStats } from "../data/home";

const LazyHeroDesktopModel = lazy(() => import("./HeroDesktopModel"));
const PRELOADER_TEXT = "подготавливаем каталог и инженерные решения";

function HomePagePreloader({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[260] flex items-center justify-center overflow-hidden bg-[#e1ddd6] transition-[opacity,visibility] duration-700 ease-out ${visible ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.55)_0%,rgba(225,221,214,0.82)_34%,rgba(225,221,214,1)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-black/8" />
      <div className="relative flex w-full max-w-[920px] flex-col items-center justify-center gap-8 px-6 text-center md:gap-10">
        <img src="/logo.png" alt="Climatrade" width="320" height="86" className="h-auto w-[min(64vw,320px)] object-contain opacity-90" />
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

export default function HeroHomeIsland() {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const preloaderDismissedRef = useRef(false);
  const [animatedStats, setAnimatedStats] = useState<[number, number]>([0, 1]);
  const [heroStatsVisible, setHeroStatsVisible] = useState(false);
  const [showHeroModel, setShowHeroModel] = useState(false);
  const [heroModelReady, setHeroModelReady] = useState(false);
  const [preloaderVisible, setPreloaderVisible] = useState(true);

  useEffect(() => {
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
      }) as [number, number];

      setAnimatedStats(nextValues);
      if (nextValues[0] < targets[0] || nextValues[1] < targets[1]) frameId = window.requestAnimationFrame(tick);
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
    if (!preloaderVisible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [preloaderVisible]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      preloaderDismissedRef.current = true;
      setPreloaderVisible(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
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
      if (idleId !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      idleId = null;
      timeoutId = null;
    };

    const update = () => {
      cancelScheduledMount();
      if (!mediaQueryList.matches || !heroSection) {
        setShowHeroModel(false);
        return;
      }

      intersectionObserver?.disconnect();
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
    mediaQueryList.addEventListener("change", update);
    return () => {
      mediaQueryList.removeEventListener("change", update);
      intersectionObserver?.disconnect();
      cancelScheduledMount();
    };
  }, []);

  useEffect(() => {
    if (!heroModelReady || preloaderDismissedRef.current) return;
    const timeoutId = window.setTimeout(() => {
      preloaderDismissedRef.current = true;
      setPreloaderVisible(false);
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [heroModelReady]);

  return (
    <>
      <HomePagePreloader visible={preloaderVisible} />
      <section id="hero" ref={heroSectionRef} className="hero">
        <div className="hero__background" aria-hidden="true">
          <img src="/image/hero-menu.png" alt="" aria-hidden="true" loading="eager" decoding="async" fetchPriority="high" width="1280" height="6179" className="hero__bg hero__bg--mobile" />
          <img src="/image/hero-desktop-bg.jpeg" alt="" aria-hidden="true" loading="eager" decoding="async" width="1280" height="720" className="hero__bg hero__bg--desktop" />
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
                <a href="/services" className="hero__button hero__button--primary"><span className="translate-y-[0.04em] leading-none">услуги</span></a>
                <a href="/catalog" className="hero__button hero__button--secondary"><span className="translate-y-[0.04em] leading-none">каталог</span></a>
              </div>
            </div>
          </div>
          <div className="hero__achievements">
            <ul className="hero__stats">
              {heroStats.map(({ value, mobileLines, desktopLabel }, index) => (
                <li key={value} className={`hero__stat ${heroStatsVisible ? "is-visible" : ""}`} style={{ transitionDelay: `${index * 130}ms` }}>
                  <strong className="hero__stat-value">
                    {index === 0 ? `${animatedStats[0]}+` : index === 1 ? `${animatedStats[1]}+` : value}
                  </strong>
                  <div className="hero__stat-mobile-label">
                    {mobileLines.map((line) => <p key={line} className="hero__stat-mobile-line">{line}</p>)}
                  </div>
                  <span className="hero__stat-label">{desktopLabel}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
