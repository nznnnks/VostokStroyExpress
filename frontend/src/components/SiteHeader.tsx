import { useEffect, useRef, useState } from "react";
import AuthHeaderButton from "./AuthHeaderButton";
import { navLinks } from "../data/site";
import { formatPrice, type Product } from "../data/products";
import { loadCatalogProducts } from "../lib/backend-api";

type SiteHeaderProps = {
  light?: boolean;
};

export function SiteHeader({ light = true }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[] | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
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
    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      setIsScrolled((prev) => {
        if (prev) {
          return nextScrollY > 10;
        }
        return nextScrollY > 32;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchSource = catalogProducts ?? [];
  const searchResults = trimmedQuery
    ? searchSource.filter((item) =>
        [item.title, item.brand, item.brandLabel, item.category, item.slug].some((value) =>
          value.toLowerCase().includes(trimmedQuery),
        ),
      )
    : searchSource;
  const visibleResults = searchResults.slice(0, 2);

  return (
    <header
      ref={searchRef}
      className="sticky top-0 z-[140] isolate"
    >
      {light ? (
        <div
          className={`grid overflow-hidden border-b border-white/8 bg-[#060606] text-white transition-[grid-template-rows,opacity,transform,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isScrolled ? "grid-rows-[0fr] -translate-y-1 opacity-0 border-white/0" : "grid-rows-[1fr] translate-y-0 opacity-100"
          }`}
        >
          <div className="min-h-0">
          <div className="mx-auto flex max-w-[1480px] min-h-[40px] items-center justify-between gap-4 px-4 py-2.5 text-[clamp(13px,0.35vw+11.5px,15px)] font-medium uppercase tracking-[0.7px] text-white/84 md:min-h-[40px] md:px-10 md:py-2.5 md:tracking-[1px] xl:px-12 2xl:max-w-[1860px] 2xl:px-16 [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <div className="min-w-0 flex-1 md:flex-none">
              <a
                href="mailto:concierge@aeris-climate.com"
                className="block truncate underline decoration-white/40 underline-offset-[4px] transition-colors duration-300 hover:text-white hover:decoration-white/72 md:underline-offset-[5px]"
              >
                concierge@aeris-climate.com
              </a>
            </div>
            <a
              href="tel:+79992004000"
              className="shrink-0 text-white underline decoration-white/46 underline-offset-[4px] transition-colors duration-300 hover:text-white hover:decoration-white/78 md:underline-offset-[5px]"
            >
              +7 999 200 40 00
            </a>
          </div>
          </div>
        </div>
      ) : null}
      <div className="px-2 pt-0 md:px-4">
      <div
        className={`mx-auto mt-0 grid max-w-[1480px] grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 transition-[max-width,margin-top,border-radius,background-color,border-color,box-shadow,backdrop-filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:grid-cols-[auto_1fr_auto] md:gap-4 md:px-10 xl:gap-6 xl:px-12 2xl:max-w-[1860px] 2xl:px-16 ${
          isScrolled
            ? light
              ? "mt-2 md:mt-3 max-w-[1420px] translate-y-0 rounded-[28px] border border-[#1b1b1b]/24 bg-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.14),0_0_0_1px_rgba(17,17,17,0.06)] backdrop-blur-md 2xl:max-w-[1760px]"
              : "max-w-[1420px] rounded-[28px] border border-white/14 bg-black/45 shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-md 2xl:max-w-[1760px]"
            : light
              ? "max-w-[1480px] rounded-none border-b border-[#ece8e1] bg-white shadow-[0_0_0_rgba(0,0,0,0)] 2xl:max-w-[1860px]"
              : "border-b border-white/10 bg-transparent"
        }`}
      >
        <a
          href="/"
          className={`text-[clamp(18px,3.6vw,40px)] italic tracking-[-0.03em] transition duration-300 ease-out hover:opacity-75 [font-family:'Cormorant_Garamond',serif] ${
            light ? "text-[#050505]" : "text-white"
          }`}
        >
          ВостокСтройЭксперт
        </a>
        <nav
          className={`hidden w-full items-center justify-center gap-[clamp(18px,1.8vw,48px)] text-[clamp(11px,0.55vw+10px,18px)] uppercase tracking-[1.4px] lg:flex lg:justify-self-center [font-family:Jaldi,'JetBrains_Mono',monospace] ${
            light ? "text-[#6d6d67]" : "text-white/80"
          }`}
        >
          {navLinks.map((link) => (
            <a key={link.href + link.label} href={link.href} className="whitespace-nowrap transition duration-300 ease-out hover:-translate-y-0.5 hover:text-[#111]">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3 md:gap-4 xl:gap-5 2xl:gap-6">
          <button
            type="button"
            aria-label="Открыть поиск по каталогу"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="hidden transition duration-300 ease-out hover:-translate-y-0.5 hover:opacity-70 md:inline-flex xl:scale-110 2xl:scale-125"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" className={`${light ? "text-[#111]" : "text-white"}`} aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <a href="/cart" aria-label="Корзина" className="hidden transition duration-300 ease-out hover:-translate-y-0.5 hover:opacity-70 md:inline-flex xl:scale-110 2xl:scale-125">
            <svg viewBox="0 0 24 24" width="18" height="18" className={`${light ? "text-[#111]" : "text-white"}`} aria-hidden="true">
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
          <AuthHeaderButton
            className={`hidden h-[clamp(40px,3.2vw,60px)] items-center justify-center px-[clamp(18px,2vw,38px)] text-[clamp(13px,0.6vw+11px,18px)] uppercase tracking-[1.2px] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.14)] sm:inline-flex [font-family:Jaldi,'JetBrains_Mono',monospace] xl:h-[64px] xl:px-11 2xl:h-[68px] 2xl:px-12 [font-family:Jaldi,'JetBrains_Mono',monospace] ${
              light ? "bg-[#050505] text-white" : "border border-white/20 bg-white/10 text-white"
            }`}
          />
          <button
            type="button"
            aria-label="Открыть меню"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
            className={`relative z-[130] inline-flex h-11 w-11 items-center justify-center border transition-opacity lg:hidden ${
              isOpen ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
            } ${light ? "border-[#e6e0d7]" : "border-white/20 text-white"}`}
          >
            <span className="relative h-[12px] w-[20px]">
              <span className={`absolute left-0 top-0 h-[2px] w-full ${light ? "bg-[#111]" : "bg-white"}`} />
              <span className={`absolute left-0 top-[5px] h-[2px] w-full ${light ? "bg-[#111]" : "bg-white"}`} />
              <span className={`absolute left-0 top-[10px] h-[2px] w-full ${light ? "bg-[#111]" : "bg-white"}`} />
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
                light ? "border-[#e6e1d8] bg-white" : "border-white/10 bg-[#0b0b0b]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 flex-1 items-center gap-3 rounded-[8px] border border-[#e1ddd5] px-4">
                  <svg viewBox="0 0 24 24" width="16" height="16" className={`${light ? "text-[#7d7d78]" : "text-white/70"}`} aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
                    light ? "border-[#e1ddd5] text-[#111]" : "border-white/20 text-white"
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
                      light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"
                    }`}
                  >
                    Загружаем товары...
                  </div>
                ) : visibleResults.length === 0 ? (
                  <div className={`rounded-[10px] border px-4 py-3 text-[14px] ${light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"}`}>
                    Ничего не найдено
                  </div>
                ) : (
                  visibleResults.map((item) => (
                    <a
                      key={item.slug}
                      href={`/catalog/${item.slug}`}
                      className={`flex items-center gap-3 rounded-[10px] border px-3 py-3 transition ${
                        light ? "border-[#ece8e1] hover:border-[#d3b46a]" : "border-white/10 hover:border-white/40"
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
                        <p className={`text-[12px] uppercase tracking-[1.5px] ${light ? "text-[#8a857c]" : "text-white/60"} [font-family:Jaldi,'JetBrains_Mono',monospace]`}>
                          {item.brandLabel}
                        </p>
                        <p className={`truncate text-[15px] leading-tight ${light ? "text-[#111]" : "text-white"}`}>{item.title}</p>
                        <p className={`text-[14px] ${light ? "text-[#6f6c66]" : "text-white/70"}`}>{formatPrice(item.price)}</p>
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
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsOpen(false)}
          />
          <aside className={`absolute right-0 top-0 h-full w-[85vw] max-w-[360px] overflow-y-auto px-6 py-6 ${light ? "bg-white" : "bg-[#111]"}`}>
            <div className="flex items-center justify-between gap-3">
              <AuthHeaderButton
                className={`inline-flex h-11 min-w-[118px] items-center justify-center px-5 text-[15px] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                  light ? "bg-[#050505] text-white" : "border border-white/20 bg-white/10 text-white"
                }`}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Открыть поиск в меню"
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className={`inline-flex h-10 w-10 items-center justify-center transition duration-300 ease-out ${
                    light ? "text-[#111] hover:opacity-60" : "text-white hover:opacity-75"
                  }`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
                <a
                  href="/cart"
                  aria-label="Корзина"
                  className={`inline-flex h-10 w-10 items-center justify-center transition duration-300 ease-out ${
                    light ? "text-[#111] hover:opacity-60" : "text-white hover:opacity-75"
                  }`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
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
                  onClick={() => {
                    setIsOpen(false);
                    setIsSearchOpen(false);
                  }}
                  className={`h-10 w-10 border transition duration-300 ease-out ${light ? "border-[#e6e0d7] text-[#111] hover:bg-[#f5f2ec]" : "border-white/20 text-white hover:bg-white/10"}`}
                >
                  ✕
                </button>
              </div>
            </div>
            {isSearchOpen ? (
              <div className="mt-6">
                <div className={`flex h-12 items-center gap-3 rounded-[10px] border px-4 ${light ? "border-[#e1ddd5] bg-[#fbfaf8]" : "border-white/10 bg-white/5"}`}>
                  <svg viewBox="0 0 24 24" width="16" height="16" className={`${light ? "text-[#7d7d78]" : "text-white/70"}`} aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
                    <div className={`rounded-[10px] border px-4 py-3 text-[14px] ${light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"}`}>
                      Загружаем товары...
                    </div>
                  ) : visibleResults.length === 0 ? (
                    <div className={`rounded-[10px] border px-4 py-3 text-[14px] ${light ? "border-[#ece8e1] text-[#7d7d78]" : "border-white/10 text-white/70"}`}>
                      Ничего не найдено
                    </div>
                  ) : (
                    visibleResults.map((item) => (
                      <a
                        key={item.slug}
                        href={`/catalog/${item.slug}`}
                        onClick={() => {
                          setIsOpen(false);
                          setIsSearchOpen(false);
                        }}
                        className={`flex items-center gap-3 rounded-[10px] border px-3 py-3 transition ${
                          light ? "border-[#ece8e1] hover:border-[#d3b46a]" : "border-white/10 hover:border-white/40"
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
                          <p className={`text-[12px] uppercase tracking-[1.5px] ${light ? "text-[#8a857c]" : "text-white/60"} [font-family:Jaldi,'JetBrains_Mono',monospace]`}>
                            {item.brandLabel}
                          </p>
                          <p className={`truncate text-[15px] leading-tight ${light ? "text-[#111]" : "text-white"}`}>{item.title}</p>
                          <p className={`text-[14px] ${light ? "text-[#6f6c66]" : "text-white/70"}`}>{formatPrice(item.price)}</p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            ) : null}
            <div className="mt-8 flex items-center justify-center">
              <span className={`text-center text-[22px] italic [font-family:'Cormorant_Garamond',serif] ${light ? "text-[#050505]" : "text-white"}`}>
                ВостокСтройЭксперт
              </span>
            </div>
            <nav className={`mt-8 flex flex-col items-center gap-5 text-center text-[15px] uppercase tracking-[1.8px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#6d6d67]" : "text-white/80"}`}>
              {navLinks.map((link) => (
                <a key={link.href + link.label} href={link.href} onClick={() => setIsOpen(false)} className="transition duration-300 ease-out hover:text-[#111]">
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 flex justify-center">
              <a
                href="/#contact"
                onClick={() => setIsOpen(false)}
                className={`inline-flex h-12 min-w-[220px] items-center justify-center px-8 text-[14px] uppercase tracking-[1.2px] transition duration-300 ease-out hover:-translate-y-0.5 [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                  light ? "bg-[#050505] text-white hover:bg-[#1c1c1c]" : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                оставить заявку
              </a>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

export default SiteHeader;
