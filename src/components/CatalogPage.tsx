import { useMemo, useState } from "react";
import { formatPrice, products } from "../data/products";

const categories = [
  ["all", "Прецизионное охлаждение", 112],
  ["Системы климат-контроля", "Модульные системы", 84],
  ["ventilation", "Вентиляция", 96],
  ["geothermal", "Геотермальные массивы", 55],
] as const;

const filterGroups = [
  ["Бренд", ["Aeris Pro", "Nordic Heavy", "Zenith Industrial"]],
  ["Страна производства", ["Германия", "Швейцария", "Япония"]],
  ["Тип", ["Устройства климат контроля", "Котлы", "Другое"]],
];

export function CatalogPage() {
  const maxProductPrice = Math.max(...products.map((product) => product.price));
  const minPower = Math.min(...products.map((product) => product.power));
  const maxPower = Math.max(...products.map((product) => product.power));
  const minVolume = Math.min(...products.map((product) => product.volume));
  const maxVolume = Math.max(...products.map((product) => product.volume));
  const priceSteps = [25, 50, 75, 100];
  const itemsPerPage = 3;
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number][0]>("Системы климат-контроля");
  const [pricePercent, setPricePercent] = useState(100);
  const [powerPercent, setPowerPercent] = useState(100);
  const [volumePercent, setVolumePercent] = useState(100);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const selectedMaxPrice = Math.round((maxProductPrice * pricePercent) / 100);
  const selectedMaxPower = Number((minPower + ((maxPower - minPower) * powerPercent) / 100).toFixed(1));
  const selectedMaxVolume = Number((minVolume + ((maxVolume - minVolume) * volumePercent) / 100).toFixed(1));

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = product.price <= selectedMaxPrice;
      const matchesPower = product.power <= selectedMaxPower;
      const matchesVolume = product.volume <= selectedMaxVolume;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(product.country);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(product.type);

      return matchesQuery && matchesCategory && matchesPrice && matchesPower && matchesVolume && matchesBrand && matchesCountry && matchesType;
    });
  }, [query, selectedCategory, selectedMaxPrice, selectedMaxPower, selectedMaxVolume, selectedBrands, selectedCountries, selectedTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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

  const visiblePercent = Math.round((filteredProducts.length / products.length) * 100);

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">
            ВостокСтройЭксперт
          </a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">главная</a>
            <a href="/about">о нас</a>
            <a href="/services">услуги</a>
            <a href="/news">проекты</a>
            <a href="/catalog">каталог</a>
            <a href="/news">блог</a>
          </nav>
          <div className="flex items-center gap-4">
            <img src="/image/лупа.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <a href="/login" className="inline-flex h-12 items-center justify-center bg-[#050505] px-7 text-[14px] uppercase tracking-[1.2px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
              войти
            </a>
          </div>
        </div>
      </header>

      <section className="px-4 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px]">
          <div className="text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            каталог / системы климат-контроля
          </div>

          <h1 className="mt-10 text-[54px] leading-[0.95] tracking-[-0.04em] md:text-[92px] [font-family:'Cormorant_Garamond',serif]">
            Системы климат-контроля
          </h1>
          <p className="mt-8 text-[20px] uppercase tracking-[1.6px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            Найдено: {filteredProducts.length} товаров
          </p>

          <div className="mt-12 flex flex-col gap-10 xl:flex-row">
            <aside className="w-full xl:max-w-[360px]">
              <div className="space-y-8">
                <section>
                  <h2 className="text-[20px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Категории</h2>
                  <div className="mt-3 border-t border-[#e7e1d9] pt-5">
                    <div className="space-y-5 text-[18px] text-[#6f6f69]">
                      {categories.map(([value, label, count]) => {
                        const active = selectedCategory === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(value);
                              setPage(1);
                            }}
                            className={`catalog-filter-row flex w-full items-center justify-between border-l-2 pl-4 text-left transition-all duration-300 ${
                              active ? "border-[#d3b46a] text-[#111]" : "border-transparent text-[#8a8a85] hover:border-[#e4cf98] hover:text-[#3d3d39]"
                            }`}
                          >
                            <span>{label}</span>
                            <span className="text-[14px]">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between text-[16px] uppercase tracking-[1.4px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    <span>Цена</span>
                    <span className="flex items-center gap-3 text-[#8a8a85]">Отображено {visiblePercent}% товаров <img src="/каталог/грустыный смайлик.png" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4" /></span>
                  </div>
                  <div className="mt-4 border-t border-[#e7e1d9] pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[14px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">От</p>
                        <div className="mt-3 border border-[#e7e1d9] px-4 py-4 text-[20px] text-[#676761]">0</div>
                      </div>
                      <div>
                        <p className="text-[14px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">До</p>
                        <div className="mt-3 border border-[#e7e1d9] px-4 py-4 text-[20px] text-[#676761]">{formatPrice(selectedMaxPrice)}</div>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-[14px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {priceSteps.map((step) => (
                        <span key={step}>{formatPrice(Math.round((maxProductPrice * step) / 100))}</span>
                      ))}
                    </div>
                    <div className="mt-3">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={pricePercent}
                        aria-label="Процент цены"
                        onChange={(event) => {
                          setPricePercent(Number(event.target.value));
                          setPage(1);
                        }}
                        className="catalog-range w-full accent-[#111]"
                      />
                    </div>
                    <div className="mt-2 text-center text-[14px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">{pricePercent}%</div>
                  </div>
                </section>

                {filterGroups.map(([title, items]) => (
                  <section key={title as string}>
                    <h2 className="text-[20px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</h2>
                    <div className="mt-3 border-t border-[#e7e1d9] pt-5 space-y-5">
                      {(items as string[]).map((item, index) => {
                        const id = `${String(title).toLowerCase().replace(/\s+/g, "-")}-${index}`;
                        const [selected, setSelected] = getFilterState(String(title));

                        return (
                          <label key={item} htmlFor={id} className="flex items-center gap-4 text-[18px] text-[#6f6f69]">
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

                <section>
                  <h2 className="text-[20px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Мощность (кВт)</h2>
                  <div className="mt-3 border-t border-[#e7e1d9] pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-[#e7e1d9] px-4 py-4 text-center text-[18px] uppercase tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        мин: {minPower.toFixed(1)}
                      </div>
                      <div className="border border-[#e7e1d9] px-4 py-4 text-center text-[18px] uppercase tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        макс: {selectedMaxPower.toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-5">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={powerPercent}
                        aria-label="Максимальная мощность"
                        onChange={(event) => {
                          setPowerPercent(Number(event.target.value));
                          setPage(1);
                        }}
                        className="catalog-range w-full accent-[#111]"
                      />
                    </div>
                    <div className="mt-2 text-center text-[14px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {powerPercent}%
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-[20px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Объем (кВт)</h2>
                  <div className="mt-3 border-t border-[#e7e1d9] pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-[#e7e1d9] px-4 py-4 text-center text-[18px] uppercase tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        мин: {minVolume.toFixed(1)}
                      </div>
                      <div className="border border-[#e7e1d9] px-4 py-4 text-center text-[18px] uppercase tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        макс: {selectedMaxVolume.toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-5">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volumePercent}
                        aria-label="Максимальный объем"
                        onChange={(event) => {
                          setVolumePercent(Number(event.target.value));
                          setPage(1);
                        }}
                        className="catalog-range w-full accent-[#111]"
                      />
                    </div>
                    <div className="mt-2 text-center text-[14px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {volumePercent}%
                    </div>
                  </div>
                </section>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border border-[#e7e1d9]">
                  <img src="/каталог/списочек.png" alt="" aria-hidden="true" width="28" height="28" className="h-7 w-7 object-contain" />
                </div>
                <div className="flex h-16 flex-1 items-center justify-between border border-[#e7e1d9] px-5">
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Поиск по каталогу"
                    className="w-full border-0 bg-transparent text-[26px] text-[#3c3c38] placeholder:text-[#c2c2bf] focus:outline-none [font-family:DM_Sans,Manrope,sans-serif]"
                  />
                  <img src="/каталог/стрелка в поиске.png" alt="" aria-hidden="true" width="32" height="32" className="h-8 w-8 object-contain" />
                </div>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                {pageProducts.map((product) => (
                  <article key={product.slug} className="catalog-card group border border-[#ebe5de] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#d8ccb8] hover:shadow-[0_16px_40px_rgba(17,17,17,0.06)]">
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
                    <div className="mt-8">
                      <p className="text-[14px] uppercase tracking-[2.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">{product.brandLabel}</p>
                      <h3 className="mt-4 text-[32px] leading-[1.15] [font-family:DM_Sans,Manrope,sans-serif]">
                        <a href={`/catalog/${product.slug}`}>{product.title}</a>
                      </h3>
                      <div className="mt-5 space-y-1 text-[17px] leading-7 text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        <p>{product.rating}</p>
                        <p>{product.efficiency}</p>
                      </div>
                      <p className="mt-8 text-[48px] leading-none [font-family:DM_Sans,Manrope,sans-serif]">{formatPrice(product.price)}</p>
                      <div className="mt-8 grid gap-3">
                        <a href={`/cart?add=${product.slug}`} className="inline-flex h-16 items-center justify-center bg-[#111] text-[18px] uppercase tracking-[2px] text-white transition-all duration-300 hover:bg-[#2a2a26] hover:tracking-[2.5px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          в корзину
                        </a>
                        <a href={`/catalog/${product.slug}`} className="inline-flex h-16 items-center justify-center border border-[#111] text-[18px] uppercase tracking-[2px] text-[#111] transition-all duration-300 hover:border-[#d3b46a] hover:text-[#7f6522] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                          характеристики
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {pageProducts.length === 0 ? (
                <div className="mt-10 border border-[#ebe5de] px-8 py-14 text-center text-[24px] text-[#6f6f69] [font-family:DM_Sans,Manrope,sans-serif]">
                  По заданным параметрам товары не найдены.
                </div>
              ) : null}

              <div className="mt-14 flex flex-col gap-6 border-t border-[#ebe5de] pt-10 text-[18px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace] md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-4 text-[#555] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <img src="/каталог/стрелка влево.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5" />
                  <span>назад</span>
                </button>
                <div className="flex items-center gap-8 text-[#8a8a85]">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={pageNumber === safePage ? "border-b-2 border-[#111] pb-1 text-[#111]" : ""}
                    >
                      {String(pageNumber).padStart(2, "0")}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-4 text-[#111] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>далее</span>
                  <img src="/каталог/стрелка вправо.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-[#e8e3db] bg-[#f7f5f1] px-4 py-12 md:px-10">
        <div className="mx-auto grid max-w-[1480px] gap-10 md:grid-cols-[1.1fr_1.2fr_1fr]">
          <div>
            <p className="text-[26px] italic [font-family:'Cormorant_Garamond',serif]">ВостокСтройЭксперт</p>
            <p className="mt-10 max-w-[360px] text-[15px] uppercase leading-10 tracking-[1.8px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              архитектурная климатическая интеграция для нового поколения антропогенной среды.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Карта сайта</h3>
              <div className="mt-6 space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[36px]">
              <div className="space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
            <div className="pt-10 md:pt-[36px]">
              <div className="space-y-5 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                <p>Главная</p>
                <p>О нас</p>
                <p>Услуги</p>
                <p>Услуги</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[18px] uppercase [font-family:'Cormorant_Garamond',serif]">Юридическая информация</h3>
            <div className="mt-10 space-y-8 text-[15px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <p>Соглашение о конфиденциальности</p>
              <p>Условия</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1480px] flex-col gap-4 border-t border-[#e8e3db] pt-6 text-[12px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace] md:flex-row md:items-center md:justify-between">
          <p>© 2026 <span className="[font-family:'Cormorant_Garamond',serif] italic text-[#5b5b56]">ВостокСтройЭксперт</span> climate technologies. Все права защищены.</p>
          <div className="flex items-center gap-6">
            <img src="/image/planet.svg" alt="" aria-hidden="true" width="20" height="20" className="h-5 w-5 object-contain opacity-70" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-4 w-4 object-contain opacity-70" />
          </div>
        </div>
      </footer>
    </main>
  );
}

export default CatalogPage;
