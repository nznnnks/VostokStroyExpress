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
      className={`relative z-[120] isolate border-b px-4 py-4 md:px-10 ${
        light ? "border-[#ece8e1] bg-white" : "border-white/10 bg-transparent"
      }`}
    >
      <div className="mx-auto grid max-w-[1480px] grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[auto_1fr_auto] md:gap-4 2xl:max-w-[1860px]">
        <a
          href="/"
          className={`text-[clamp(18px,3.6vw,36px)] italic tracking-[-0.03em] [font-family:'Cormorant_Garamond',serif] ${
            light ? "text-[#050505]" : "text-white"
          }`}
        >
          ВостокСтройЭксперт
        </a>
        <nav
          className={`hidden w-full items-center justify-center gap-[clamp(18px,1.8vw,40px)] text-[clamp(11px,0.5vw+10px,16px)] uppercase tracking-[1.4px] lg:flex lg:justify-self-center [font-family:Jaldi,'JetBrains_Mono',monospace] ${
            light ? "text-[#6d6d67]" : "text-white/80"
          }`}
        >
          {navLinks.map((link) => (
            <a key={link.href + link.label} href={link.href} className="whitespace-nowrap">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Открыть поиск по каталогу"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="hidden md:inline-flex"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" className={`${light ? "text-[#111]" : "text-white"}`} aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <a href="/cart" aria-label="Корзина" className="hidden md:inline-flex">
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
            className={`hidden h-[clamp(40px,3.2vw,56px)] items-center justify-center px-[clamp(18px,2vw,34px)] text-[clamp(11px,0.5vw+10px,14px)] uppercase tracking-[1.2px] sm:inline-flex [font-family:Jaldi,'JetBrains_Mono',monospace] ${
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
      {isSearchOpen ? (
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
          <aside className={`absolute right-0 top-0 h-full w-[85vw] max-w-[360px] px-6 py-6 ${light ? "bg-white" : "bg-[#111]"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[20px] italic [font-family:'Cormorant_Garamond',serif] ${light ? "text-[#050505]" : "text-white"}`}>
                ВостокСтройЭксперт
              </span>
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setIsOpen(false)}
                className={`h-10 w-10 border ${light ? "border-[#e6e0d7]" : "border-white/20 text-white"}`}
              >
                ✕
              </button>
            </div>
            <nav className={`mt-8 flex flex-col gap-5 text-[14px] uppercase tracking-[1.8px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${light ? "text-[#6d6d67]" : "text-white/80"}`}>
              {navLinks.map((link) => (
                <a key={link.href + link.label} href={link.href} onClick={() => setIsOpen(false)}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              <AuthHeaderButton
                className={`inline-flex h-12 items-center justify-center px-7 text-[14px] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                  light ? "bg-[#050505] text-white" : "border border-white/20 bg-white/10 text-white"
                }`}
              />
              <div className="flex items-center gap-4">
                <a href="/catalog" className="inline-flex h-11 flex-1 items-center justify-center border border-[#e6e0d7] text-[13px] uppercase tracking-[1.2px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  Поиск
                </a>
                <a href="/cart" className="inline-flex h-11 flex-1 items-center justify-center border border-[#e6e0d7] text-[13px] uppercase tracking-[1.2px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  Корзина
                </a>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

export default SiteHeader;
