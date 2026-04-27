import { useEffect, useRef, useState } from "react";
import { reviews } from "../data/home";

export default function HomeReviewsIsland() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isRevealActive, setIsRevealActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) {
      setIsRevealActive(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsRevealActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0d0d0b] px-3 py-12 sm:px-4 md:px-6 lg:px-8 md:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[14%] h-[280px] w-[280px] rounded-full bg-[#d4a24d]/10 blur-[120px]" />
        <div className="absolute right-[-6%] bottom-[8%] h-[320px] w-[320px] rounded-full bg-white/6 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>
      <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
        <h2 className="text-[clamp(32px,3.2vw,68px)] leading-[0.95] text-[#e1ddd6] [font-family:'Cormorant_Garamond',serif]">Мнения клиентов</h2>
        <div className="mt-8 overflow-hidden pt-2 pb-3 md:ml-[calc(50%-50vw)] md:mr-[calc(50%-50vw)] md:mt-10">
          <div className="flex w-max gap-5 md:gap-6 [will-change:transform] animate-[homeReviewsMarquee_28s_linear_infinite] motion-reduce:animate-[homeReviewsMarquee_60s_linear_infinite] hover:[animation-play-state:paused]">
            {[...reviews, ...reviews].map((review, index) => (
              <article
                key={`review-${review.company}-${index}`}
                className={`group relative flex min-h-[292px] w-[min(86vw,520px)] shrink-0 flex-col overflow-hidden rounded-[30px] border border-[#d7cec1] bg-[linear-gradient(180deg,#f8f4ee_0%,#efe9e0_100%)] px-6 py-6 shadow-[0_20px_44px_rgba(0,0,0,0.14)] transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#cbb79b] hover:shadow-[0_28px_60px_rgba(0,0,0,0.18)] md:min-h-[312px] md:w-[min(37vw,520px)] md:px-7 md:py-7 ${isRevealActive ? "opacity-100 translate-y-0 [filter:blur(0px)]" : "opacity-0 translate-y-4 [filter:blur(2px)]"}`}
              style={{ transitionDelay: `${(index % reviews.length) * 90}ms` }}
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[-10%] h-32 w-32 rounded-full bg-[#d5a44e]/12 blur-[70px]" />
                <div className="absolute right-[-8%] bottom-[-16%] h-40 w-40 rounded-full bg-white/55 blur-[90px]" />
                <div className="absolute right-6 top-3 text-[120px] leading-none text-[#b9ae9e]/22 [font-family:'Cormorant_Garamond',serif]">”</div>
              </div>
              <div className="relative z-[1] inline-flex w-fit items-center gap-1.5 rounded-full border border-[#d8c5aa] bg-white/72 px-3 py-2 shadow-[0_8px_20px_rgba(135,116,78,0.08)]">
                {Array.from({ length: review.rating }).map((_, starIndex) => <span key={`${review.company}-desktop-${starIndex}`} className="text-[22px] leading-none text-[#f3b23a]">★</span>)}
              </div>
              <p className="relative z-[1] mt-6 text-[clamp(19px,0.75vw+14px,27px)] leading-[1.5] text-[#25231e]">{review.text}</p>
              <div className="relative z-[1] mt-auto border-t border-[#d8d0c4] pt-5">
                <strong className="block text-[clamp(24px,0.8vw+17px,34px)] font-semibold leading-[1.02] text-[#171511] [font-family:'Cormorant_Garamond',serif]">{review.company}</strong>
                <span className="mt-2 block text-[clamp(12px,0.28vw+11px,15px)] uppercase tracking-[0.18em] leading-[1.45] text-[#7c7469] [font-family:'JetBrains_Mono',monospace]">{review.meta}</span>
              </div>
            </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
