import { useMemo, useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { formatPrice, type Product } from "../data/products";
import { slugify } from "../lib/slug";
import { addProductToSessionCartBySlug } from "../lib/session-cart";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

type CatalogPageProps = {
  products: Product[];
  initialCategory?: string;
  variant?: "default" | "landing";
};

type CatalogDynamicFilter = {
  id: string;
  groupId: string;
  groupName: string;
  parameterName: string;
  parameterType: "TEXT" | "NUMBER";
  unit?: string;
  values: string[];
  numericValues: number[];
  min: number;
  max: number;
  fallbackKey?: "power" | "volume";
};

export function CatalogPage({ products, initialCategory, variant = "default" }: CatalogPageProps) {
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const hasMountedQueryEffectRef = useRef(false);
  const pendingOverlayScrollRef = useRef<"restore" | "results">("restore");
  const isLanding = variant === "landing";
  const isCategoryPage = Boolean(initialCategory && initialCategory !== "all");
  const formatFilterCountLabel = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} фильтр`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} фильтра`;
    return `${count} фильтров`;
  };
  const productOrderMap = useMemo(() => new Map(products.map((product, index) => [product.slug, index])), [products]);
  const categoryTypeTree = useMemo(() => {
    const grouped = new Map<string, { category: string; count: number; types: Map<string, number> }>();

    for (const product of products) {
      const current = grouped.get(product.category) ?? {
        category: product.category,
        count: 0,
        types: new Map<string, number>(),
      };

      current.count += 1;
      current.types.set(product.type, (current.types.get(product.type) ?? 0) + 1);
      grouped.set(product.category, current);
    }

    return Array.from(grouped.values())
      .map((item) => ({
        category: item.category,
        count: item.count,
        types: Array.from(item.types.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type, "ru")),
      }))
      .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category, "ru"));
  }, [products]);
  const currentCategoryTypes = useMemo(() => {
    if (!isCategoryPage || !initialCategory) return [];

    return products
      .filter((product) => product.category === initialCategory)
      .reduce<Map<string, number>>((acc, product) => {
        acc.set(product.type, (acc.get(product.type) ?? 0) + 1);
        return acc;
      }, new Map<string, number>());
  }, [initialCategory, isCategoryPage, products]);
  const currentCategoryTypeOptions = useMemo(() => {
    return Array.from(currentCategoryTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type, "ru"));
  }, [currentCategoryTypes]);

  const categoryCards = useMemo(() => {
    const map = new Map<string, { count: number; image: string }>();

    for (const product of products) {
      const prev = map.get(product.category);
      if (!prev) {
        map.set(product.category, { count: 1, image: product.image });
      } else {
        map.set(product.category, {
          count: prev.count + 1,
          image: prev.image || product.image,
        });
      }
    }

    return Array.from(map.entries())
      .map(([name, meta]) => ({
        name,
        slug: slugify(name),
        count: meta.count,
        image: meta.image,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
  }, [products]);

  const brands = useMemo(() => uniqueValues(products.map((product) => product.brand)), [products]);
  const countries = useMemo(() => uniqueValues(products.map((product) => product.country)), [products]);
  const types = useMemo(() => uniqueValues(products.map((product) => product.type)), [products]);
  const dynamicFilters = useMemo(() => {
    const filtersMap = new Map<
      string,
      Omit<CatalogDynamicFilter, "min" | "max" | "values"> & { values: Set<string> }
    >();

    for (const product of products) {
      for (const filter of product.filters ?? []) {
        const current = filtersMap.get(filter.parameterId) ?? {
          id: filter.parameterId,
          groupId: filter.groupId,
          groupName: filter.groupName,
          parameterName: filter.parameterName,
          parameterType: filter.parameterType,
          unit: filter.unit,
          values: new Set<string>(),
          numericValues: [],
        };

        current.values.add(filter.value);
        if (filter.parameterType === "NUMBER" && typeof filter.numericValue === "number") {
          current.numericValues.push(filter.numericValue);
        }

        filtersMap.set(filter.parameterId, current);
      }
    }

    const hasPowerFilter = Array.from(filtersMap.values()).some((item) => item.id === "legacy-power" || item.parameterName.toLowerCase() === "мощность");
    const hasVolumeFilter = Array.from(filtersMap.values()).some((item) => item.id === "legacy-volume" || item.parameterName.toLowerCase() === "объем");

    if (!hasPowerFilter) {
      const numericValues = products.map((product) => product.power).filter((value) => value > 0);
      if (numericValues.length > 0) {
        filtersMap.set("legacy-power", {
          id: "legacy-power",
          groupId: "legacy-main",
          groupName: "Основные параметры",
          parameterName: "Мощность",
          parameterType: "NUMBER",
          unit: "кВт",
          values: new Set<string>(),
          numericValues,
          fallbackKey: "power",
        });
      }
    }

    if (!hasVolumeFilter) {
      const numericValues = products.map((product) => product.volume).filter((value) => value > 0);
      if (numericValues.length > 0) {
        filtersMap.set("legacy-volume", {
          id: "legacy-volume",
          groupId: "legacy-main",
          groupName: "Основные параметры",
          parameterName: "Объем",
          parameterType: "NUMBER",
          unit: "л",
          values: new Set<string>(),
          numericValues,
          fallbackKey: "volume",
        });
      }
    }

    return Array.from(filtersMap.values())
      .map((item) => ({
        ...item,
        min: item.parameterType === "NUMBER" ? getSafeMin(item.numericValues, 0) : 0,
        max: item.parameterType === "NUMBER" ? getSafeMax(item.numericValues, 0) : 0,
        values: Array.from(item.values).sort((left, right) => left.localeCompare(right, "ru")),
      }) satisfies CatalogDynamicFilter)
      .sort((left, right) => left.groupName.localeCompare(right.groupName, "ru") || left.parameterName.localeCompare(right.parameterName, "ru"));
  }, [products]);

  const dynamicFilterGroups = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; filters: CatalogDynamicFilter[] }>();

    for (const filter of dynamicFilters) {
      const current = grouped.get(filter.groupId) ?? { id: filter.groupId, name: filter.groupName, filters: [] };
      current.filters.push(filter);
      grouped.set(filter.groupId, current);
    }

    return Array.from(grouped.values());
  }, [dynamicFilters]);

  const globalMaxProductPrice = getSafeMax(products.map((product) => product.price), 100000);
  const itemsPerPage = isLanding ? 12 : 6;

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ?? "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, globalMaxProductPrice]);
  const [priceRangeDraft, setPriceRangeDraft] = useState<[number, number]>([0, globalMaxProductPrice]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTextFilters, setSelectedTextFilters] = useState<Record<string, string[]>>({});
  const [selectedNumericFilters, setSelectedNumericFilters] = useState<Record<string, [number, number]>>({});
  const [selectedNumericFilterDrafts, setSelectedNumericFilterDrafts] = useState<Record<string, [number, number]>>({});
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"popular" | "new" | "price-asc" | "price-desc">("popular");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [pendingCartSlug, setPendingCartSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!allFiltersOpen && !filtersOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousOverscroll = document.documentElement.style.overscrollBehavior;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;

      if (pendingOverlayScrollRef.current === "results") {
        pendingOverlayScrollRef.current = "restore";
        window.requestAnimationFrame(() => {
          resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
  }, [allFiltersOpen, filtersOpen]);

  useEffect(() => {
    if (!allFiltersOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAllFiltersOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allFiltersOpen]);

  useEffect(() => {
    setSelectedNumericFilters((prev) => {
      const next: Record<string, [number, number]> = {};
      for (const filter of dynamicFilters) {
        if (filter.parameterType !== "NUMBER") continue;
        const current = prev[filter.id];
        next[filter.id] = current ? [Math.max(filter.min, current[0]), Math.min(filter.max, current[1])] : [filter.min, filter.max];
      }
      return next;
    });
    setSelectedNumericFilterDrafts((prev) => {
      const next: Record<string, [number, number]> = {};
      for (const filter of dynamicFilters) {
        if (filter.parameterType !== "NUMBER") continue;
        const current = prev[filter.id];
        next[filter.id] = current ? [Math.max(filter.min, current[0]), Math.min(filter.max, current[1])] : [filter.min, filter.max];
      }
      return next;
    });
    setSelectedTextFilters((prev) => {
      const next: Record<string, string[]> = {};
      for (const filter of dynamicFilters) {
        if (filter.parameterType !== "TEXT") continue;
        next[filter.id] = prev[filter.id]?.filter((value) => filter.values.includes(value)) ?? [];
      }
      return next;
    });
  }, [dynamicFilters]);

  const productsBeforePriceFilter = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.article.toLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(product.country);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(product.type);
      const matchesDynamicFilters = dynamicFilters.every((filter) => {
        if (filter.parameterType === "NUMBER") {
          const selectedRange = selectedNumericFilters[filter.id] ?? [filter.min, filter.max];
          const isActive = selectedRange[0] !== filter.min || selectedRange[1] !== filter.max;

          if (!isActive) {
            return true;
          }

          const numericValue =
            filter.fallbackKey === "power"
              ? product.power
              : filter.fallbackKey === "volume"
                ? product.volume
                : product.filters?.find((item) => item.parameterId === filter.id)?.numericValue ?? null;

          return typeof numericValue === "number" && numericValue >= selectedRange[0] && numericValue <= selectedRange[1];
        }

        const selectedValues = selectedTextFilters[filter.id] ?? [];
        if (selectedValues.length === 0) {
          return true;
        }

        const filterValue = product.filters?.find((item) => item.parameterId === filter.id)?.value;
        return Boolean(filterValue && selectedValues.includes(filterValue));
      });

      return (
        matchesQuery &&
        matchesCategory &&
        matchesBrand &&
        matchesCountry &&
        matchesType &&
        matchesDynamicFilters
      );
    });
  }, [products, query, selectedCategory, selectedBrands, selectedCountries, selectedTypes, dynamicFilters, selectedNumericFilters, selectedTextFilters]);

  const maxProductPrice = useMemo(() => {
    return getSafeMax(
      productsBeforePriceFilter.map((product) => product.price),
      globalMaxProductPrice,
    );
  }, [productsBeforePriceFilter, globalMaxProductPrice]);

  function clampPriceRangeToMax(range: [number, number], max: number): [number, number] {
    const safeMax = Number.isFinite(max) ? max : globalMaxProductPrice;
    const nextFrom = Math.max(0, Math.min(range[0], safeMax));
    const nextTo = Math.max(0, Math.min(range[1], safeMax));
    if (nextFrom <= nextTo) return [nextFrom, nextTo];
    return [Math.max(0, nextTo - 1000), nextTo];
  }

  useEffect(() => {
    setPriceRange((current) => clampPriceRangeToMax(current, maxProductPrice));
    setPriceRangeDraft((current) => clampPriceRangeToMax(current, maxProductPrice));
  }, [maxProductPrice]);

  const filteredProducts = useMemo(() => {
    const next = productsBeforePriceFilter.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1]);

    next.sort((left, right) => {
      if (sortMode === "price-asc") return left.price - right.price;
      if (sortMode === "price-desc") return right.price - left.price;
      if (sortMode === "new") return (productOrderMap.get(right.slug) ?? 0) - (productOrderMap.get(left.slug) ?? 0);
      return (productOrderMap.get(left.slug) ?? 0) - (productOrderMap.get(right.slug) ?? 0);
    });

    return next;
  }, [priceRange, productOrderMap, productsBeforePriceFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageProducts = isLanding
    ? filteredProducts.slice(0, safePage * itemsPerPage)
    : filteredProducts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const visiblePercent = products.length === 0 ? 0 : Math.round((filteredProducts.length / products.length) * 100);
  const resultsAnimationKey = [
    query,
    selectedCategory,
    priceRange.join("-"),
    selectedBrands.join("-"),
    selectedCountries.join("-"),
    selectedTypes.join("-"),
    JSON.stringify(selectedNumericFilters),
    JSON.stringify(selectedTextFilters),
    safePage,
  ].join("|");

  const hasActiveFilters = useMemo(() => {
    if (query.trim().length > 0) return true;
    if (selectedCategory !== "all") return true;
    if (selectedBrands.length > 0) return true;
    if (selectedCountries.length > 0) return true;
    if (selectedTypes.length > 0) return true;
    if (priceRange[0] !== 0 || priceRange[1] !== maxProductPrice) return true;

    for (const filter of dynamicFilters) {
      if (filter.parameterType === "NUMBER") {
        const selectedRange = selectedNumericFilters[filter.id] ?? [filter.min, filter.max];
        if (selectedRange[0] !== filter.min || selectedRange[1] !== filter.max) return true;
      } else {
        const selectedValues = selectedTextFilters[filter.id] ?? [];
        if (selectedValues.length > 0) return true;
      }
    }

    return false;
  }, [
    query,
    selectedCategory,
    selectedBrands,
    selectedCountries,
    selectedTypes,
    priceRange,
    maxProductPrice,
    dynamicFilters,
    selectedNumericFilters,
    selectedTextFilters,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!isCategoryPage && selectedCategory !== "all") count += 1;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedCountries.length > 0) count += selectedCountries.length;
    if (selectedTypes.length > 0) count += selectedTypes.length;
    if (priceRange[0] !== 0 || priceRange[1] !== maxProductPrice) count += 1;

    for (const filter of dynamicFilters) {
      if (filter.parameterType === "NUMBER") {
        const selectedRange = selectedNumericFilters[filter.id] ?? [filter.min, filter.max];
        if (selectedRange[0] !== filter.min || selectedRange[1] !== filter.max) count += 1;
      } else {
        count += (selectedTextFilters[filter.id] ?? []).length;
      }
    }

    return count;
  }, [dynamicFilters, isCategoryPage, maxProductPrice, priceRange, selectedBrands, selectedCategory, selectedCountries, selectedNumericFilters, selectedTextFilters, selectedTypes]);

  useEffect(() => {
    if (!resultsTopRef.current) return;
    if (isLanding) return;
    resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [safePage]);

  useEffect(() => {
    if (!hasMountedQueryEffectRef.current) {
      hasMountedQueryEffectRef.current = true;
      return;
    }
    if (!resultsTopRef.current) return;
    resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [query]);

  useEffect(() => {
    if (!initialCategory) return;
    setSelectedCategory(initialCategory);
    setPage(1);
  }, [initialCategory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const brandFromQuery = params.get("brand")?.trim();
    const typesFromQuery = params.getAll("type").map((value) => value.trim()).filter(Boolean);

    if (typesFromQuery.length > 0) {
      const matchedTypes = types.filter((type) => typesFromQuery.some((item) => item.toLowerCase() === type.toLowerCase()));
      if (matchedTypes.length > 0) {
        setSelectedTypes(matchedTypes);
      }
    }

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

  function handleShowProducts() {
    if (typeof window === "undefined") return;

    if (isLanding && selectedCategory !== "all") {
      const params = new URLSearchParams();
      for (const type of selectedTypes) {
        params.append("type", type);
      }
      const queryString = params.toString();
      const href = `/catalog/category/${slugify(selectedCategory)}${queryString ? `?${queryString}` : ""}`;
      window.location.href = href;
      return;
    }

    pendingOverlayScrollRef.current = "results";
    setFiltersOpen(false);
    setAllFiltersOpen(false);
  }

  function closeFiltersOverlays() {
    pendingOverlayScrollRef.current = "restore";
    setFiltersOpen(false);
    setAllFiltersOpen(false);
  }

  async function handleAddToCart(slug: string) {
    if (pendingCartSlug === slug) return;

    setPendingCartSlug(slug);
    try {
      await addProductToSessionCartBySlug(slug);
    } finally {
      setPendingCartSlug((current) => (current === slug ? null : current));
    }
  }

  function toggleValue(value: string, selected: string[], setter: (values: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
    setPage(1);
  }

  function resetAllFilters() {
    setQuery("");
    setSelectedCategory(initialCategory ?? "all");
    setSelectedBrands([]);
    setSelectedCountries([]);
    setSelectedTypes([]);
    setSelectedTextFilters({});
    setSelectedNumericFilters({});
    setSelectedNumericFilterDrafts({});
    setPriceRange([0, globalMaxProductPrice]);
    setPriceRangeDraft([0, globalMaxProductPrice]);
    setPage(1);
    setSortMode("popular");
    setExpandedCategory(null);
  }

  const quickSortOptions = [
    { id: "popular", label: "По популярности" },
    { id: "price-asc", label: "По цене ↑" },
    { id: "price-desc", label: "По цене ↓" },
    { id: "new", label: "Сначала новые" },
  ] as const;

  function cycleSortMode() {
    setPage(1);
    setSortMode((current) => {
      if (current === "popular") return "price-asc";
      if (current === "price-asc") return "price-desc";
      if (current === "price-desc") return "popular";
      return "popular";
    });
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

  function renderFilters(idPrefix: string, mode: "compact" | "full", variant: "default" | "overlay" = "default") {
    const mood = visiblePercent >= 80 ? "happy" : visiblePercent >= 40 ? "neutral" : "sad";
    const isOverlay = variant === "overlay";
    const isLandingCategoryFilters = isLanding && mode === "full" && !isOverlay;
    const isCategoryTypeFilters = isCategoryPage && mode === "full" && !isOverlay;
    return (
      <div className={isOverlay ? "space-y-6 2xl:space-y-8 min-[2200px]:space-y-10" : "space-y-8"}>
        {isCategoryTypeFilters ? (
          <section>
            <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              Тип товара
            </h2>
            <div className="mt-3 border-t border-[#e7e1d9] pt-5 space-y-4">
              {currentCategoryTypeOptions.map(({ type, count }) => (
                <label key={type} className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleValue(type, selectedTypes, setSelectedTypes)}
                    className="catalog-checkbox h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                  />
                  <span className="min-w-0">
                    <span className="block">{type}</span>
                    <span className="mt-1 block text-[13px] uppercase tracking-[1.1px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {count} шт
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {isLandingCategoryFilters ? (
          <section>
            <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              Категория
            </h2>
            <div className="mt-3 border-t border-[#e7e1d9] pt-5">
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                  <input
                    type="radio"
                    name={`${idPrefix}-landing-category`}
                    checked={selectedCategory === "all"}
                    onChange={() => {
                      setSelectedCategory("all");
                      setSelectedTypes([]);
                      setPage(1);
                    }}
                    className="catalog-checkbox h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                  />
                  <span>Все категории</span>
                </label>

                {categoryTypeTree.map((item) => {
                  const isExpanded = expandedCategory === item.category;
                  const isActiveCategory = selectedCategory === item.category;

                  return (
                    <div key={item.category} className="border-b border-[#f0ebe4] pb-4 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex min-w-0 items-start gap-4 text-[18px] text-[#111] 2xl:text-[20px]">
                          <input
                            type="radio"
                            name={`${idPrefix}-landing-category`}
                            checked={isActiveCategory}
                            onChange={() => {
                              setSelectedCategory(item.category);
                              setPage(1);
                            }}
                            className="catalog-checkbox mt-1 h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                          />
                          <span className="min-w-0">
                            <span className="block">{item.category}</span>
                            <span className="mt-1 block text-[13px] uppercase tracking-[1.1px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                              {item.count} шт
                            </span>
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setExpandedCategory((current) => (current === item.category ? null : item.category))}
                          className="flex h-9 w-9 shrink-0 items-center justify-center text-[#111]"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? `Скрыть типы ${item.category}` : `Показать типы ${item.category}`}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            width="16"
                            height="16"
                            aria-hidden="true"
                            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <path d="M4 7.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      <div
                        className={`catalog-category-accordion ml-10 ${isExpanded ? "catalog-category-accordion--open" : ""}`}
                        aria-hidden={!isExpanded}
                      >
                        <div className="catalog-category-accordion__inner mt-3 space-y-3">
                          {item.types.map(({ type, count }) => (
                            <label key={type} className="flex items-center gap-4 text-[16px] text-[#6f6f69]">
                              <input
                                type="checkbox"
                                checked={selectedTypes.includes(type)}
                                onChange={() => toggleValue(type, selectedTypes, setSelectedTypes)}
                                className="catalog-checkbox h-5 w-5 border border-[#e1dbd2] transition-all duration-200"
                              />
                              <span className="min-w-0">
                                <span className="block">{type}</span>
                                <span className="mt-0.5 block text-[12px] uppercase tracking-[1px] text-[#9b9891] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                                  {count} шт
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {isOverlay ? null : (
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
              snapMaxToEnd
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
        )}

        {(() => {
          const filterGroups = [
            ["Бренд", brands],
            ...(mode === "full" ? ([["Страна производства", countries]] as const) : ([] as const)),
            ...(!isLandingCategoryFilters && !isCategoryPage && mode === "full" && !isOverlay ? ([["Тип", types]] as const) : ([] as const)),
          ] as const;

          if (isOverlay && filterGroups.length > 1) {
            return (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {filterGroups.map(([title, items]) => (
                  <section key={title}>
                    <h2 className="text-[16px] uppercase tracking-[1.6px] 2xl:text-[20px] min-[2200px]:text-[24px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</h2>
                    <div className="mt-2 border-t border-[#e7e1d9] pt-3 2xl:pt-4 [column-gap:22px] 2xl:[column-gap:30px] xl:columns-2">
                      {items.map((item, index) => {
                        const id = `${idPrefix}-${String(title).toLowerCase().replace(/\s+/g, "-")}-${index}`;
                        const [selected, setSelected] = getFilterState(String(title));

                        return (
                          <label key={item} htmlFor={id} className="mb-3 flex break-inside-avoid items-center gap-3 2xl:gap-4 min-[2200px]:gap-5 text-[14px] text-[#6f6f69] 2xl:text-[18px] min-[2200px]:text-[21px]">
                            <input
                              id={id}
                              type="checkbox"
                              checked={selected.includes(item)}
                              onChange={() => toggleValue(item, selected, setSelected)}
                              className="catalog-checkbox h-5 w-5 2xl:h-6 2xl:w-6 min-[2200px]:h-7 min-[2200px]:w-7 border border-[#e1dbd2] transition-all duration-200"
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            );
          }

          return filterGroups.map(([title, items]) => (
            <section key={title}>
              <h2
                className={`${isOverlay ? "text-[16px] 2xl:text-[20px] min-[2200px]:text-[24px]" : "text-[20px] 2xl:text-[22px]"} uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}
              >
                {title}
              </h2>
              <div
                className={[
                  "mt-3 border-t border-[#e7e1d9]",
                  isOverlay ? "pt-4 2xl:pt-5 [column-gap:26px] 2xl:[column-gap:32px] xl:columns-2" : "space-y-5 pt-5",
                ].join(" ")}
              >
                {items.map((item, index) => {
                  const id = `${idPrefix}-${String(title).toLowerCase().replace(/\s+/g, "-")}-${index}`;
                  const [selected, setSelected] = getFilterState(String(title));

                  return (
                    <label
                      key={item}
                      htmlFor={id}
                      className={[
                        "flex items-center gap-4 text-[#6f6f69]",
                        isOverlay ? "mb-4 2xl:mb-5 break-inside-avoid text-[14px] 2xl:text-[18px] min-[2200px]:text-[21px]" : "text-[18px] 2xl:text-[20px]",
                      ].join(" ")}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={selected.includes(item)}
                        onChange={() => toggleValue(item, selected, setSelected)}
                        className={[
                          "catalog-checkbox border border-[#e1dbd2] transition-all duration-200",
                          isOverlay ? "h-5 w-5 2xl:h-6 2xl:w-6 min-[2200px]:h-7 min-[2200px]:w-7" : "h-6 w-6",
                        ].join(" ")}
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ));
        })()}
        {!isLandingCategoryFilters && mode === "full"
          ? dynamicFilterGroups.map((group) => {
          const visibleFilters = group.filters.filter((filter) => {
            if (!isCategoryPage) return true;
            return filter.fallbackKey !== "power" && filter.fallbackKey !== "volume";
          });

          if (visibleFilters.length === 0) {
            return null;
          }

          return (
            <section key={group.id} className={isOverlay ? "space-y-4 2xl:space-y-5 min-[2200px]:space-y-6" : "space-y-6"}>
            <h2
              className={`${isOverlay ? "text-[16px] 2xl:text-[20px] min-[2200px]:text-[24px]" : "text-[20px] 2xl:text-[22px]"} uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}
            >
              {group.name}
            </h2>
            {isOverlay ? (
              <>
                {(() => {
                  const numberFilters = visibleFilters.filter((filter) => filter.parameterType === "NUMBER");
                  if (numberFilters.length === 0) return null;

                  return (
                    <div className="grid grid-cols-1 gap-6 2xl:gap-8 min-[2200px]:gap-10 lg:grid-cols-2">
                      {numberFilters.map((filter) => (
                        <RangeFilter
                          key={filter.id}
                          title={`${filter.parameterName}${filter.unit ? ` (${filter.unit})` : ""}`}
                          min={filter.min}
                          max={filter.max}
                          step={0.1}
                          dense
                          value={selectedNumericFilterDrafts[filter.id] ?? [filter.min, filter.max]}
                          ariaLabelMin={`Минимум ${filter.parameterName.toLowerCase()}`}
                          ariaLabelMax={`Максимум ${filter.parameterName.toLowerCase()}`}
                          onChange={(value) => setSelectedNumericFilterDrafts((prev) => ({ ...prev, [filter.id]: value }))}
                          onCommit={(value) => {
                            const current = selectedNumericFilters[filter.id] ?? [filter.min, filter.max];
                            if (current[0] === value[0] && current[1] === value[1]) return;
                            setSelectedNumericFilters((prev) => ({ ...prev, [filter.id]: value }));
                            setPage(1);
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}

                {visibleFilters
                  .filter((filter) => filter.parameterType === "TEXT")
                  .map((filter) => (
                    <section key={filter.id}>
                      <h3 className="text-[14px] uppercase tracking-[1.4px] 2xl:text-[18px] min-[2200px]:text-[21px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        {filter.parameterName}
                      </h3>
                      <div className="mt-3 border-t border-[#e7e1d9] pt-4 2xl:pt-5 [column-gap:26px] 2xl:[column-gap:32px] xl:columns-2">
                        {filter.values.map((item, index) => {
                          const id = `${idPrefix}-${filter.id}-${index}`;
                          const selected = selectedTextFilters[filter.id] ?? [];

                          return (
                            <label key={item} htmlFor={id} className="mb-4 2xl:mb-5 flex break-inside-avoid items-center gap-4 2xl:gap-5 text-[14px] text-[#6f6f69] 2xl:text-[18px] min-[2200px]:text-[21px]">
                              <input
                                id={id}
                                type="checkbox"
                                checked={selected.includes(item)}
                                onChange={() => {
                                  setSelectedTextFilters((prev) => {
                                    const current = prev[filter.id] ?? [];
                                    return {
                                      ...prev,
                                      [filter.id]: current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                                    };
                                  });
                                  setPage(1);
                                }}
                                className="catalog-checkbox h-5 w-5 2xl:h-6 2xl:w-6 min-[2200px]:h-7 min-[2200px]:w-7 border border-[#e1dbd2] transition-all duration-200"
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
              </>
            ) : (
              visibleFilters.map((filter) =>
                filter.parameterType === "NUMBER" ? (
                  <RangeFilter
                    key={filter.id}
                    title={`${filter.parameterName}${filter.unit ? ` (${filter.unit})` : ""}`}
                    min={filter.min}
                    max={filter.max}
                    step={0.1}
                    value={selectedNumericFilterDrafts[filter.id] ?? [filter.min, filter.max]}
                    ariaLabelMin={`Минимум ${filter.parameterName.toLowerCase()}`}
                    ariaLabelMax={`Максимум ${filter.parameterName.toLowerCase()}`}
                    onChange={(value) => setSelectedNumericFilterDrafts((prev) => ({ ...prev, [filter.id]: value }))}
                    onCommit={(value) => {
                      const current = selectedNumericFilters[filter.id] ?? [filter.min, filter.max];
                      if (current[0] === value[0] && current[1] === value[1]) return;
                      setSelectedNumericFilters((prev) => ({ ...prev, [filter.id]: value }));
                      setPage(1);
                    }}
                  />
                ) : (
                  <section key={filter.id}>
                    <h3 className="text-[18px] uppercase tracking-[1.4px] 2xl:text-[20px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      {filter.parameterName}
                    </h3>
                    <div className="mt-3 space-y-5 border-t border-[#e7e1d9] pt-5">
                      {filter.values.map((item, index) => {
                        const id = `${idPrefix}-${filter.id}-${index}`;
                        const selected = selectedTextFilters[filter.id] ?? [];

                        return (
                          <label key={item} htmlFor={id} className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                            <input
                              id={id}
                              type="checkbox"
                              checked={selected.includes(item)}
                              onChange={() => {
                                setSelectedTextFilters((prev) => {
                                  const current = prev[filter.id] ?? [];
                                  return {
                                    ...prev,
                                    [filter.id]: current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                                  };
                                });
                                setPage(1);
                              }}
                              className="catalog-checkbox h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ),
              )
            )}
          </section>
          );
        })
          : null}

        {mode === "compact" ? (
          <button
            type="button"
            onClick={() => setAllFiltersOpen(true)}
            className="h-12 w-full border border-[#e7e1d9] bg-white text-[13px] uppercase tracking-[1.4px] text-[#111] transition-colors hover:border-[#d3b46a] md:h-14 md:text-[15px] 2xl:h-16 2xl:text-[16px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
          >
            Все фильтры
          </button>
        ) : null}
      </div>
    );
  }

  function renderCategoryTiles() {
    return (
      <section>
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-[20px] uppercase tracking-[1.6px] md:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            Категории
          </h2>
          <span className="text-[13px] uppercase tracking-[1.3px] text-[#7a7a75] md:text-[14px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            Выберите раздел
          </span>
        </div>

        <div
          className="mt-4 grid content-start grid-cols-2 gap-2 auto-rows-[minmax(120px,170px)] sm:grid-cols-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 2xl:grid-cols-5"
          style={{ gridAutoFlow: "dense" }}
        >
          {categoryCards.map((category, index) => (
            <a
              key={category.slug}
              href={`/catalog/category/${category.slug}`}
              className={[
                "group flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#e7e1d9] bg-white",
                "transition-shadow hover:shadow-[0_16px_34px_rgba(38,35,31,0.08)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2a27]/40",
                getCategorySizeClass(category.name, index),
              ].join(" ")}
            >
              <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f7f7f9] p-2 md:p-3">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="max-h-full w-auto max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="h-full w-full rounded-[14px] bg-[#f0efec]" aria-hidden />
                )}
              </div>

              <div className="bg-white px-3 py-3 md:px-4 md:py-3">
                <h3 className="text-[13px] font-medium leading-[1.2] md:text-[14px] [font-family:Manrope,system-ui]">{category.name}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader lockScrolledState={filtersOpen || allFiltersOpen} />

        <section className="px-4 py-10 md:px-10 md:py-14">
          <div className="mx-auto max-w-[1480px] 2xl:max-w-[1860px]">
          <div className="breadcrumb-nav uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/" className="hover:text-[#111]">Главная</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
           <a href="/catalog" className="hover:text-[#111]">Каталог</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <span className="break-words">
              {isCategoryPage ? (initialCategory ?? "") : "оборудование и климатические системы"}
            </span>
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,9vw,7rem)] leading-[0.96] tracking-[-0.03em] md:mt-10 md:tracking-[-0.04em] 2xl:leading-[0.92] [font-family:'Cormorant_Garamond',serif]">
            Каталог оборудования
          </h1>
          <p className="mt-4 text-[clamp(0.9rem,3.8vw,1.5rem)] uppercase tracking-[1.3px] text-[#7a7a75] md:mt-8 md:tracking-[1.6px] 2xl:text-[24px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            {filteredProducts.length} товаров в наличии
          </p>

          <div className="mt-8 flex flex-col gap-8 md:mt-12 md:gap-10 xl:flex-row 2xl:gap-14">
            <aside className="hidden w-full xl:sticky xl:top-[calc(var(--site-header-offset,76px)+6px)] xl:block xl:max-h-[calc(100vh-var(--site-header-offset,76px)-14px)] xl:overflow-y-auto xl:self-start xl:max-w-[360px] 2xl:max-w-[420px]">
              {renderFilters("desktop", "compact")}
            </aside>

            <div className={`fixed inset-0 z-[240] ${allFiltersOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!allFiltersOpen}>
              <button
                type="button"
                aria-label="Закрыть фильтры"
                onClick={closeFiltersOverlays}
                className={`absolute inset-0 bg-[rgba(20,18,14,0.38)] backdrop-blur-[6px] transition-opacity duration-300 ${allFiltersOpen ? "opacity-100" : "opacity-0"}`}
              />
              <div className={`absolute inset-0 flex items-center justify-center overflow-y-auto px-4 py-8 transition-opacity duration-300 md:px-8 md:py-14 2xl:px-10 min-[2200px]:px-14 ${allFiltersOpen ? "opacity-100" : "opacity-0"}`}>
                <div className="mx-auto w-full max-w-[1120px] 2xl:max-w-[1560px] min-[2200px]:max-w-[1820px]">
                  <aside
                    role="dialog"
                    aria-modal="true"
                    aria-label="Все фильтры"
                    className="overflow-hidden rounded-[30px] 2xl:rounded-[34px] min-[2200px]:rounded-[40px] border border-[rgba(231,225,217,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,246,241,0.96)_100%)] shadow-[0_32px_90px_rgba(18,16,12,0.20)]"
                  >
                    <div className="flex max-h-[min(84vh,860px)] 2xl:max-h-[min(87vh,1120px)] min-[2200px]:max-h-[min(89vh,1260px)] min-h-0 flex-col">
                      <div className="flex items-center justify-between border-b border-[#ebe4da] px-5 py-4 md:px-7 md:py-5 2xl:px-12 2xl:py-8 min-[2200px]:px-14 min-[2200px]:py-9">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8d857a] [font-family:Jaldi,'JetBrains_Mono',monospace] md:text-[12px] 2xl:text-[15px] min-[2200px]:text-[17px]">
                            Каталог
                          </p>
                          <p className="mt-1 text-[18px] uppercase tracking-[1.4px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace] md:text-[20px] 2xl:text-[31px] min-[2200px]:text-[38px]">
                            Все фильтры
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={closeFiltersOverlays}
                          className="flex h-11 w-11 2xl:h-15 2xl:w-15 min-[2200px]:h-[72px] min-[2200px]:w-[72px] items-center justify-center rounded-full border border-[#ddd4c8] bg-white/88 text-[24px] 2xl:text-[32px] min-[2200px]:text-[38px] leading-none text-[#111] transition-colors hover:border-[#d3b46a] hover:text-[#7f6522]"
                          aria-label="Закрыть фильтры"
                        >
                          ×
                        </button>
                      </div>

                      <div className="min-h-0 overflow-y-auto px-5 py-5 md:px-7 md:py-6 2xl:px-12 2xl:py-9 min-[2200px]:px-14 min-[2200px]:py-11">
                        {renderFilters("desktop-all", "full", "overlay")}
                      </div>

                      <div className="border-t border-[#ebe4da] bg-[rgba(255,251,246,0.92)] px-5 py-4 md:px-7 md:py-5 2xl:px-12 2xl:py-8 min-[2200px]:px-14 min-[2200px]:py-9">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                          {hasActiveFilters ? (
                            <button
                              type="button"
                              onClick={resetAllFilters}
                              className="h-11 rounded-[18px] 2xl:h-16 2xl:rounded-[24px] min-[2200px]:h-[72px] min-[2200px]:rounded-[26px] border border-[#ddd4c8] bg-white px-5 2xl:px-8 min-[2200px]:px-10 text-[13px] uppercase tracking-[1.3px] text-[#111] transition-colors hover:border-[#d3b46a] hover:text-[#7f6522] md:h-12 md:text-[14px] 2xl:text-[19px] min-[2200px]:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                            >
                              Сбросить
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={handleShowProducts}
                            className="h-11 rounded-[18px] 2xl:h-16 2xl:rounded-[24px] min-[2200px]:h-[72px] min-[2200px]:rounded-[26px] bg-[#111] px-7 2xl:px-12 min-[2200px]:px-14 text-[13px] uppercase tracking-[1.4px] text-white transition-colors hover:bg-[#2a2a26] md:h-12 md:min-w-[240px] 2xl:min-w-[360px] min-[2200px]:min-w-[420px] md:text-[14px] md:tracking-[1.6px] 2xl:text-[19px] min-[2200px]:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                          >
                            Показать товары
                          </button>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>

            <div className={`fixed inset-0 z-[240] xl:hidden ${filtersOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!filtersOpen}>
              <button
                type="button"
                aria-label="Закрыть фильтры"
                onClick={closeFiltersOverlays}
                className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${filtersOpen ? "opacity-100" : "opacity-0"}`}
              />
              <aside
                className={`absolute left-0 top-0 h-full w-[min(92vw,420px)] overflow-y-auto bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-out ${
                  filtersOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div className="mb-8 flex items-center justify-between border-b border-[#e7e1d9] pb-4">
                  <p className="text-[22px] uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Фильтры</p>
                  <button type="button" onClick={closeFiltersOverlays} className="text-[32px] leading-none text-[#111]" aria-label="Закрыть фильтры">
                    x
                  </button>
                </div>
                {renderFilters("mobile", "full")}
                <button
                  type="button"
                  onClick={handleShowProducts}
                  className="mt-8 h-12 w-full bg-[#111] text-[14px] uppercase tracking-[1.5px] text-white md:mt-10 md:h-14 md:text-[16px] md:tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                >
                  Показать товары
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-3 h-12 w-full border border-[#e7e1d9] bg-white text-[13px] uppercase tracking-[1.4px] text-[#111] transition-colors hover:border-[#d3b46a] md:h-14 md:text-[15px] md:tracking-[1.8px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    Сбросить фильтры
                  </button>
                ) : null}
              </aside>
            </div>

            <div className="flex-1">
              {isLanding && !hasActiveFilters ? <div className="mb-10">{renderCategoryTiles()}</div> : null}

              {isLanding ? (
                <div className="mb-6 md:mb-8">
                  <h2 className="text-[22px] uppercase tracking-[1.6px] md:text-[26px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Популярные товары
                  </h2>
                  <p className="mt-2 text-[14px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Показано {pageProducts.length} из {filteredProducts.length}
                  </p>
                </div>
              ) : null}

              <div className="relative">
                <div
                  className={`sticky top-[calc(var(--site-header-offset,76px)+2px)] z-[110] py-2 md:z-[120] md:py-4 ${
                    isLanding ? "lg:top-[calc(var(--site-header-offset,76px)+6px)]" : "md:top-[calc(var(--site-header-offset,76px)+6px)]"
                  }`}
                >
                  <div className="ml-auto w-full md:w-fit">
                    <div className="flex flex-col gap-2 rounded-[28px] border border-white/70 bg-[rgba(255,253,250,0.82)] p-2 shadow-[0_16px_40px_rgba(17,17,17,0.08)] backdrop-blur-[18px] md:flex-row md:flex-wrap md:items-center md:gap-3 md:rounded-[32px] md:p-3">
                      <div className="grid grid-cols-[1.3fr_1fr_auto] gap-2 md:hidden">
                        <div className="relative flex h-12 min-w-0 items-center rounded-[20px] border border-[#e7e1d9] bg-white pl-11 pr-3 transition-colors focus-within:border-[#d3b46a]">
                          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a75]">
                            <circle cx="11" cy="11" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
                            <path d="M16.2 16.2l4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                          <input
                            type="text"
                            value={query}
                            onChange={(event) => {
                              setQuery(event.target.value);
                              setPage(1);
                            }}
                            placeholder="Поиск"
                            className="w-full min-w-0 border-0 bg-transparent text-[15px] text-[#3c3c38] placeholder:text-[#bdbcb7] focus:outline-none [font-family:DM_Sans,Manrope,sans-serif]"
                          />
                          {query ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuery("");
                                setPage(1);
                              }}
                              className="ml-2 flex h-8 w-8 items-center justify-center text-[#7a7a75]"
                              aria-label="Очистить поиск"
                            >
                              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                                <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={cycleSortMode}
                          className="flex h-12 items-center justify-center overflow-hidden rounded-[20px] border border-[#e7e1d9] bg-white px-3 text-center text-[11px] uppercase leading-[1.05] tracking-[1px] text-[#111] transition-colors hover:border-[#d3b46a] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                          aria-label="Изменить сортировку"
                        >
                          <span key={sortMode} className="catalog-sort-label-roll">
                            {sortMode === "price-asc"
                              ? "по цене ↑"
                              : sortMode === "price-desc"
                                ? "по цене ↓"
                                : sortMode === "new"
                                  ? "сначала новые"
                                  : "по популярности"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFiltersOpen(true)}
                          className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-[20px] border border-[#e7e1d9] bg-white px-3 text-[11px] uppercase tracking-[1px] text-[#111] transition-colors hover:border-[#d3b46a] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                        >
                          <span className="truncate">{activeFiltersCount > 0 ? formatFilterCountLabel(activeFiltersCount) : "фильтры"}</span>
                          {activeFiltersCount > 0 ? (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                resetAllFilters();
                              }}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return;
                                event.preventDefault();
                                event.stopPropagation();
                                resetAllFilters();
                              }}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#d9d3ca] text-[#7a7a75] transition-colors hover:border-[#d3b46a] hover:text-[#111]"
                              aria-label="Сбросить фильтры"
                            >
                              <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                                <path d="M4 4l8 8m0-8l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </span>
                          ) : null}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                        className="hidden h-12 items-center justify-center rounded-[20px] border border-[#e7e1d9] bg-white px-4 text-[13px] uppercase tracking-[1.2px] transition-colors hover:border-[#d3b46a] md:flex md:h-16 md:px-5 md:text-[16px] md:tracking-[1.6px] xl:hidden 2xl:h-[72px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                      >
                        {activeFiltersCount > 0 ? `Фильтры (${activeFiltersCount})` : "Фильтры"}
                      </button>

                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="hidden h-12 items-center justify-center rounded-[20px] border border-[#e7e1d9] bg-white px-4 text-[13px] uppercase tracking-[1.2px] text-[#111] transition-colors hover:border-[#d3b46a] md:flex md:h-16 md:px-5 md:text-[16px] md:tracking-[1.6px] 2xl:h-[72px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                        >
                          Сбросить
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                        className="hidden h-12 w-12 items-center justify-center rounded-[20px] border border-[#e7e1d9] bg-white transition-colors hover:border-[#d3b46a] md:flex md:h-16 md:w-16 2xl:h-[72px] 2xl:w-[72px]"
                        aria-pressed={showAdvanced}
                        aria-label="Показать расширенные фильтры и сортировку"
                      >
                        <img src="/catalog/list-icon.png" alt="" aria-hidden="true" width="28" height="28" className="h-5 w-5 object-contain md:h-7 md:w-7" />
                      </button>

                      <div className="relative hidden h-12 min-w-0 flex-1 items-center rounded-[20px] border border-[#e7e1d9] bg-white pl-11 pr-3 transition-colors focus-within:border-[#d3b46a] md:flex md:h-16 md:w-[380px] md:flex-none md:pl-12 md:pr-4 2xl:h-[72px] 2xl:w-[420px] 2xl:pl-14 2xl:pr-5">
                        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a75] md:left-4 2xl:left-5">
                          <circle cx="11" cy="11" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
                          <path d="M16.2 16.2l4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        </svg>
                        <input
                          type="text"
                          value={query}
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setPage(1);
                          }}
                          placeholder="Поиск по каталогу"
                          className="w-full min-w-0 border-0 bg-transparent text-[16px] text-[#3c3c38] placeholder:text-[#c2c2bf] focus:outline-none md:text-[20px] 2xl:text-[22px] [font-family:DM_Sans,Manrope,sans-serif]"
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
                        ) : null}
                      </div>
                    </div>
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
                      {quickSortOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSortMode(option.id);
                            setPage(1);
                          }}
                          className={`border px-4 py-2 ${
                            sortMode === option.id
                              ? "border-[#111] bg-[#111] text-white"
                              : "border-[#111] text-[#111] hover:border-[#d3b46a] hover:text-[#7f6522]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                ) : (
                  <div
                    key={resultsAnimationKey}
                    className={`catalog-results mt-10 grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-2 ${isLanding ? "xl:grid-cols-4 2xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-3"} 2xl:gap-10`}
                  >
                    {pageProducts.map((product, index) => (
                      <article
                        key={product.slug}
                        style={{ animationDelay: `${index * 60}ms` }}
                        className="catalog-card group flex h-full flex-col border border-[#ebe5de] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#d8ccb8] hover:shadow-[0_16px_40px_rgba(17,17,17,0.06)] md:p-9 2xl:p-11"
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
                        <div className="mt-4 flex flex-1 flex-col md:mt-8">
                          <p className="text-[10px] uppercase tracking-[1.6px] text-[#7a7a75] md:text-[14px] md:tracking-[2.4px] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{product.brandLabel}</p>
                          <h3 className="mt-3 min-h-[72px] break-words hyphens-auto text-[16px] leading-[1.12] md:mt-4 md:min-h-[120px] md:text-[26px] md:leading-[1.15] 2xl:min-h-[140px] 2xl:text-[30px] [font-family:DM_Sans,Manrope,sans-serif]">
                            <a href={`/catalog/${product.slug}`} className="block break-words hyphens-auto">
                              {product.title}
                            </a>
                          </h3>
                          <div className="mt-3 min-h-[34px] space-y-0.5 text-[11px] leading-[1.35] text-[#7a7a75] md:mt-5 md:min-h-[56px] md:space-y-1 md:text-[17px] md:leading-7 2xl:min-h-[60px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                            <p>{product.rating}</p>
                            <p>{product.efficiency}</p>
                          </div>
                          <p className="mt-auto pt-5 text-[clamp(1.15rem,3.6vw,1.5rem)] leading-none tabular-nums whitespace-nowrap md:pt-8 md:text-[clamp(1.9rem,3.8vw,2.6rem)] lg:text-[clamp(1.8rem,2.4vw,2.2rem)] 2xl:text-[clamp(2rem,1.9vw,2.5rem)] [font-family:DM_Sans,Manrope,sans-serif]">
                            {formatPrice(product.price)}
                          </p>
                          <div className="mt-4 grid gap-2 md:mt-8 md:gap-3">
                            <button
                              type="button"
                              onClick={() => void handleAddToCart(product.slug)}
                              disabled={pendingCartSlug === product.slug}
                              className="inline-flex h-11 items-center justify-center bg-[#111] px-2 text-[10px] uppercase tracking-[1.3px] text-white transition-all duration-300 hover:bg-[#2a2a26] disabled:cursor-wait disabled:bg-[#2a2a26] md:h-16 md:text-[18px] md:tracking-[2px] md:hover:tracking-[2.5px] 2xl:h-[70px] 2xl:text-[19px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                            >
                              {pendingCartSlug === product.slug ? "добавляем" : "в корзину"}
                            </button>
                            <a
                              href={`/checkout?buy=${product.slug}`}
                              className="inline-flex min-h-[52px] items-center justify-center border border-[#111] px-2 py-2 text-center text-[10px] uppercase tracking-[1.1px] text-[#111] transition-all duration-300 hover:border-[#d3b46a] hover:text-[#7f6522] md:h-16 md:min-h-0 md:text-[18px] md:tracking-[2px] 2xl:h-[70px] 2xl:text-[19px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
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
              </div>

              {isLanding ? (
                pageProducts.length < filteredProducts.length ? (
                  <div className="mt-10 border-t border-[#ebe5de] pt-7 md:mt-14 md:pt-10">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      className="mx-auto flex h-14 w-full max-w-[420px] items-center justify-center bg-[#111] text-[14px] uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#2a2a26] md:h-16 md:text-[16px] md:tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                    >
                      Загрузить еще
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 border-t border-[#ebe5de] pt-6 text-center text-[14px] uppercase tracking-[1.2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace] md:mt-10">
                    Все товары загружены
                  </div>
                )
              ) : totalPages > 1 ? (
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

function getCategorySizeClass(categoryName: string, index: number) {
  if (categoryName.trim().toLowerCase() === "конвекторы") {
    return "";
  }

  const pattern = index % 12;

  if (pattern === 0 || pattern === 7) return "md:row-span-2";
  if (pattern === 5) return "md:row-span-2";
  return "";
}

type DoubleRangeProps = {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  ariaLabelMin: string;
  ariaLabelMax: string;
  snapMaxToEnd?: boolean;
  showPercent?: boolean;
  formatValue: (value: number) => string;
  onChange: (value: [number, number]) => void;
  onCommit: (value: [number, number]) => void;
};

function DoubleRange({
  min,
  max,
  step,
  value,
  ariaLabelMin,
  ariaLabelMax,
  snapMaxToEnd = false,
  showPercent = true,
  formatValue,
  onChange,
  onCommit,
}: DoubleRangeProps) {
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
  const trackMax = snapMaxToEnd ? Math.floor((max - min) / step) * step + min : max;
  const sliderFrom = Math.max(min, Math.min(from, trackMax));
  const sliderTo = Math.max(min, Math.min(to, trackMax));

  const distance = trackMax - min || 1;
  const minPercent = ((sliderFrom - min) / distance) * 100;
  const maxPercent = ((sliderTo - min) / distance) * 100;

  function updateMin(next: number) {
    const maxAllowedFrom = (snapMaxToEnd ? sliderTo : to) - step;
    const nextFrom = Math.max(min, Math.min(next, maxAllowedFrom));
    const nextValue: [number, number] = [nextFrom, to];
    lastValueRef.current = nextValue;
    onChange(nextValue);
  }

  function updateMax(next: number) {
    const shouldSnapToMax = snapMaxToEnd && next >= trackMax;
    const nextMax = shouldSnapToMax ? max : next;
    const minAllowedTo = (snapMaxToEnd ? sliderFrom : from) + step;
    const nextTo = Math.min(max, Math.max(nextMax, minAllowedTo));
    const nextValue: [number, number] = [from, nextTo];
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
        <span>{formatValue(snapMaxToEnd && sliderTo >= trackMax ? max : to)}</span>
      </div>
      <div className="catalog-double-range__control">
        <input
          type="range"
          min={min}
          max={trackMax}
          step={step}
          value={sliderFrom}
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
          max={trackMax}
          step={step}
          value={sliderTo}
          aria-label={ariaLabelMax}
          data-range="max"
          onChange={(event) => updateMax(Number(event.target.value))}
          onMouseUp={commitCurrentValue}
          onTouchEnd={commitCurrentValue}
          onKeyUp={commitCurrentValue}
          onBlur={commitCurrentValue}
        />
      </div>
      {showPercent ? (
        <div className="mt-3 text-center text-[14px] text-[#7a7a75] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
          {Math.round(maxPercent - minPercent)}%
        </div>
      ) : null}
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
  dense?: boolean;
  onChange: (value: [number, number]) => void;
  onCommit: (value: [number, number]) => void;
};

function RangeFilter({ title, min, max, step, value, ariaLabelMin, ariaLabelMax, dense = false, onChange, onCommit }: RangeFilterProps) {
  return (
    <section>
      <h2 className={`${dense ? "text-[16px] 2xl:text-[18px]" : "text-[20px] 2xl:text-[22px]"} uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}>{title}</h2>
      <div className={`mt-3 border-t border-[#e7e1d9] ${dense ? "pt-4" : "pt-5"}`}>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`${dense ? "px-3 py-3 text-[14px] 2xl:text-[15px]" : "px-4 py-4 text-[18px] 2xl:text-[20px]"} border border-[#e7e1d9] text-center uppercase tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}
          >
            мин: {value[0].toFixed(1)}
          </div>
          <div
            className={`${dense ? "px-3 py-3 text-[14px] 2xl:text-[15px]" : "px-4 py-4 text-[18px] 2xl:text-[20px]"} border border-[#e7e1d9] text-center uppercase tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}
          >
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
          showPercent={!dense}
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
