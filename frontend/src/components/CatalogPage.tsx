import { useMemo, useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { formatPrice, type Product } from "../data/products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

type CatalogPageProps = {
  products: Product[];
};

export function CatalogPage({ products }: CatalogPageProps) {
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }

    const categoryItems = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
      .map(([value, count]) => ({ value, label: value, count }));

    return [{ value: "all", label: "Все категории", count: products.length }, ...categoryItems];
  }, [products]);

  const brands = useMemo(() => uniqueValues(products.map((product) => product.brand)), [products]);
  const countries = useMemo(() => uniqueValues(products.map((product) => product.country)), [products]);
  const types = useMemo(() => uniqueValues(products.map((product) => product.type)), [products]);

  const maxProductPrice = getSafeMax(products.map((product) => product.price), 100000);
  const minPower = getSafeMin(products.map((product) => product.power), 0);
  const maxPower = getSafeMax(products.map((product) => product.power), 20);
  const minVolume = getSafeMin(products.map((product) => product.volume), 0);
  const maxVolume = getSafeMax(products.map((product) => product.volume), 20);
  const itemsPerPage = 6;

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxProductPrice]);
  const [priceRangeDraft, setPriceRangeDraft] = useState<[number, number]>([0, maxProductPrice]);
  const [powerRange, setPowerRange] = useState<[number, number]>([minPower, maxPower]);
  const [powerRangeDraft, setPowerRangeDraft] = useState<[number, number]>([minPower, maxPower]);
  const [volumeRange, setVolumeRange] = useState<[number, number]>([minVolume, maxVolume]);
  const [volumeRangeDraft, setVolumeRangeDraft] = useState<[number, number]>([minVolume, maxVolume]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.article.toLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesPower = product.power >= powerRange[0] && product.power <= powerRange[1];
      const matchesVolume = product.volume >= volumeRange[0] && product.volume <= volumeRange[1];
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(product.country);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(product.type);

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPrice &&
        matchesPower &&
        matchesVolume &&
        matchesBrand &&
        matchesCountry &&
        matchesType
      );
    });
  }, [products, query, selectedCategory, priceRange, powerRange, volumeRange, selectedBrands, selectedCountries, selectedTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const visiblePercent = products.length === 0 ? 0 : Math.round((filteredProducts.length / products.length) * 100);
  const resultsAnimationKey = [
    query,
    selectedCategory,
    priceRange.join("-"),
    powerRange.join("-"),
    volumeRange.join("-"),
    selectedBrands.join("-"),
    selectedCountries.join("-"),
    selectedTypes.join("-"),
    safePage,
  ].join("|");

  useEffect(() => {
    if (!resultsTopRef.current) return;
    resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [safePage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const brandFromQuery = params.get("brand")?.trim();
    if (!brandFromQuery) return;

    const matchedBrand = brands.find((brand) => brand.toLowerCase() === brandFromQuery.toLowerCase());
    if (matchedBrand) {
      setSelectedBrands([matchedBrand]);
      setPage(1);
      return;
    }

    setQuery(brandFromQuery);
    setPage(1);
  }, [brands]);

  function toggleValue(value: string, selected: string[], setter: (values: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
    setPage(1);
  }

  function getFilterState(title: string) {
    if (title === "Бренд") {
      return [selectedBrands, setSelectedBrands] as const;
    }
    if (title === "Страна производства") {
      return [selectedCountries, setSelectedCountries] as const;
    }
    return [selectedTypes, setSelectedTypes] as const;
  }

  function renderFilters(idPrefix: string) {
    const mood = visiblePercent >= 80 ? "happy" : visiblePercent >= 40 ? "neutral" : "sad";
    return (
      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Категории</h2>
          <div className="mt-3 border-t border-[#e7e1d9] pt-5">
            <div className="space-y-5 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
              {categories.map((category) => {
                const active = selectedCategory === category.value;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category.value);
                      setPage(1);
                    }}
                    className={`catalog-filter-row flex w-full items-center justify-between border-l-2 pl-4 text-left transition-all duration-300 ${
                      active ? "border-[#d3b46a] text-[#111]" : "border-transparent text-[#8a8a85] hover:border-[#e4cf98] hover:text-[#3d3d39]"
                    }`}
                  >
                    <span>{category.label}</span>
                    <span className="text-[14px]">({category.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 text-[16px] uppercase tracking-[1.4px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <span>Цена</span>
            <span className="flex items-center gap-3 text-right text-[#8a8a85]">
              Отображено {visiblePercent}% товаров
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d9d3ca] text-[#7a7a75]">
                {mood === "happy" ? (
                  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                    <circle cx="6.6" cy="7.3" r="1" fill="currentColor" />
                    <circle cx="13.4" cy="7.3" r="1" fill="currentColor" />
                    <path d="M5.4 11c1.6 2 7.6 2 9.2 0" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  </svg>
                ) : mood === "neutral" ? (
                  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                    <circle cx="6.6" cy="7.3" r="1" fill="currentColor" />
                    <circle cx="13.4" cy="7.3" r="1" fill="currentColor" />
                    <path d="M6 12h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                    <circle cx="6.6" cy="7.3" r="1" fill="currentColor" />
                    <circle cx="13.4" cy="7.3" r="1" fill="currentColor" />
                    <path d="M5.4 13c1.6-2 7.6-2 9.2 0" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </span>
            </span>
          </div>
          <div className="mt-4 border-t border-[#e7e1d9] pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[14px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">От</p>
                <div className="mt-3 border border-[#e7e1d9] px-4 py-4 text-[20px] text-[#676761] 2xl:text-[22px]">{formatPrice(priceRangeDraft[0])}</div>
              </div>
              <div>
                <p className="text-[14px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">До</p>
                <div className="mt-3 border border-[#e7e1d9] px-4 py-4 text-[20px] text-[#676761] 2xl:text-[22px]">{formatPrice(priceRangeDraft[1])}</div>
              </div>
            </div>
            <DoubleRange
              min={0}
              max={maxProductPrice}
              step={1000}
              value={priceRangeDraft}
              ariaLabelMin="Минимальная цена"
              ariaLabelMax="Максимальная цена"
              formatValue={formatPrice}
              onChange={setPriceRangeDraft}
              onCommit={(value) => {
                if (priceRange[0] === value[0] && priceRange[1] === value[1]) return;
                setPriceRange(value);
                setPage(1);
              }}
            />
          </div>
        </section>

        {[["Бренд", brands], ["Страна производства", countries], ["Тип", types]].map(([title, items]) => (
          <section key={title}>
            <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</h2>
            <div className="mt-3 space-y-5 border-t border-[#e7e1d9] pt-5">
              {items.map((item, index) => {
                const id = `${idPrefix}-${String(title).toLowerCase().replace(/\s+/g, "-")}-${index}`;
                const [selected, setSelected] = getFilterState(String(title));

                return (
                  <label key={item} htmlFor={id} className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                    <input
                      id={id}
                      type="checkbox"
                      checked={selected.includes(item)}
                      onChange={() => toggleValue(item, selected, setSelected)}
                      className="catalog-checkbox h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <RangeFilter
          title="Мощность (кВт)"
          min={minPower}
          max={maxPower}
          step={0.1}
          value={powerRangeDraft}
          ariaLabelMin="Минимальная мощность"
          ariaLabelMax="Максимальная мощность"
          onChange={setPowerRangeDraft}
          onCommit={(value) => {
            if (powerRange[0] === value[0] && powerRange[1] === value[1]) return;
            setPowerRange(value);
            setPage(1);
          }}
        />

        <RangeFilter
          title="Объем"
          min={minVolume}
          max={maxVolume}
          step={0.1}
          value={volumeRangeDraft}
          ariaLabelMin="Минимальный объем"
          ariaLabelMax="Максимальный объем"
          onChange={setVolumeRangeDraft}
          onCommit={(value) => {
            if (volumeRange[0] === value[0] && volumeRange[1] === value[1]) return;
            setVolumeRange(value);
            setPage(1);
          }}
        />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section className="px-4 py-10 md:px-10 md:py-14">
          <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <div className="text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/" className="hover:text-[#111]">Главная</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <a href="/catalog" className="hover:text-[#111]">Каталог</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <span>оборудование и климатические системы</span>
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,9vw,7rem)] leading-[0.96] tracking-[-0.03em] md:mt-10 md:tracking-[-0.04em] 2xl:leading-[0.92] [font-family:'Cormorant_Garamond',serif]">
            Каталог оборудования
          </h1>
          <p className="mt-4 text-[clamp(0.9rem,3.8vw,1.5rem)] uppercase tracking-[1.3px] text-[#7a7a75] md:mt-8 md:tracking-[1.6px] 2xl:text-[24px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            Найдено: {filteredProducts.length} товаров
          </p>

          <div className="mt-8 flex flex-col gap-8 md:mt-12 md:gap-10 xl:flex-row 2xl:gap-14">
            <aside className="hidden w-full xl:block xl:max-w-[360px] 2xl:max-w-[420px]">{renderFilters("desktop")}</aside>

            <div className={`fixed inset-0 z-50 xl:hidden ${filtersOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!filtersOpen}>
              <button
                type="button"
                aria-label="Закрыть фильтры"
                onClick={() => setFiltersOpen(false)}
                className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${filtersOpen ? "opacity-100" : "opacity-0"}`}
              />
              <aside
                className={`absolute left-0 top-0 h-full w-[min(92vw,420px)] overflow-y-auto bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-out ${
                  filtersOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div className="mb-8 flex items-center justify-between border-b border-[#e7e1d9] pb-4">
                  <p className="text-[22px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Фильтры</p>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="text-[32px] leading-none text-[#111]" aria-label="Закрыть фильтры">
                    x
                  </button>
                </div>
                {renderFilters("mobile")}
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="mt-8 h-12 w-full bg-[#111] text-[14px] uppercase tracking-[1.5px] text-white md:mt-10 md:h-14 md:text-[16px] md:tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                >
                  Показать товары
                </button>
              </aside>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="flex h-12 items-center justify-center border border-[#e7e1d9] px-4 text-[13px] uppercase tracking-[1.2px] transition-colors hover:border-[#d3b46a] md:h-16 md:px-5 md:text-[16px] md:tracking-[1.6px] xl:hidden 2xl:h-[72px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                >
                  фильтры
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="flex h-12 w-12 items-center justify-center border border-[#e7e1d9] transition-colors hover:border-[#d3b46a] md:h-16 md:w-16 2xl:h-[72px] 2xl:w-[72px]"
                  aria-pressed={showAdvanced}
                  aria-label="Показать расширенные фильтры и сортировку"
                >
                  <img src="/catalog/list-icon.png" alt="" aria-hidden="true" width="28" height="28" className="h-5 w-5 object-contain md:h-7 md:w-7" />
                </button>
                <div className="flex h-12 flex-1 items-center justify-between border border-[#e7e1d9] px-3 md:h-16 md:px-5 2xl:h-[72px] 2xl:px-6">
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Поиск по каталогу"
                    className="w-full border-0 bg-transparent text-[16px] text-[#3c3c38] placeholder:text-[#c2c2bf] focus:outline-none md:text-[26px] 2xl:text-[30px] [font-family:DM_Sans,Manrope,sans-serif]"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setPage(1);
                      }}
                      className="flex h-9 w-9 items-center justify-center text-[#7a7a75] hover:text-[#111]"
                      aria-label="Очистить поиск"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                        <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  ) : (
                    <img src="/catalog/search-arrow.png" alt="" aria-hidden="true" width="32" height="32" className="h-6 w-6 object-contain md:h-8 md:w-8 2xl:h-9 2xl:w-9" />
                  )}
                </div>
              </div>

              <div ref={resultsTopRef} id="catalog-results-top" />
              {showAdvanced ? (
                <div className="mt-10 border border-[#ebe5de] bg-white p-8 2xl:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[#e7e1d9] pb-6">
                    <div>
                      <p className="text-[14px] uppercase tracking-[2px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Сортировка</p>
                      <p className="mt-2 text-[28px] [font-family:'Cormorant_Garamond',serif]">Выберите порядок показа товаров</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[14px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {["Популярные", "Сначала новые", "По цене ↑", "По цене ↓"].map((label) => (
                        <button key={label} type="button" className="border border-[#111] px-4 py-2 text-[#111] hover:border-[#d3b46a] hover:text-[#7f6522]">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div>
                      <p className="text-[14px] uppercase tracking-[2px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Дополнительные фильтры</p>
                      <p className="mt-3 text-[18px] leading-7 text-[#5f5f5a]">
                        Здесь можно включить расширенные параметры подбора: шум, класс эффективности, сценарии установки и дополнительные опции.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 text-[16px] text-[#6f6f69]">
                        <input type="checkbox" className="catalog-checkbox h-6 w-6 border border-[#e1dbd2]" />
                        Тихий режим (до 19 дБ)
                      </label>
                      <label className="flex items-center gap-3 text-[16px] text-[#6f6f69]">
                        <input type="checkbox" className="catalog-checkbox h-6 w-6 border border-[#e1dbd2]" />
                        Премиальная фильтрация
                      </label>
                      <label className="flex items-center gap-3 text-[16px] text-[#6f6f69]">
                        <input type="checkbox" className="catalog-checkbox h-6 w-6 border border-[#e1dbd2]" />
                        Монтаж под ключ
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={resultsAnimationKey}
                  className="catalog-results mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-8"
                >
                  {pageProducts.map((product, index) => (
                    <article
                      key={product.slug}
                      style={{ animationDelay: `${index * 60}ms` }}
                      className="catalog-card group flex h-full flex-col border border-[#ebe5de] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#d8ccb8] hover:shadow-[0_16px_40px_rgba(17,17,17,0.06)] 2xl:p-9"
                    >
                      <a href={`/catalog/${product.slug}`}>
                        <img
                          src={product.image}
                          alt={product.title}
                          width="600"
                          height="600"
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </a>
                      <div className="mt-8 flex flex-1 flex-col">
                        <p className="text-[14px] uppercase tracking-[2.4px] text-[#7a7a75] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{product.brandLabel}</p>
                        <h3 className="mt-4 min-h-[88px] text-[32px] leading-[1.15] 2xl:min-h-[96px] 2xl:text-[36px] [font-family:DM_Sans,Manrope,sans-serif]">
                          <a href={`/catalog/${product.slug}`}>{product.title}</a>
                        </h3>
                        <div className="mt-5 min-h-[56px] space-y-1 text-[17px] leading-7 text-[#7a7a75] 2xl:min-h-[60px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          <p>{product.rating}</p>
                          <p>{product.efficiency}</p>
                        </div>
                        <p className="mt-auto pt-8 text-[clamp(2rem,5vw,3rem)] leading-none tabular-nums whitespace-nowrap md:text-[clamp(1.9rem,3.8vw,2.6rem)] lg:text-[clamp(1.8rem,2.4vw,2.2rem)] 2xl:text-[clamp(2rem,1.9vw,2.5rem)] [font-family:DM_Sans,Manrope,sans-serif]">
                          {formatPrice(product.price)}
                        </p>
                        <div className="mt-8 grid gap-3">
                          <a
                            href={`/cart?add=${product.slug}`}
                            className="inline-flex h-16 items-center justify-center bg-[#111] text-[18px] uppercase tracking-[2px] text-white transition-all duration-300 hover:bg-[#2a2a26] hover:tracking-[2.5px] 2xl:h-[70px] 2xl:text-[19px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                          >
                            в корзину
                          </a>
                          <a
                            href={`/checkout?buy=${product.slug}`}
                            className="inline-flex h-16 items-center justify-center border border-[#111] text-[18px] uppercase tracking-[2px] text-[#111] transition-all duration-300 hover:border-[#d3b46a] hover:text-[#7f6522] 2xl:h-[70px] 2xl:text-[19px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                          >
                            купить в 1 клик
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {pageProducts.length === 0 ? (
                <div className="mt-10 border border-[#ebe5de] px-8 py-14 text-center text-[24px] text-[#6f6f69] 2xl:text-[28px] [font-family:DM_Sans,Manrope,sans-serif]">
                  По заданным параметрам товары не найдены.
                </div>
              ) : null}

              {totalPages > 1 ? (
                <div className="mt-10 border-t border-[#ebe5de] pt-7 md:mt-14 md:pt-10">
                  <div className="mx-auto grid max-w-[420px] grid-cols-[1fr_auto_1fr] items-center gap-3 text-[14px] uppercase tracking-[1.2px] [font-family:Jaldi,'JetBrains_Mono',monospace] md:mx-0 md:max-w-none md:text-[18px] md:tracking-[2px]">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={safePage === 1}
                      className="flex min-h-[44px] items-center justify-start gap-2 text-[#555] disabled:cursor-not-allowed disabled:opacity-35 md:gap-4"
                    >
                      <img src="/catalog/arrow-left.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5" />
                      <span>назад</span>
                    </button>
                    <div className="flex items-center justify-center gap-4 text-[#8a8a85] md:gap-6">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`min-h-[36px] min-w-[32px] ${
                            pageNumber === safePage ? "rounded-[6px] bg-[#111] px-2 text-white" : ""
                          }`}
                        >
                          {String(pageNumber).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={safePage === totalPages}
                      className="flex min-h-[44px] items-center justify-end gap-2 text-[#111] disabled:cursor-not-allowed disabled:opacity-35 md:gap-4"
                    >
                      <span>далее</span>
                      <img src="/catalog/arrow-right.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 border-t border-[#ebe5de] pt-6 text-center text-[14px] uppercase tracking-[1.2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace] md:mt-10">
                  Страница 01
                </div>
              )}
            </div>
          </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

type DoubleRangeProps = {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  ariaLabelMin: string;
  ariaLabelMax: string;
  formatValue: (value: number) => string;
  onChange: (value: [number, number]) => void;
  onCommit: (value: [number, number]) => void;
};

function DoubleRange({ min, max, step, value, ariaLabelMin, ariaLabelMax, formatValue, onChange, onCommit }: DoubleRangeProps) {
  const [from, to] = value;
  const lastValueRef = useRef<[number, number]>(value);

  useEffect(() => {
    lastValueRef.current = value;
  }, [value]);

  if (min === max) {
    return (
      <div className="catalog-double-range catalog-double-range--static mt-5">
        <div className="mb-3 flex items-center justify-between text-[14px] text-[#7a7a75] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
        <div className="catalog-double-range__static">
          <span className="catalog-double-range__static-dot" />
        </div>
        <div className="mt-3 text-center text-[14px] text-[#b1aba2] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
          Н/Д
        </div>
      </div>
    );
  }
  const distance = max - min || 1;
  const minPercent = ((from - min) / distance) * 100;
  const maxPercent = ((to - min) / distance) * 100;

  function updateMin(next: number) {
    const nextValue: [number, number] = [Math.min(next, to - step), to];
    lastValueRef.current = nextValue;
    onChange(nextValue);
  }

  function updateMax(next: number) {
    const nextValue: [number, number] = [from, Math.max(next, from + step)];
    lastValueRef.current = nextValue;
    onChange(nextValue);
  }

  function commitCurrentValue() {
    onCommit(lastValueRef.current);
  }

  return (
    <div className="catalog-double-range mt-5" style={{ "--range-start": `${minPercent}%`, "--range-end": `${maxPercent}%` } as CSSProperties}>
      <div className="mb-3 flex items-center justify-between text-[14px] text-[#7a7a75] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
        <span>{formatValue(from)}</span>
        <span>{formatValue(to)}</span>
      </div>
      <div className="catalog-double-range__control">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={from}
          aria-label={ariaLabelMin}
          data-range="min"
          onChange={(event) => updateMin(Number(event.target.value))}
          onMouseUp={commitCurrentValue}
          onTouchEnd={commitCurrentValue}
          onKeyUp={commitCurrentValue}
          onBlur={commitCurrentValue}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={to}
          aria-label={ariaLabelMax}
          data-range="max"
          onChange={(event) => updateMax(Number(event.target.value))}
          onMouseUp={commitCurrentValue}
          onTouchEnd={commitCurrentValue}
          onKeyUp={commitCurrentValue}
          onBlur={commitCurrentValue}
        />
      </div>
      <div className="mt-3 text-center text-[14px] text-[#7a7a75] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
        {Math.round(maxPercent - minPercent)}%
      </div>
    </div>
  );
}

type RangeFilterProps = {
  title: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  ariaLabelMin: string;
  ariaLabelMax: string;
  onChange: (value: [number, number]) => void;
  onCommit: (value: [number, number]) => void;
};

function RangeFilter({ title, min, max, step, value, ariaLabelMin, ariaLabelMax, onChange, onCommit }: RangeFilterProps) {
  return (
    <section>
      <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</h2>
      <div className="mt-3 border-t border-[#e7e1d9] pt-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-[#e7e1d9] px-4 py-4 text-center text-[18px] uppercase tracking-[1.3px] 2xl:text-[20px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            мин: {value[0].toFixed(1)}
          </div>
          <div className="border border-[#e7e1d9] px-4 py-4 text-center text-[18px] uppercase tracking-[1.3px] 2xl:text-[20px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            макс: {value[1].toFixed(1)}
          </div>
        </div>
        <DoubleRange
          min={min}
          max={max}
          step={step}
          value={value}
          ariaLabelMin={ariaLabelMin}
          ariaLabelMax={ariaLabelMax}
          formatValue={(rangeValue) => rangeValue.toFixed(1)}
          onChange={onChange}
          onCommit={onCommit}
        />
      </div>
    </section>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ru"));
}

function getSafeMin(values: number[], fallback: number) {
  return values.length ? Math.min(...values) : fallback;
}

function getSafeMax(values: number[], fallback: number) {
  return values.length ? Math.max(...values) : fallback;
}

export default CatalogPage;
