import { useEffect, useRef, useState } from "react";
import AuthHeaderButton from "./AuthHeaderButton";
import { navLinks } from "../data/site";
import { formatPrice, type Product } from "../data/products";
import { loadCatalogProducts } from "../lib/backend-api";

type SiteHeaderProps = {
  light?: boolean;
  fullBleed?: boolean;
};

const PAGE_TRANSITION_STORAGE_KEY = "site-transition-pending";
const PAGE_TRANSITION_HOLD_MS = 880;
const PAGE_TRANSITION_TEXT = "открываем раздел climatrade";

function PageTransitionOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-0 z-[220] flex items-center justify-center bg-[#e1ddd6] px-6 transition-[opacity,visibility] duration-650 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      <div className="relative flex flex-col items-center gap-8 text-center">
        <div className="absolute left-1/2 top-1/2 h-[38vh] w-[38vh] max-w-[520px] max-h-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.2)_42%,rgba(225,221,214,0)_72%)]" />
        <img
          src="/logo.png"
          alt="Climatrade"
          loading="eager"
          decoding="async"
          className="relative h-auto w-[min(64vw,420px)] object-contain"
        />
        <p className="relative text-[clamp(13px,0.42vw+11px,18px)] uppercase tracking-[clamp(0.34em,0.7vw,0.7em)] text-[#8e877d] [font-family:Jaldi,'JetBrains_Mono',monospace]">
          {PAGE_TRANSITION_TEXT}
        </p>
      </div>
    </div>
  );
}

export function SiteHeader({ light = true, fullBleed = false }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuActive, setIsMobileMenuActive] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTransitionVisible, setIsTransitionVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[] | null>(
    null,
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxHeaderHeightRef = useRef(0);
  const scrollLockUntilRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);

  const clearTransitionTimeout = () => {
    if (transitionTimeoutRef.current === null) return;
    window.clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = null;
  };

  const startPageTransition = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PAGE_TRANSITION_STORAGE_KEY, "1");
    setIsTransitionVisible(true);
  };

  const openMobileMenu = () => {
    setIsOpen(true);
    setIsSearchOpen(false);
    requestAnimationFrame(() => setIsMobileMenuActive(true));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuActive(false);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsSearchOpen(false);
    }, 260);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (searchRef.current.contains(event.target as Node)) return;
      setIsSearchOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClick);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollY = 0;
    let lastIsScrolled = false;

    const computeNext = (scrollY: number) => {
      const nextScrollY = Math.max(0, scrollY);
      // Hysteresis to avoid rapid toggles near the top.
      if (lastIsScrolled) return nextScrollY > 10;
      return nextScrollY > 32;
    };

    const commit = () => {
      rafId = null;
      const next = computeNext(lastScrollY);
      if (next === lastIsScrolled) return;
      const now = window.performance?.now?.() ?? Date.now();
      if (now < scrollLockUntilRef.current) return;
      lastIsScrolled = next;
      setIsScrolled(next);
      // Protect from scroll anchoring/layout shifts when header height changes.
      scrollLockUntilRef.current = now + 300;
    };

    const onScroll = () => {
      lastScrollY = window.scrollY || 0;
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(commit);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = searchRef.current;
    if (!el) return;

    const setCssVar = (height: number) => {
      const next = Math.ceil(height);
      if (next <= 0) return;
      if (next <= maxHeaderHeightRef.current) return;
      maxHeaderHeightRef.current = next;
      document.documentElement.style.setProperty("--site-header-offset", `${next}px`);
    };

    // Initial measurement.
    setCssVar(el.getBoundingClientRect().height);

    if (!("ResizeObserver" in window)) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setCssVar(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    let isActive = true;
    setIsLoadingProducts(true);
    loadCatalogProducts()
      .then((items) => {
        if (!isActive) return;
        setCatalogProducts(items);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingProducts(false);
      });
    return () => {
      isActive = false;
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldResumeTransition =
      window.sessionStorage.getItem(PAGE_TRANSITION_STORAGE_KEY) === "1";

    if (!shouldResumeTransition) return;

    setIsTransitionVisible(true);
    window.sessionStorage.removeItem(PAGE_TRANSITION_STORAGE_KEY);
    clearTransitionTimeout();
    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsTransitionVisible(false);
      transitionTimeoutRef.current = null;
    }, PAGE_TRANSITION_HOLD_MS);

    return () => clearTransitionTimeout();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        !url.hash
      ) {
        return;
      }

      startPageTransition();
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      clearTransitionTimeout();
    };
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchSource = catalogProducts ?? [];
  const searchResults = trimmedQuery
    ? searchSource.filter((item) =>
        [
          item.title,
          item.brand,
          item.brandLabel,
          item.category,
          item.slug,
        ].some((value) => value.toLowerCase().includes(trimmedQuery)),
      )
    : searchSource;
  const visibleResults = searchResults.slice(0, 2);

  const handleNavLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    // If we're already on the homepage, "Главная" should scroll to top smoothly
    // instead of doing a full navigation reload.
    if (href === "/" && typeof window !== "undefined") {
      const onHome = window.location.pathname === "/";
      if (onHome) {
        event.preventDefault();
        setIsOpen(false);
        setIsSearchOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsTransitionVisible(false);
        window.sessionStorage.removeItem(PAGE_TRANSITION_STORAGE_KEY);
      }
    }
  };

  const handleRequestClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    const onHome = window.location.pathname === "/";
    if (!onHome) return;

    const target = document.getElementById("contact");
    if (!target) return;

    event.preventDefault();
    setIsOpen(false);
    setIsSearchOpen(false);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PageTransitionOverlay visible={isTransitionVisible} />
      <header
        ref={searchRef}
        className="sticky top-0 z-[140] isolate [overflow-anchor:none]"
      >
        {/* When `fullBleed` is enabled, keep the static header edge-to-edge. */}
        {/**
         * `isScrolled` uses the floating card style; we keep that contained layout.
         */}
        {light ? (
          <div
            className={`grid overflow-hidden border-b border-white/8 bg-[#060606] text-white transition-[grid-template-rows,opacity,transform,border-color] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform ${
              isScrolled
                ? "grid-rows-[0fr] -translate-y-4 opacity-0 border-white/0"
                : "grid-rows-[1fr] translate-y-0 opacity-100"
            }`}
          >
            <div className="min-h-0">
              <div className="mx-auto flex max-w-[1480px] min-h-[52px] items-center justify-between gap-4 px-4 py-3 text-[clamp(13px,0.35vw+11.5px,15px)] font-medium uppercase tracking-[0.7px] text-white/84 md:min-h-[40px] md:px-10 md:py-2.5 md:tracking-[1px] xl:px-12 2xl:max-w-[1860px] 2xl:px-16 [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <div className="min-w-0 flex-1 md:flex-none">
                  <a
                    href="mailto:vostok.stroy.expert@mail.ru"
                    className="block truncate underline decoration-white/40 underline-offset-[4px] transition-colors duration-300 hover:text-white hover:decoration-white/72 md:underline-offset-[5px]"
                  >
                    vostok.stroy.expert@mail.ru
                  </a>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1 md:flex-row md:items-center md:gap-2">
                  <a
                    href="tel:+79252700229"
                    className="text-white underline decoration-white/46 underline-offset-[4px] transition-colors duration-300 hover:text-white hover:decoration-white/78 md:underline-offset-[5px]"
                  >
                    +7(925)270-02-29
                  </a>
                  <span className="hidden text-white/70 md:inline">/</span>
                  <a
                    href="tel:+79266787379"
                    className="text-white underline decoration-white/46 underline-offset-[4px] transition-colors duration-300 hover:text-white hover:decoration-white/78 md:underline-offset-[5px]"
                  >
                    +7(926)678-73-79
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className={`${fullBleed && !isScrolled ? "px-0" : "px-2 md:px-4"} pt-0`}>
          <div
            className={`${fullBleed && !isScrolled ? "w-full max-w-none" : "mx-auto max-w-[1480px] 2xl:max-w-[1860px]"} mt-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3.5 py-3.5 transition-[max-width,margin-top,border-radius,background-color,border-color,box-shadow,backdrop-filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform md:grid-cols-[auto_1fr_auto] md:gap-4 md:px-10 md:py-4 xl:gap-6 xl:px-12 2xl:px-16 ${
              isScrolled
                ? light
                  ? "md:mt-3 max-w-[1420px] translate-y-0 rounded-[22px] md:rounded-[28px] border border-[#1b1b1b]/24 bg-[#e1ddd6] shadow-[0_10px_28px_rgba(0,0,0,0.14),0_0_0_1px_rgba(17,17,17,0.06)] md:backdrop-blur-md 2xl:max-w-[1760px]"
                  : "max-w-[1420px] rounded-[28px] border border-white/14 bg-black/55 shadow-[0_12px_34px_rgba(0,0,0,0.24)] md:backdrop-blur-md 2xl:max-w-[1760px]"
                : light
                  ? "rounded-none border-b border-[#ece8e1] bg-[#e1ddd6] shadow-[0_0_0_rgba(0,0,0,0)]"
                  : "border-b border-white/10 bg-transparent"
            }`}
          >
          <a
            href="/"
            onClick={(event) => handleNavLinkClick(event, "/")}
            className="block min-w-0 pr-1 transition duration-300 ease-out hover:opacity-75"
            aria-label="ВостокСтройЭксперт"
          >
            <img
              src="/logo.png"
              alt="ВостокСтройЭксперт"
              loading="eager"
              decoding="async"
              className="h-10 w-auto object-contain sm:h-18 md:h-19"
            />
          </a>
          <nav
            className={`hidden w-full items-center justify-center gap-[clamp(18px,1.8vw,48px)] text-[clamp(14px,0.6vw+12px,21px)] uppercase tracking-[1.4px] lg:flex lg:justify-self-center [font-family:Jaldi,'JetBrains_Mono',monospace] ${
              light ? "text-[#6d6d67]" : "text-white/80"
            }`}
          >
            {navLinks.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                onClick={(event) => handleNavLinkClick(event, link.href)}
                className="whitespace-nowrap transition duration-300 ease-out hover:-translate-y-0.5 hover:text-[#111]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center justify-end gap-1 md:gap-4 xl:gap-5 2xl:gap-6">
            <button
              type="button"
              aria-label="Открыть поиск по каталогу"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="hidden h-11 w-11 items-center justify-center transition duration-300 ease-out hover:-translate-y-0.5 hover:opacity-70 md:inline-flex xl:scale-110 2xl:scale-125"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className={`${light ? "text-[#111]" : "text-white"}`}
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                />
                <path
                  d="M16.5 16.5L21 21"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <a
              href="/cart"
              aria-label="Корзина"
              className="hidden h-11 w-11 items-center justify-center transition duration-300 ease-out hover:-translate-y-0.5 hover:opacity-70 md:inline-flex xl:scale-110 2xl:scale-125"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className={`${light ? "text-[#111]" : "text-white"}`}
                aria-hidden="true"
              >
                <path
                  d="M6 7h13l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L5 4H2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
                <circle cx="16.5" cy="19.5" r="1.4" fill="currentColor" />
              </svg>
            </a>
            <div className="flex items-center gap-1 sm:hidden">
              <a
                href="https://wa.me/79252700229"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-9 w-9 items-center justify-center bg-[#050505] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#1c1c1c] sm:h-9 sm:w-9"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M20.5 3.5A10.2 10.2 0 0 0 4 15.7L2.8 21.2l5.7-1.5a10.2 10.2 0 0 0 4.8 1.2h.1A10.2 10.2 0 0 0 20.5 3.5Zm-7.1 15.6h-.1a8.5 8.5 0 0 1-4.3-1.2l-.3-.2-3.4.9.9-3.3-.2-.3a8.5 8.5 0 1 1 7.4 4.1Zm4.7-6.3c-.3-.1-1.8-.9-2-.9-.3-.1-.4-.1-.6.1l-.9 1c-.2.2-.3.2-.6.1a6.9 6.9 0 0 1-2-1.2 7.8 7.8 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.3-.4a.6.6 0 0 0 0-.6l-.9-2.2c-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-1 1-.9 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3.2 5 4.3 2.9 1.1 2.9.7 3.4.7.5 0 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z" />
                </svg>
              </a>
              <a
                href="https://t.me/vostok_support"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="inline-flex h-9 w-9 items-center justify-center bg-[#050505] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#1c1c1c] sm:h-9 sm:w-9"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M21.9 4.6c.2-.8-.7-1.5-1.5-1.1L2.7 10.6c-.9.4-.8 1.7.1 2l4.6 1.5 1.8 5.6c.3.9 1.5 1 2 .2l2.6-4.1 4.9 3.6c.8.6 1.9.1 2.1-.9l2.1-14.9zM8.6 13.4l9.8-6c.2-.1.5.1.3.3l-8 7.3-.3 3.9-1.7-5.3z" />
                </svg>
              </a>
              <a
                href="/#contact"
                onClick={handleRequestClick}
                className="hidden h-9 items-center justify-center bg-[#050505] px-3 text-[11px] uppercase tracking-[0.8px] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#1c1c1c] min-[390px]:inline-flex sm:h-9 sm:px-3 sm:text-[12px] sm:tracking-[1px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
              >
                Заявка
              </a>
            </div>
            <AuthHeaderButton
              className={`hidden h-[clamp(40px,3.2vw,60px)] place-items-center px-[clamp(18px,2vw,38px)] text-center text-[clamp(15px,0.6vw+12.5px,20px)] uppercase leading-none tracking-[1.2px] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.14)] sm:inline-grid [font-family:Jaldi,'JetBrains_Mono',monospace] xl:h-[64px] xl:px-11 2xl:h-[68px] 2xl:px-12 ${
                light
                  ? "bg-[#050505] text-white"
                  : "border border-white/20 bg-white/10 text-white"
              }`}
            />
            <button
              type="button"
              aria-label="Открыть меню"
              aria-expanded={isOpen}
              onClick={openMobileMenu}
              className={`relative z-[130] inline-flex h-10 w-10 shrink-0 items-center justify-center border transition-opacity sm:h-10 sm:w-10 md:h-11 md:w-11 lg:hidden ${
                isOpen
                  ? "pointer-events-none opacity-0"
                  : "pointer-events-auto opacity-100"
              } ${light ? "border-[#e6e0d7]" : "border-white/20 text-white"}`}
            >
              <span className="relative h-[12px] w-[20px] sm:h-[12px] sm:w-[20px]">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-full ${light ? "bg-[#111]" : "bg-white"}`}
                />
                <span
                  className={`absolute left-0 top-[5px] h-[2px] w-full ${light ? "bg-[#111]" : "bg-white"}`}
                />
                <span
                  className={`absolute left-0 top-[10px] h-[2px] w-full ${light ? "bg-[#111]" : "bg-white"}`}
                />
              </span>
            </button>
          </div>
          </div>
        </div>
        {isSearchOpen && !isOpen ? (
        <div className="absolute left-0 right-0 top-full">
          <div className="mx-auto max-w-[1480px] px-4 md:px-10 2xl:max-w-[1860px]">
            <div
              className={`ml-auto w-full max-w-[520px] rounded-[10px] border px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.08)] ${
                light
                  ? "border-[#e6e1d8] bg-white"
                  : "border-white/10 bg-[#0b0b0b]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 flex-1 items-center gap-3 rounded-[8px] border border-[#e1ddd5] px-4">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    className={`${light ? "text-[#7d7d78]" : "text-white/70"}`}
                    aria-hidden="true"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    ref={inputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Поиск по каталогу"
                    className={`w-full bg-transparent text-[15px] outline-none placeholder:text-[#b7b2aa] ${
                      light ? "text-[#111]" : "text-white"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-[8px] border ${
                    light
                      ? "border-[#e1ddd5] text-[#111]"
                      : "border-white/20 text-white"
                  }`}
                  aria-label="Закрыть поиск"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                {isLoadingProducts ? (
                  <div
                    className={`rounded-[10px] border px-4 py-3 text-[14px] ${
                      light
                        ? "border-[#ece8e1] text-[#7d7d78]"
                        : "border-white/10 text-white/70"
                    }`}
                  >
                    Загружаем товары...
                  </div>
                ) : visibleResults.length === 0 ? (
                  <div
                    className={`rounded-[10px] border px-4 py-3 text-[14px] ${light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"}`}
                  >
                    Ничего не найдено
                  </div>
                ) : (
                  visibleResults.map((item) => (
                    <a
                      key={item.slug}
                      href={`/catalog/${item.slug}`}
                      className={`flex items-center gap-3 rounded-[10px] border px-3 py-3 transition ${
                        light
                          ? "border-[#ece8e1] hover:border-[#d3b46a]"
                          : "border-white/10 hover:border-white/40"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-12 w-12 rounded-[8px] object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "/catalog/product-1.png";
                        }}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-[12px] uppercase tracking-[1.5px] ${light ? "text-[#8a857c]" : "text-white/60"} [font-family:Jaldi,'JetBrains_Mono',monospace]`}
                        >
                          {item.brandLabel}
                        </p>
                        <p
                          className={`truncate text-[15px] leading-tight ${light ? "text-[#111]" : "text-white"}`}
                        >
                          {item.title}
                        </p>
                        <p
                          className={`text-[14px] ${light ? "text-[#6f6c66]" : "text-white/70"}`}
                        >
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isOpen ? (
        <div className="fixed inset-0 z-[200] md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ease-out ${
              isMobileMenuActive ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMobileMenu}
          />
          <aside
            className={`absolute right-0 top-0 h-full w-[85vw] max-w-[360px] overflow-y-auto px-6 pb-6 ${
              light && !isScrolled ? "pt-[calc(1.5rem+48px)]" : "pt-6"
            } ${light ? "bg-white" : "bg-[#111]"} transform transition-transform duration-300 ease-out ${
              isMobileMenuActive ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <AuthHeaderButton
                className={`inline-grid h-11 min-w-[118px] place-items-center px-5 text-center text-[17px] uppercase leading-none tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                  light
                    ? "bg-[#050505] text-white"
                    : "border border-white/20 bg-white/10 text-white"
                }`}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Открыть поиск в меню"
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className={`inline-flex h-11 w-11 items-center justify-center transition duration-300 ease-out ${
                    light
                      ? "text-[#111] hover:opacity-60"
                      : "text-white hover:opacity-75"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <a
                  href="/cart"
                  aria-label="Корзина"
                  className={`inline-flex h-11 w-11 items-center justify-center transition duration-300 ease-out ${
                    light
                      ? "text-[#111] hover:opacity-60"
                      : "text-white hover:opacity-75"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 7h13l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L5 4H2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
                    <circle cx="16.5" cy="19.5" r="1.4" fill="currentColor" />
                  </svg>
                </a>
                <button
                  type="button"
                  aria-label="Закрыть меню"
                  onClick={closeMobileMenu}
                  className={`h-10 w-10 border transition duration-300 ease-out ${light ? "border-[#e6e0d7] text-[#111] hover:bg-[#f5f2ec]" : "border-white/20 text-white hover:bg-white/10"}`}
                >
                  ✕
                </button>
              </div>
            </div>
            {isSearchOpen ? (
              <div className="mt-6">
                <div
                  className={`flex h-12 items-center gap-3 rounded-[10px] border px-4 ${light ? "border-[#e1ddd5] bg-[#fbfaf8]" : "border-white/10 bg-white/5"}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    className={`${light ? "text-[#7d7d78]" : "text-white/70"}`}
                    aria-hidden="true"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    ref={inputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Поиск по каталогу"
                    className={`w-full bg-transparent text-[15px] outline-none placeholder:text-[#b7b2aa] ${
                      light ? "text-[#111]" : "text-white"
                    }`}
                  />
                </div>
                <div className="mt-3 grid gap-3">
                  {isLoadingProducts ? (
                    <div
                      className={`rounded-[10px] border px-4 py-3 text-[14px] ${light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"}`}
                    >
                      Загружаем товары...
                    </div>
                  ) : visibleResults.length === 0 ? (
                    <div
                      className={`rounded-[10px] border px-4 py-3 text-[14px] ${light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"}`}
                    >
                      Ничего не найдено
                    </div>
                  ) : (
                    visibleResults.map((item) => (
                      <a
                        key={item.slug}
                        href={`/catalog/${item.slug}`}
                        onClick={() => {
                          closeMobileMenu();
                        }}
                        className={`flex items-center gap-3 rounded-[10px] border px-3 py-3 transition ${
                          light
                            ? "border-[#ece8e1] hover:border-[#d3b46a]"
                            : "border-white/10 hover:border-white/40"
                        }`}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-12 w-12 rounded-[8px] object-cover"
                          onError={(event) => {
                            event.currentTarget.src = "/catalog/product-1.png";
                          }}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-[12px] uppercase tracking-[1.5px] ${light ? "text-[#8a857c]" : "text-white/60"} [font-family:Jaldi,'JetBrains_Mono',monospace]`}
                          >
                            {item.brandLabel}
                          </p>
                          <p
                            className={`truncate text-[15px] leading-tight ${light ? "text-[#111]" : "text-white"}`}
                          >
                            {item.title}
                          </p>
                          <p
                            className={`text-[14px] ${light ? "text-[#6f6c66]" : "text-white/70"}`}
                          >
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            ) : null}
            <div className="mt-8 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="ВостокСтройЭксперт"
                loading="eager"
                decoding="async"
                className="h-auto w-[clamp(180px,46vw,260px)] object-contain"
              />
            </div>
            <nav
              className={`mt-8 flex flex-col items-center gap-5 text-center text-[16px] uppercase tracking-[1.8px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#6d6d67]" : "text-white/80"}`}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  onClick={(event) => {
                    handleNavLinkClick(event, link.href);
                    closeMobileMenu();
                  }}
                  className="transition duration-300 ease-out hover:text-[#111]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 flex justify-center">
              <a
                href="/#contact"
                onClick={() => closeMobileMenu()}
                className={`inline-flex h-12 min-w-[220px] items-center justify-center px-8 text-[14px] uppercase tracking-[1.2px] transition duration-300 ease-out hover:-translate-y-0.5 [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                  light
                    ? "bg-[#050505] text-white hover:bg-[#1c1c1c]"
                    : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                оставить заявку
              </a>
            </div>
            <div
              className={`mt-8 grid gap-5 rounded-[24px] px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${
                light
                  ? "border border-[#ebe3d7] bg-[linear-gradient(180deg,#f7f2eb_0%,#efe8de_100%)] text-[#26231e]"
                  : "border border-white/10 bg-white/5 text-white/80"
              }`}
            >
              <div className="grid gap-2">
                <p className={`text-[10px] uppercase tracking-[0.28em] [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#8b8479]" : "text-white/45"}`}>
                  телефоны
                </p>
                <a
                  href="tel:+79252700229"
                  className={`text-[18px] leading-none transition duration-300 ease-out ${light ? "hover:text-[#111]" : "hover:text-white"}`}
                >
                  +7 (925) 270-02-29
                </a>
                <a
                  href="tel:+79266787379"
                  className={`text-[18px] leading-none transition duration-300 ease-out ${light ? "hover:text-[#111]" : "hover:text-white"}`}
                >
                  +7 (926) 678-73-79
                </a>
              </div>
              <div className={`grid gap-2 border-t pt-4 ${light ? "border-[#ddd3c6]" : "border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-[0.28em] [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#8b8479]" : "text-white/45"}`}>
                  адрес офиса
                </p>
                <p className="text-[16px] leading-[1.45]">
                  г. Москва, Калужская, 12
                </p>
              </div>
              <div className={`grid gap-2 border-t pt-4 ${light ? "border-[#ddd3c6]" : "border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-[0.28em] [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#8b8479]" : "text-white/45"}`}>
                  часы работы
                </p>
                <p className="text-[16px] leading-[1.45]">
                  Пн–Пт, с 10:00 до 19:00
                </p>
              </div>
            </div>
          </aside>
        </div>
        ) : null}
      </header>
    </>
  );
}

export default SiteHeader;
