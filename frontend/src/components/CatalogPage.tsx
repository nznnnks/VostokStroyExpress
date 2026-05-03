import { useMemo, useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { formatPrice, type Product } from "../data/products";
import { loadCatalogListing, type CatalogListingResponse } from "../lib/catalog-api";
import { slugify } from "../lib/slug";
import {
  SESSION_CART_UPDATED_EVENT,
  addProductToSessionCart,
  loadSessionCart,
  updateSessionCartItem,
} from "../lib/session-cart";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

type CatalogPageProps = {
  initialProducts: Product[];
  initialMeta: CatalogListingResponse["meta"];
  initialTotal: number;
  initialTotalAll: number;
  initialHasMore: boolean;
  initialLimit?: number;
  initialCategory?: string;
  variant?: "default" | "landing";
};

type CatalogDynamicFilter = {
  id: string;
  groupId: string;
  groupName: string;
  groupSlug?: string;
  parameterName: string;
  parameterSlug?: string;
  parameterType: "TEXT" | "NUMBER";
  unit?: string;
  values: string[];
  numericValues: number[];
  min: number;
  max: number;
  fallbackKey?: "power" | "volume";
};

export function CatalogPage({
  initialProducts,
  initialMeta,
  initialTotal,
  initialTotalAll,
  initialHasMore,
  initialLimit = 24,
  initialCategory,
  variant = "default",
}: CatalogPageProps) {
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const desktopFiltersRef = useRef<HTMLElement | null>(null);
  const landingCategoryTreeRef = useRef(initialMeta.categoryTypeTree);
  const hasMountedQueryEffectRef = useRef(false);
  const pendingOverlayScrollRef = useRef<"restore" | "results">("restore");
  const isLanding = variant === "landing";
  const isCategoryPage = Boolean(initialCategory && initialCategory !== "all");
  const [desktopFiltersTop, setDesktopFiltersTop] = useState(24);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [catalogMeta, setCatalogMeta] = useState<CatalogListingResponse["meta"]>(initialMeta);
  const [catalogTotal, setCatalogTotal] = useState(initialTotal);
  const [catalogTotalAll, setCatalogTotalAll] = useState(initialTotalAll);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const requestIdRef = useRef(0);
  const cartSyncRequestIdRef = useRef(0);
  const searchDebounceTimeoutRef = useRef<number | null>(null);
  const suppressCatalogReloadRef = useRef(false);
  const lastMetaRequestKeyRef = useRef<string | null>(null);
  const prefetchRequestIdRef = useRef(0);
  const prefetchedPageRef = useRef<{
    signature: string;
    page: number;
    response: CatalogListingResponse;
  } | null>(null);
  const cartQuantitiesRef = useRef<Record<string, number>>({});
  const cartSyncInFlightRef = useRef<Set<string>>(new Set());
  const pendingCartQuantityRef = useRef<Record<string, number>>({});
  const previousDynamicFilterBoundsRef = useRef<Record<string, [number, number]>>({});
  const formatFilterCountLabel = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} фильтр`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} фильтра`;
    return `${count} фильтров`;
  };
  const categoryTypeTree = isLanding ? landingCategoryTreeRef.current : catalogMeta.categoryTypeTree;
  const currentCategoryTypeOptions = catalogMeta.currentCategoryTypes;
  const categoryCards = useMemo(
    () => catalogMeta.categoryCards.map((item) => ({ ...item, image: item.image ?? "/catalog/product-1.png" })),
    [catalogMeta.categoryCards],
  );
  const brands = catalogMeta.brands;
  const countries = catalogMeta.countries;
  const types = catalogMeta.types;
  const dynamicFilters = useMemo(
    () =>
      catalogMeta.dynamicFilters.map((item) => ({
        ...item,
        fallbackKey:
          item.id === "legacy-power" ? "power" : item.id === "legacy-volume" ? "volume" : undefined,
      })) satisfies CatalogDynamicFilter[],
    [catalogMeta.dynamicFilters],
  );

  const dynamicFilterGroups = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; filters: CatalogDynamicFilter[] }>();

    for (const filter of dynamicFilters) {
      const current = grouped.get(filter.groupId) ?? { id: filter.groupId, name: filter.groupName, filters: [] };
      current.filters.push(filter);
      grouped.set(filter.groupId, current);
    }

    return Array.from(grouped.values());
  }, [dynamicFilters]);

  const globalMaxProductPrice = Math.max(100000, catalogMeta.maxPrice || 0);
  const itemsPerPage = initialLimit;

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
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
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const [brandsCollapsed, setBrandsCollapsed] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"popular" | "new" | "price-asc" | "price-desc">("popular");
  const isSortApplied = sortMode !== "popular";
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [pendingCartSlug, setPendingCartSlug] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [animatedCartSlug, setAnimatedCartSlug] = useState<string | null>(null);

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
      }
    };
  }, [allFiltersOpen, filtersOpen]);

  useEffect(() => {
    let active = true;

    const syncCartQuantities = async () => {
      const requestId = ++cartSyncRequestIdRef.current;
      try {
        const cart = await loadSessionCart();
        if (!active || requestId !== cartSyncRequestIdRef.current) return;
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [item.slug, item.qty])));
      } catch {
        if (!active || requestId !== cartSyncRequestIdRef.current) return;
      }
    };

    void syncCartQuantities();

    const handleCartUpdated = () => {
      void syncCartQuantities();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(SESSION_CART_UPDATED_EVENT, handleCartUpdated as EventListener);
    }

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(SESSION_CART_UPDATED_EVENT, handleCartUpdated as EventListener);
      }
    };
  }, []);

  useEffect(() => {
    cartQuantitiesRef.current = cartQuantities;
  }, [cartQuantities]);

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
    if (typeof window === "undefined") return;

    const element = desktopFiltersRef.current;
    if (!element) return;

    let rafId: number | null = null;

    const updateDesktopFiltersPosition = () => {
      if (window.innerWidth < 1280) {
        setDesktopFiltersTop(24);
        return;
      }

      const headerOffsetRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-header-offset")
        .trim();
      const headerOffset = Number.parseFloat(headerOffsetRaw) || 76;
      const viewportHeight = window.innerHeight;
      const elementHeight = element.getBoundingClientRect().height;
      const availableHeight = Math.max(viewportHeight - headerOffset - 24, 0);
      const centeredOffset = Math.max((availableHeight - elementHeight) / 2, 12);

      setDesktopFiltersTop((current) => {
        const next = Math.round(headerOffset + centeredOffset);
        return current === next ? current : next;
      });
    };

    const scheduleUpdate = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateDesktopFiltersPosition();
      });
    };

    scheduleUpdate();
    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(() => scheduleUpdate()) : null;
    resizeObserver?.observe(element);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [
    brandsCollapsed,
    categoriesCollapsed,
    dynamicFilters.length,
    initialCategory,
    isCategoryPage,
    products.length,
    showAdvanced,
  ]);

  useEffect(() => {
    const previousBounds = previousDynamicFilterBoundsRef.current;
    setSelectedNumericFilters((prev) => {
      const next: Record<string, [number, number]> = {};
      for (const filter of dynamicFilters) {
        if (filter.parameterType !== "NUMBER") continue;
        const current = prev[filter.id];
        const priorBounds = previousBounds[filter.id];
        const wasUsingPreviousDefault =
          current &&
          priorBounds &&
          current[0] === priorBounds[0] &&
          current[1] === priorBounds[1];

        next[filter.id] =
          !current || wasUsingPreviousDefault
            ? [filter.min, filter.max]
            : [Math.max(filter.min, current[0]), Math.min(filter.max, current[1])];
      }
      return shallowRangeRecordEqual(prev, next) ? prev : next;
    });
    setSelectedNumericFilterDrafts((prev) => {
      const next: Record<string, [number, number]> = {};
      for (const filter of dynamicFilters) {
        if (filter.parameterType !== "NUMBER") continue;
        const current = prev[filter.id];
        const priorBounds = previousBounds[filter.id];
        const wasUsingPreviousDefault =
          current &&
          priorBounds &&
          current[0] === priorBounds[0] &&
          current[1] === priorBounds[1];

        next[filter.id] =
          !current || wasUsingPreviousDefault
            ? [filter.min, filter.max]
            : [Math.max(filter.min, current[0]), Math.min(filter.max, current[1])];
      }
      return shallowRangeRecordEqual(prev, next) ? prev : next;
    });
    setSelectedTextFilters((prev) => {
      const next: Record<string, string[]> = {};
      for (const filter of dynamicFilters) {
        if (filter.parameterType !== "TEXT") continue;
        next[filter.id] = prev[filter.id]?.filter((value) => filter.values.includes(value)) ?? [];
      }
      return shallowTextRecordEqual(prev, next) ? prev : next;
    });

    previousDynamicFilterBoundsRef.current = Object.fromEntries(
      dynamicFilters
        .filter((filter) => filter.parameterType === "NUMBER")
        .map((filter) => [filter.id, [filter.min, filter.max] as [number, number]]),
    );
  }, [dynamicFilters]);

  const maxProductPrice = globalMaxProductPrice;

  const previousMaxProductPriceRef = useRef(maxProductPrice);

  function clampPriceRangeToMax(range: [number, number], max: number): [number, number] {
    const safeMax = Number.isFinite(max) ? max : globalMaxProductPrice;
    const nextFrom = Math.max(0, Math.min(range[0], safeMax));
    const nextTo = Math.max(0, Math.min(range[1], safeMax));
    if (nextFrom <= nextTo) return [nextFrom, nextTo];
    return [Math.max(0, nextTo - 1000), nextTo];
  }

  useEffect(() => {
    const previousMax = previousMaxProductPriceRef.current;
    let shouldSuppressReload = false;

    setPriceRange((current) => {
      const wasPinnedToMax = current[1] === previousMax;
      const clamped = clampPriceRangeToMax(current, maxProductPrice);
      if (wasPinnedToMax && maxProductPrice > previousMax) {
        shouldSuppressReload = true;
        return [clamped[0], maxProductPrice];
      }
      if (clamped[0] !== current[0] || clamped[1] !== current[1]) {
        shouldSuppressReload = true;
      }
      return clamped;
    });

    setPriceRangeDraft((current) => {
      const wasPinnedToMax = current[1] === previousMax;
      const clamped = clampPriceRangeToMax(current, maxProductPrice);
      if (wasPinnedToMax && maxProductPrice > previousMax) {
        return [clamped[0], maxProductPrice];
      }
      return clamped;
    });

    if (shouldSuppressReload) {
      suppressCatalogReloadRef.current = true;
    }
    previousMaxProductPriceRef.current = maxProductPrice;
  }, [maxProductPrice]);

  const pageProducts = products;
  const visiblePercent = catalogTotalAll === 0 ? 0 : Math.round((catalogTotal / catalogTotalAll) * 100);
  const resultsAnimationKey = [
    query,
    selectedCategory,
    priceRange.join("-"),
    selectedBrands.join("-"),
    selectedCountries.join("-"),
    selectedTypes.join("-"),
    JSON.stringify(selectedNumericFilters),
    JSON.stringify(selectedTextFilters),
  ].join("|");

  function buildCatalogRequestPayload() {
    const selectedTextFiltersPayload = Object.fromEntries(
      Object.entries(selectedTextFilters).filter(([, values]) => values.length > 0),
    );
    const selectedNumericFiltersPayload = Object.fromEntries(
      dynamicFilters
        .filter((filter) => filter.parameterType === "NUMBER")
        .map((filter) => [filter.id, selectedNumericFilters[filter.id] ?? [filter.min, filter.max]] as const)
        .filter((entry) => {
          const filter = dynamicFilters.find((item) => item.id === entry[0]);
          if (!filter) return false;
          return entry[1][0] !== filter.min || entry[1][1] !== filter.max;
        }),
    );
    const signature = JSON.stringify({
      search: query.trim(),
      category: selectedCategory !== "all" ? selectedCategory : "",
      minPrice: priceRange[0] > 0 ? priceRange[0] : null,
      maxPrice: priceRange[1] < maxProductPrice ? priceRange[1] : null,
      brands: [...selectedBrands].sort(),
      countries: [...selectedCountries].sort(),
      types: [...selectedTypes].sort(),
      sort: sortMode,
      textFilters: selectedTextFiltersPayload,
      numericFilters: selectedNumericFiltersPayload,
    });

    return {
      signature,
      queryPayload: {
        limit: itemsPerPage,
        search: query.trim() || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < maxProductPrice ? priceRange[1] : undefined,
        brands: selectedBrands,
        countries: selectedCountries,
        types: selectedTypes,
        sort: sortMode,
        textFilters: selectedTextFiltersPayload,
        numericFilters: selectedNumericFiltersPayload,
      },
      selectedTextFiltersPayload,
      selectedNumericFiltersPayload,
    };
  }

  async function prefetchCatalogPage(nextPage: number, signature: string, queryPayload: ReturnType<typeof buildCatalogRequestPayload>["queryPayload"]) {
    const prefetchRequestId = ++prefetchRequestIdRef.current;

    try {
      const response = await loadCatalogListing({
        page: nextPage,
        ...queryPayload,
        includeMeta: false,
        includeTotals: false,
      });

      if (prefetchRequestId !== prefetchRequestIdRef.current) {
        return;
      }

      prefetchedPageRef.current = {
        signature,
        page: nextPage,
        response,
      };
    } catch {
      if (prefetchRequestId !== prefetchRequestIdRef.current) {
        return;
      }
      prefetchedPageRef.current = null;
    }
  }

  async function loadCatalogPage(nextPage: number, mode: "replace" | "append") {
    const requestId = ++requestIdRef.current;
    const {
      signature,
      queryPayload,
      selectedTextFiltersPayload,
      selectedNumericFiltersPayload,
    } = buildCatalogRequestPayload();
    const metaRequestKey = JSON.stringify({
      search: query.trim(),
      category: selectedCategory !== "all" ? selectedCategory : "",
      minPrice: priceRange[0] > 0 ? priceRange[0] : null,
      maxPrice: priceRange[1] < maxProductPrice ? priceRange[1] : null,
      brands: [...selectedBrands].sort(),
      countries: [...selectedCountries].sort(),
      types: [...selectedTypes].sort(),
      textFilters: selectedTextFiltersPayload,
      numericFilters: selectedNumericFiltersPayload,
    });
    const shouldIncludeMeta = mode === "replace" && lastMetaRequestKeyRef.current !== metaRequestKey;
    const shouldIncludeTotals = mode === "replace";
    const prefetched =
      mode === "append" &&
      prefetchedPageRef.current?.signature === signature &&
      prefetchedPageRef.current.page === nextPage
        ? prefetchedPageRef.current.response
        : null;

    if (mode === "append") {
      setIsFetchingMore(true);
    } else {
      setIsFetchingResults(true);
    }

    try {
      const response =
        prefetched ??
        (await loadCatalogListing({
          page: nextPage,
          ...queryPayload,
          includeMeta: shouldIncludeMeta,
          includeTotals: shouldIncludeTotals,
        }));

      if (requestId !== requestIdRef.current) return;
      prefetchedPageRef.current = null;

      setProducts((current) => (mode === "append" ? [...current, ...response.items] : response.items));
      if (response.meta) {
        lastMetaRequestKeyRef.current = metaRequestKey;
        setCatalogMeta((current) => ({
          ...response.meta,
          brands: selectedBrands.length > 0 ? current.brands : response.meta.brands,
          countries: selectedCountries.length > 0 ? current.countries : response.meta.countries,
          dynamicFilters: response.meta.dynamicFilters.map((nextFilter) => {
            const currentFilter = current.dynamicFilters.find((item) => item.id === nextFilter.id);
            if (!currentFilter) return nextFilter;

            if (nextFilter.parameterType === "TEXT") {
              const selectedValues = selectedTextFilters[nextFilter.id] ?? [];
              if (selectedValues.length > 0) {
                return {
                  ...nextFilter,
                  values: currentFilter.values,
                };
              }
              return nextFilter;
            }

            const currentSelectedRange = selectedNumericFilters[nextFilter.id];
            if (!currentSelectedRange) {
              return nextFilter;
            }

            const currentRangeIsDefault =
              currentSelectedRange[0] === currentFilter.min && currentSelectedRange[1] === currentFilter.max;

            if (currentRangeIsDefault) {
              return nextFilter;
            }

            return {
              ...nextFilter,
              min: currentFilter.min,
              max: currentFilter.max,
              numericValues: currentFilter.numericValues,
            };
          }),
        }));
      }
      if (shouldIncludeTotals) {
        setCatalogTotal(response.total);
        setCatalogTotalAll(response.totalAll);
      }
      setHasMore(response.hasMore);

      if (response.hasMore) {
        void prefetchCatalogPage(nextPage + 1, signature, queryPayload);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsFetchingMore(false);
        setIsFetchingResults(false);
      }
    }
  }

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
    if (!hasMountedQueryEffectRef.current) {
      hasMountedQueryEffectRef.current = true;
      return;
    }
  }, [query]);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    const normalizedQuery = query.trim();
    if (normalizedSearch === normalizedQuery) {
      return;
    }

    if (searchDebounceTimeoutRef.current !== null) {
      window.clearTimeout(searchDebounceTimeoutRef.current);
    }

    searchDebounceTimeoutRef.current = window.setTimeout(() => {
      searchDebounceTimeoutRef.current = null;
      setQuery(searchInput);
      setPage(1);
    }, 250);

    return () => {
      if (searchDebounceTimeoutRef.current !== null) {
        window.clearTimeout(searchDebounceTimeoutRef.current);
        searchDebounceTimeoutRef.current = null;
      }
    };
  }, [searchInput, query]);

  function clearSearch() {
    if (searchDebounceTimeoutRef.current !== null) {
      window.clearTimeout(searchDebounceTimeoutRef.current);
      searchDebounceTimeoutRef.current = null;
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }

    const hasOnlySearchApplied =
      query.trim().length > 0 &&
      selectedCategory === (initialCategory ?? "all") &&
      selectedBrands.length === 0 &&
      selectedCountries.length === 0 &&
      selectedTypes.length === 0 &&
      sortMode === "popular" &&
      priceRange[0] === 0 &&
      priceRange[1] === maxProductPrice &&
      Object.values(selectedTextFilters).every((values) => values.length === 0) &&
      Object.entries(selectedNumericFilters).every(([filterId, range]) => {
        const filter = dynamicFilters.find((item) => item.id === filterId);
        if (!filter || filter.parameterType !== "NUMBER") {
          return true;
        }
        return range[0] === filter.min && range[1] === filter.max;
      });

    if (hasOnlySearchApplied) {
      requestIdRef.current += 1;
      suppressCatalogReloadRef.current = true;
      setProducts(initialProducts);
      setCatalogMeta(initialMeta);
      setCatalogTotal(initialTotal);
      setCatalogTotalAll(initialTotalAll);
      setHasMore(initialHasMore);
      setIsFetchingResults(false);
      setIsFetchingMore(false);
      lastMetaRequestKeyRef.current = JSON.stringify({
        search: "",
        category: initialCategory ?? "",
        minPrice: null,
        maxPrice: null,
        brands: [],
        countries: [],
        types: [],
        textFilters: {},
        numericFilters: {},
      });
    }

    setSearchInput("");
    setQuery("");
    setPage(1);
  }

  useEffect(() => {
    if (!initialCategory) return;
    setSelectedCategory(initialCategory);
    setPage(1);
  }, [initialCategory]);

  useEffect(() => {
    lastMetaRequestKeyRef.current = JSON.stringify({
      search: "",
      category: initialCategory ?? "",
      minPrice: null,
      maxPrice: null,
      brands: [],
      countries: [],
      types: [],
      textFilters: {},
      numericFilters: {},
    });
  }, [initialCategory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const searchFromQuery = params.get("search")?.trim();
    const brandFromQuery = params.get("brand")?.trim();
    const typesFromQuery = params.getAll("type").map((value) => value.trim()).filter(Boolean);

    if (searchFromQuery) {
      setSearchInput(searchFromQuery);
      setQuery(searchFromQuery);
      setPage(1);
    }

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

    setSearchInput(brandFromQuery);
    setQuery(brandFromQuery);
    setPage(1);
  }, [brands]);

  useEffect(() => {
    if (suppressCatalogReloadRef.current) {
      suppressCatalogReloadRef.current = false;
      return;
    }

    void loadCatalogPage(1, "replace");
    setPage(1);
  }, [
    query,
    selectedCategory,
    selectedBrands,
    selectedCountries,
    selectedTypes,
    selectedTextFilters,
    selectedNumericFilters,
    priceRange,
    sortMode,
  ]);

  function handleShowProducts() {
    if (typeof window === "undefined") return;

    if (isLanding && selectedCategory !== "all") {
      const params = new URLSearchParams();
      for (const type of selectedTypes) {
        params.append("type", type);
      }
      const queryString = params.toString();
      const href = `/catalog/category/${selectedCategory}${queryString ? `?${queryString}` : ""}`;
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

  async function handleAddToCart(product: Product) {
    if (pendingCartSlug === product.slug) return;

    setPendingCartSlug(product.slug);
    try {
      const cart = await addProductToSessionCart(product);
      setCartQuantities(Object.fromEntries(cart.items.map((item) => [item.slug, item.qty])));
      setAnimatedCartSlug(product.slug);
    } finally {
      setPendingCartSlug((current) => (current === product.slug ? null : current));
      window.setTimeout(() => {
        setAnimatedCartSlug((current) => (current === product.slug ? null : current));
      }, 420);
    }
  }

  async function flushCartQuantity(slug: string) {
    if (cartSyncInFlightRef.current.has(slug)) {
      return;
    }

    cartSyncInFlightRef.current.add(slug);

    try {
      while (true) {
        const quantity = pendingCartQuantityRef.current[slug];
        const cart = await updateSessionCartItem(slug, quantity);
        const nextQuantities = Object.fromEntries(cart.items.map((item) => [item.slug, item.qty]));
        const currentPending = pendingCartQuantityRef.current[slug];

        if (currentPending === quantity) {
          cartSyncRequestIdRef.current += 1;
          setCartQuantities((current) => ({
            ...current,
            [slug]: nextQuantities[slug] ?? 0,
          }));
          delete pendingCartQuantityRef.current[slug];
          break;
        }
      }
    } finally {
      cartSyncInFlightRef.current.delete(slug);
    }
  }

  function handleCartQuantityChange(slug: string, quantity: number) {
    const safeQuantity = Math.max(0, quantity);
    pendingCartQuantityRef.current[slug] = safeQuantity;
    setCartQuantities((current) => ({
      ...current,
      [slug]: safeQuantity,
    }));
    setAnimatedCartSlug(slug);
    window.setTimeout(() => {
      setAnimatedCartSlug((current) => (current === slug ? null : current));
    }, 420);
    void flushCartQuantity(slug);
  }

  function handleCartQuantityStep(slug: string, delta: number) {
    const currentQuantity = pendingCartQuantityRef.current[slug] ?? cartQuantitiesRef.current[slug] ?? 0;
    handleCartQuantityChange(slug, currentQuantity + delta);
  }

  function toggleValue(value: string, selected: string[], setter: (values: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
    setPage(1);
  }

  function resetAllFilters() {
    clearSearch();
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

  function toggleSortPanel() {
    setShowAdvanced((prev) => !prev);
  }

  function handleLandingCategorySelect(categorySlug: string) {
    setSelectedCategory(categorySlug);
    setExpandedCategory(categorySlug);
    setSelectedTypes([]);
    setPage(1);
  }

  function handleLandingCategoryReset() {
    setSelectedCategory("all");
    setSelectedTypes([]);
    setExpandedCategory(null);
    setPage(1);
  }

  function resetSortMode() {
    setSortMode("popular");
    setPage(1);
    setShowAdvanced(false);
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

  function handleCategoryTypeSelect(categorySlug: string) {
    setSelectedCategory(categorySlug);
    setExpandedCategory(categorySlug);
    setPage(1);
  }

  function handleCategoryTypeReset() {
    setSelectedCategory(initialCategory ?? "all");
    setPage(1);
  }

  function renderFilters(idPrefix: string, mode: "compact" | "full", variant: "default" | "overlay" = "default") {
    const isOverlay = variant === "overlay";
    const isLandingCategoryFilters = isLanding && !isOverlay;
    const isCategoryTypeFilters = isCategoryPage && mode === "full" && !isOverlay;
    return (
      <div className={isOverlay ? "space-y-6 2xl:space-y-8 min-[2200px]:space-y-10" : "space-y-8"}>
        {isCategoryTypeFilters ? (
          <section>
            <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
              Подкатегории
            </h2>
            <div className="mt-3 border-t border-[#e7e1d9] pt-5 space-y-4">
              <label className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                <input
                  type="radio"
                  name={`${idPrefix}-category-children`}
                  checked={selectedCategory === (initialCategory ?? "all")}
                  onChange={handleCategoryTypeReset}
                  className="catalog-checkbox h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                />
                <span className="min-w-0">
                  <span className="block">Все товары раздела</span>
                </span>
              </label>
              {currentCategoryTypeOptions.map(({ type, slug, count }) => (
                <label key={slug} className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                  <input
                    type="radio"
                    name={`${idPrefix}-category-children`}
                    checked={selectedCategory === slug}
                    onChange={() => handleCategoryTypeSelect(slug)}
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
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                Категория
              </h2>
              <button
                type="button"
                onClick={() => setCategoriesCollapsed((current) => !current)}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[#111]"
                aria-expanded={!categoriesCollapsed}
                aria-label={categoriesCollapsed ? "Показать категории" : "Скрыть категории"}
              >
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  className={`transition-transform duration-300 ${categoriesCollapsed ? "" : "rotate-180"}`}
                >
                  <path d="M4 7.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className={`catalog-filter-accordion mt-3 border-t border-[#e7e1d9] ${categoriesCollapsed ? "" : "catalog-filter-accordion--open"}`}>
              <div className="catalog-filter-accordion__inner pt-5">
                <div className="space-y-4">
                <label className="flex items-center gap-4 text-[18px] text-[#6f6f69] 2xl:text-[20px]">
                  <input
                    type="radio"
                    name={`${idPrefix}-landing-category`}
                    checked={selectedCategory === "all"}
                    onChange={handleLandingCategoryReset}
                    className="catalog-checkbox h-6 w-6 border border-[#e1dbd2] transition-all duration-200"
                  />
                  <span>Все категории</span>
                </label>

                {categoryTypeTree.map((item) => {
                  const isExpanded = expandedCategory === item.slug;
                  const isActiveCategory = selectedCategory === item.slug;

                  return (
                    <div key={item.category} className="border-b border-[#f0ebe4] pb-4 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                        <label
                          className="flex min-w-0 flex-1 cursor-pointer items-start gap-4 text-left text-[18px] text-[#111] 2xl:text-[20px]"
                          onClick={() => handleLandingCategorySelect(item.slug)}
                        >
                          <input
                            type="radio"
                            name={`${idPrefix}-landing-category`}
                            checked={isActiveCategory}
                            onChange={() => handleLandingCategorySelect(item.slug)}
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
                          onClick={() =>
                            setExpandedCategory((current) => (current === item.slug ? null : item.slug))
                          }
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
            </div>
          </section>
        ) : null}

        {isOverlay || (isLanding && mode === "compact") ? null : (
          <section>
          <div className="text-[16px] uppercase tracking-[1.4px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <span>Цена</span>
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
          const showCompactDesktopCategoryFilters = mode === "compact" && !isOverlay && isCategoryPage;
          const filterGroups = [
            ...((mode === "full" || (mode === "compact" && !isOverlay && (isLanding || isCategoryPage))) ? ([["Бренд", brands]] as const) : ([] as const)),
            ...(mode === "full" ? ([["Страна производства", countries]] as const) : ([] as const)),
            ...(
              (!isLandingCategoryFilters && !isCategoryPage && mode === "full" && !isOverlay) || showCompactDesktopCategoryFilters
                ? ([["Тип", types]] as const)
                : ([] as const)
            ),
          ] as const;

          if (isOverlay && filterGroups.length > 1) {
            return (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {filterGroups.map(([title, items]) => (
                  <section key={title}>
                    <h2 className="text-[16px] uppercase tracking-[1.6px] 2xl:text-[20px] min-[2200px]:text-[24px] [font-family:Jaldi,'JetBrains_Mono',monospace]">{title}</h2>
                    {title === "Бренд" ? (
                      <div className="mt-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={brandSearchQuery}
                            onChange={(event) => setBrandSearchQuery(event.target.value)}
                            placeholder="Поиск бренда"
                            className="h-12 w-full border border-[#e7e1d9] bg-white px-4 pr-12 text-[14px] text-[#3c3c38] placeholder:text-[#bdbcb7] focus:border-[#d3b46a] focus:outline-none 2xl:h-14 2xl:text-[16px] [font-family:DM_Sans,Manrope,sans-serif]"
                          />
                          {brandSearchQuery ? (
                            <button
                              type="button"
                              onClick={() => setBrandSearchQuery("")}
                              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#7a7a75] transition-colors hover:text-[#111]"
                              aria-label="Очистить поиск бренда"
                            >
                              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                                <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-2 border-t border-[#e7e1d9] pt-3 2xl:pt-4 [column-gap:22px] 2xl:[column-gap:30px] xl:columns-2">
                      {(title === "Бренд"
                        ? items
                            .filter((item) => item.toLowerCase().includes(brandSearchQuery.trim().toLowerCase()))
                            .sort((a, b) => a.localeCompare(b, "ru"))
                        : items
                      ).map((item, index) => {
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
              {isLanding && mode === "compact" && !isOverlay && title === "Бренд" ? (
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[20px] uppercase tracking-[1.6px] 2xl:text-[22px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setBrandsCollapsed((current) => !current)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[#111]"
                    aria-expanded={!brandsCollapsed}
                    aria-label={brandsCollapsed ? "Показать бренды" : "Скрыть бренды"}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      className={`transition-transform duration-300 ${brandsCollapsed ? "" : "rotate-180"}`}
                    >
                      <path d="M4 7.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <h2
                  className={`${isOverlay ? "text-[16px] 2xl:text-[20px] min-[2200px]:text-[24px]" : "text-[20px] 2xl:text-[22px]"} uppercase tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]`}
                >
                  {title}
                </h2>
              )}
              {title === "Бренд" ? (
                <div className="mt-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={brandSearchQuery}
                      onChange={(event) => setBrandSearchQuery(event.target.value)}
                      placeholder="Поиск бренда"
                      className="h-12 w-full border border-[#e7e1d9] bg-white px-4 pr-12 text-[14px] text-[#3c3c38] placeholder:text-[#bdbcb7] focus:border-[#d3b46a] focus:outline-none 2xl:h-14 2xl:text-[16px] [font-family:DM_Sans,Manrope,sans-serif]"
                    />
                    {brandSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setBrandSearchQuery("")}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#7a7a75] transition-colors hover:text-[#111]"
                        aria-label="Очистить поиск бренда"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                          <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div
                className={[
                  "mt-3 border-t border-[#e7e1d9]",
                  isOverlay
                    ? "pt-4 2xl:pt-5 [column-gap:26px] 2xl:[column-gap:32px] xl:columns-2"
                    : isLanding && mode === "compact" && !isOverlay && title === "Бренд"
                      ? `catalog-filter-accordion ${brandsCollapsed ? "" : "catalog-filter-accordion--open"}`
                      : "space-y-5 pt-5",
                ].join(" ")}
              >
                <div
                  className={
                    isLanding && mode === "compact" && !isOverlay && title === "Бренд"
                      ? "catalog-filter-accordion__inner grid grid-cols-2 gap-x-5 gap-y-4 pt-5"
                      : undefined
                  }
                >
                {(title === "Бренд"
                  ? (isOverlay
                      ? items
                      : items.slice(0, 20)
                    )
                      .filter((item) => item.toLowerCase().includes(brandSearchQuery.trim().toLowerCase()))
                      .sort((a, b) => a.localeCompare(b, "ru"))
                  : items
                ).map((item, index) => {
                  const id = `${idPrefix}-${String(title).toLowerCase().replace(/\s+/g, "-")}-${index}`;
                  const [selected, setSelected] = getFilterState(String(title));

                  return (
                    <label
                      key={item}
                      htmlFor={id}
                      className={[
                        "flex items-center gap-4 text-[#6f6f69]",
                        isOverlay
                          ? "mb-4 2xl:mb-5 break-inside-avoid text-[14px] 2xl:text-[18px] min-[2200px]:text-[21px]"
                          : isLanding && mode === "compact" && !isOverlay && title === "Бренд"
                            ? "min-w-0 text-[16px] 2xl:text-[18px]"
                            : "text-[18px] 2xl:text-[20px]",
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
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setAllFiltersOpen(true)}
              className="h-12 w-full border border-[#e7e1d9] bg-white text-[13px] uppercase tracking-[1.4px] text-[#111] transition-colors hover:border-[#d3b46a] md:h-14 md:text-[15px] 2xl:h-16 2xl:text-[16px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
            >
              Все фильтры
            </button>
            <button
              type="button"
              onClick={resetAllFilters}
              aria-pressed={hasActiveFilters}
              className={[
                "h-12 w-full border text-[13px] uppercase tracking-[1.4px] transition-all md:h-14 md:text-[15px] 2xl:h-16 2xl:text-[16px] [font-family:Jaldi,'JetBrains_Mono',monospace]",
                hasActiveFilters
                  ? "border-[#111] bg-[#111] text-white shadow-[0_14px_28px_rgba(17,17,17,0.16)] ring-1 ring-[#111]/20 hover:bg-[#2a2a26] hover:shadow-[0_18px_34px_rgba(17,17,17,0.22)]"
                  : "border-[#111] bg-[#111] text-white opacity-72 hover:bg-[#2a2a26] hover:opacity-100",
              ].join(" ")}
            >
              Сбросить фильтры
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderCategoryTiles() {
    return (
      <section>
        <div className="flex flex-col items-center gap-1 text-center md:relative md:flex-row md:items-center md:justify-center md:gap-6">
          <h2 className="w-full text-center text-[18px] uppercase tracking-[1.1px] md:text-[22px] [font-family:'TT_Firs_Neue',TT_Firs_Neue,DM_Sans,Manrope,sans-serif]">
            Категории
          </h2>
          <span className="text-[11px] uppercase tracking-[1.2px] text-[#7a7a75] md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:text-[14px] md:tracking-[1.3px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            Выберите раздел
          </span>
        </div>

        <div
          className="mt-4 grid content-start grid-cols-2 gap-2 auto-rows-[minmax(220px,300px)] sm:grid-cols-2 md:auto-rows-[minmax(180px,240px)] md:grid-cols-3 md:gap-3 lg:grid-cols-4 2xl:grid-cols-5"
          style={{ gridAutoFlow: "dense" }}
        >
          {categoryCards.map((category, index) => (
            <a
              key={category.slug}
              href={`/catalog/category/${category.slug}`}
              className={[
                "group flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#e7e1d9] bg-[#ffffff]",
                "transition-shadow hover:shadow-[0_16px_34px_rgba(38,35,31,0.08)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2a27]/40",
                getCategorySizeClass(category.slug, index),
              ].join(" ")}
            >
              <div className="flex min-h-0 flex-1 items-center justify-center bg-[#ffffff] px-3 py-3 md:px-4 md:py-4">
                {category.image ? (
                  <div className="flex h-full w-full items-center justify-center transition-transform duration-300 group-hover:scale-[1.04]">
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className={[
                        "h-full max-h-full w-full max-w-full object-contain object-center transition-transform duration-300",
                        getCategoryImageClass(category.slug),
                      ].join(" ")}
                    />
                  </div>
                ) : (
                  <div className="h-full w-full rounded-[14px] bg-[#f0efec]" aria-hidden />
                )}
              </div>

              <div className="shrink-0 bg-[#ffffff] px-3 pb-4 pt-2 md:px-4 md:pb-4 md:pt-2">
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
            {isCategoryPage ? (
              <>
                <span className="mx-2 text-[#b5b2ab]">/</span>
                <span className="break-words">{initialCategory ?? ""}</span>
              </>
            ) : null}
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,9vw,7rem)] leading-[0.96] tracking-[-0.03em] md:mt-10 md:tracking-[-0.04em] 2xl:leading-[0.92] [font-family:'Cormorant_Garamond',serif]">
            {isCategoryPage ? initialCategory : "Каталог оборудования"}
          </h1>
          <p className="mt-4 text-[clamp(0.9rem,3.8vw,1.5rem)] uppercase tracking-[1.3px] text-[#7a7a75] md:mt-8 md:tracking-[1.6px] 2xl:text-[24px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            Более <span className="relative -top-[0.03em] tabular-nums leading-none">{catalogTotal}</span> товаров в наличии
          </p>

          <div className="mt-8 flex flex-col gap-8 md:mt-12 md:gap-10 xl:flex-row 2xl:gap-14">
            <aside
              ref={desktopFiltersRef}
              style={{ top: `${desktopFiltersTop}px` }}
              className="hidden w-full xl:sticky xl:block xl:max-h-[calc(100svh-var(--site-header-offset,76px)-24px)] xl:overflow-y-auto xl:self-start xl:max-w-[360px] 2xl:max-w-[420px]"
            >
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
                  <p className="text-[22px] uppercase leading-none tracking-[1.6px] [font-family:Jaldi,'JetBrains_Mono',monospace]">Фильтры</p>
                  <button
                    type="button"
                    onClick={closeFiltersOverlays}
                    className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full text-[#111] transition-colors hover:text-[#7a7a75]"
                    aria-label="Закрыть фильтры"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="block">
                      <path d="M7 7l10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
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
              {isLanding && !hasActiveFilters ? <div className="mb-10 md:-mt-18">{renderCategoryTiles()}</div> : null}

              {isLanding ? (
                <div className="mb-6 md:mb-8">
                  <h2 className="text-[22px] uppercase tracking-[1.6px] md:text-[26px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Популярные товары
                  </h2>
                  <p className="mt-2 text-[14px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Показано <span className="relative -top-[0.03em] tabular-nums leading-none">{pageProducts.length}</span> из{" "}
                    <span className="relative -top-[0.03em] tabular-nums leading-none">{catalogTotal}</span>
                  </p>
                </div>
              ) : null}

              <div className="relative">
                <div
                  className={`sticky top-[calc(var(--site-header-offset,76px)+2px)] z-[110] py-2 md:hidden ${
                    isLanding ? "lg:top-[calc(var(--site-header-offset,76px)+6px)]" : "md:top-[calc(var(--site-header-offset,76px)+6px)]"
                  }`}
                >
                  <div className="ml-auto w-full">
                    <div className="flex flex-col gap-2 rounded-[28px] border border-white/70 bg-[rgba(255,253,250,0.82)] p-2 shadow-[0_16px_40px_rgba(17,17,17,0.08)] backdrop-blur-[18px]">
                      <div className="grid grid-cols-[1.3fr_1fr_auto] gap-2">
                        <div className="relative flex h-12 min-w-0 items-center rounded-[20px] border border-[#e7e1d9] bg-white pl-11 pr-3 transition-colors focus-within:border-[#d3b46a]">
                          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a75]">
                            <circle cx="11" cy="11" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
                            <path d="M16.2 16.2l4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                          <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => {
                              setSearchInput(event.target.value);
                            }}
                            placeholder="Поиск"
                            className="w-full min-w-0 border-0 bg-transparent text-[15px] text-[#3c3c38] placeholder:text-[#bdbcb7] focus:outline-none [font-family:DM_Sans,Manrope,sans-serif]"
                          />
                          {searchInput ? (
                              <button
                                type="button"
                                onClick={clearSearch}
                              className="ml-2 flex h-9 w-9 items-center justify-center text-[#7a7a75]"
                              aria-label="Очистить поиск"
                            >
                              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                                <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                              </svg>
                            </button>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={isSortApplied ? resetSortMode : toggleSortPanel}
                          aria-expanded={showAdvanced}
                          className="flex h-12 items-center justify-center overflow-hidden rounded-[20px] border border-[#e7e1d9] bg-white px-3 text-center text-[11px] uppercase leading-[1.05] tracking-[1px] text-[#111] transition-colors hover:border-[#d3b46a] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                          aria-label="Изменить сортировку"
                        >
                          <span key={sortMode} className={`catalog-sort-label-roll ${isSortApplied ? "hidden" : ""}`}>
                            {sortMode === "price-asc"
                              ? "по цене ↑"
                              : sortMode === "price-desc"
                                ? "по цене ↓"
                                : sortMode === "new"
                                  ? "сначала новые"
                                  : "по популярности"}
                          </span>
                          {isSortApplied ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path d="M7 7l10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          ) : null}
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

                    </div>
                  </div>

                  <div
                    className={`mt-3 overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
                      showAdvanced ? "pointer-events-auto max-h-[420px] opacity-100 translate-y-0" : "pointer-events-none max-h-0 opacity-0 -translate-y-1"
                    }`}
                    aria-hidden={!showAdvanced}
                  >
                    <div className="ml-auto w-full md:w-fit">
                      <div className="rounded-[28px] border border-white/70 bg-[rgba(255,253,250,0.82)] p-2 shadow-[0_16px_40px_rgba(17,17,17,0.08)] backdrop-blur-[18px] md:rounded-[32px] md:p-3">
                        <div className="flex items-center justify-between gap-3 border-b border-[#e7e1d9] pb-3 md:pb-4">
                          <p className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] md:text-[13px] md:tracking-[1.8px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                            Сортировка
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-[16px] border border-[#e7e1d9] bg-white text-[#7a7a75] transition-colors hover:border-[#d3b46a] hover:text-[#111] md:h-10 md:w-10"
                            aria-label="Закрыть сортировку"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path d="M7 7l10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 md:mt-4 md:gap-3">
                          {quickSortOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setSortMode(option.id);
                                setPage(1);
                                setShowAdvanced(false);
                              }}
                              className={`flex h-11 items-center justify-center rounded-[20px] border px-3 text-[11px] uppercase tracking-[1px] transition-colors md:h-14 md:px-4 md:text-[14px] md:tracking-[1.4px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                                sortMode === option.id
                                  ? "border-[#111] bg-[#111] text-white"
                                  : "border-[#e7e1d9] bg-white text-[#111] hover:border-[#d3b46a]"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`hidden md:block sticky top-[calc(var(--site-header-offset,76px)+2px)] z-[110] py-4 ${
                    isLanding ? "lg:top-[calc(var(--site-header-offset,76px)+6px)]" : "md:top-[calc(var(--site-header-offset,76px)+6px)]"
                  }`}
                >
                  <div className="flex items-center gap-2 rounded-[32px] border border-white/70 bg-[rgba(255,253,250,0.82)] p-3 shadow-[0_16px_40px_rgba(17,17,17,0.08)] backdrop-blur-[18px] 2xl:gap-3">
                    <div className="min-w-0 flex-1 px-3 text-[16px] uppercase tracking-[1.6px] text-[#8a8a85] 2xl:px-4 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      Отображено {visiblePercent}% товаров
                    </div>
                    <button
                      type="button"
                      onClick={isSortApplied ? resetSortMode : () => setShowAdvanced((prev) => !prev)}
                      className={`flex h-16 shrink-0 items-center justify-center rounded-[20px] border border-[#e7e1d9] bg-white text-[16px] uppercase tracking-[1.6px] text-[#111] transition-colors hover:border-[#d3b46a] 2xl:h-[72px] 2xl:text-[18px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                        isSortApplied ? "gap-3 px-5 2xl:gap-4 2xl:px-6" : "px-5 2xl:px-6"
                      }`}
                      aria-pressed={showAdvanced}
                      aria-label="Показать расширенные фильтры и сортировку"
                    >
                      <span>
                        {sortMode === "price-asc"
                          ? "по цене ↑"
                          : sortMode === "price-desc"
                            ? "по цене ↓"
                            : sortMode === "new"
                              ? "сначала новые"
                              : "по умолчанию"}
                      </span>
                      {isSortApplied ? (
                        <span className="flex items-center justify-center text-[#7a7a75] transition-colors hover:text-[#111]">
                          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                            <path d="M7 7l10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                    <div className="relative flex h-16 w-[380px] items-center rounded-[20px] border border-[#e7e1d9] bg-white pl-12 pr-4 transition-colors focus-within:border-[#d3b46a] 2xl:h-[72px] 2xl:w-[420px] 2xl:pl-14 2xl:pr-5">
                      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a75] 2xl:left-5">
                        <circle cx="11" cy="11" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M16.2 16.2l4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(event) => {
                          setSearchInput(event.target.value);
                        }}
                        placeholder="Поиск по каталогу"
                        className="w-full min-w-0 border-0 bg-transparent text-[20px] text-[#3c3c38] placeholder:text-[#c2c2bf] focus:outline-none 2xl:text-[22px] [font-family:DM_Sans,Manrope,sans-serif]"
                      />
                      {searchInput ? (
                          <button
                            type="button"
                            onClick={clearSearch}
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

                  <div
                    className={`mt-3 overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
                      showAdvanced ? "pointer-events-auto max-h-[420px] opacity-100 translate-y-0" : "pointer-events-none max-h-0 opacity-0 -translate-y-1"
                    }`}
                    aria-hidden={!showAdvanced}
                  >
                    <div className="ml-auto w-fit">
                      <div className="rounded-[32px] border border-white/70 bg-[rgba(255,253,250,0.82)] p-3 shadow-[0_16px_40px_rgba(17,17,17,0.08)] backdrop-blur-[18px]">
                        <div className="flex items-center justify-between gap-3 border-b border-[#e7e1d9] pb-4">
                          <p className="text-[13px] uppercase tracking-[1.8px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                            Сортировка
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-[#e7e1d9] bg-white text-[#7a7a75] transition-colors hover:border-[#d3b46a] hover:text-[#111]"
                            aria-label="Закрыть сортировку"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path d="M7 7l10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {quickSortOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setSortMode(option.id);
                                setPage(1);
                                setShowAdvanced(false);
                              }}
                              className={`flex h-14 items-center justify-center rounded-[20px] border px-4 text-[14px] uppercase tracking-[1.4px] transition-colors [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                                sortMode === option.id
                                  ? "border-[#111] bg-[#111] text-white"
                                  : "border-[#e7e1d9] bg-white text-[#111] hover:border-[#d3b46a]"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  ref={resultsTopRef}
                  id="catalog-results-top"
                  key={resultsAnimationKey}
                  className={`catalog-results mt-10 scroll-mt-[220px] grid grid-cols-2 gap-4 md:scroll-mt-[240px] md:gap-8 lg:grid-cols-2 xl:scroll-mt-[250px] ${isLanding ? "xl:grid-cols-4 2xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-3"} 2xl:gap-10`}
                >
                  {isFetchingResults && pageProducts.length === 0
                    ? Array.from({ length: itemsPerPage }).map((_, index) => (
                        <CatalogCardSkeleton key={`catalog-skeleton-${index}`} />
                      ))
                    : null}
                  {pageProducts.map((product, index) => (
                    <article
                      key={product.slug}
                      style={{ animationDelay: `${index * 60}ms` }}
                      className="catalog-card group flex h-full flex-col border border-[#ebe5de] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#d8ccb8] hover:shadow-[0_16px_40px_rgba(17,17,17,0.06)] md:p-6 2xl:p-8"
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
                        <h3 className="mt-3 min-h-[64px] break-words hyphens-auto text-[16px] leading-[1.12] md:mt-4 md:min-h-[92px] md:text-[22px] md:leading-[1.15] 2xl:min-h-[110px] 2xl:text-[26px] [font-family:DM_Sans,Manrope,sans-serif]">
                          <a href={`/catalog/${product.slug}`} className="block break-words hyphens-auto">
                            {stripArticleFromTitle(product.title, product.article)}
                          </a>
                        </h3>
                        {sanitizeCardMetaLine(product.rating) || sanitizeCardMetaLine(product.efficiency) ? (
                          <div className="mt-3 space-y-0.5 text-[11px] leading-[1.35] text-[#7a7a75] md:mt-4 md:space-y-1 md:text-[15px] md:leading-6 2xl:text-[16px] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                            {sanitizeCardMetaLine(product.rating) ? <p>{sanitizeCardMetaLine(product.rating)}</p> : null}
                            {sanitizeCardMetaLine(product.efficiency) ? <p>{sanitizeCardMetaLine(product.efficiency)}</p> : null}
                          </div>
                        ) : null}
                        <p className="mt-auto flex max-w-full items-baseline gap-1 pt-5 text-[clamp(1.05rem,3.2vw,1.45rem)] leading-none tabular-nums whitespace-nowrap md:pt-8 md:text-[clamp(1.75rem,3.4vw,2.35rem)] lg:text-[clamp(1.7rem,2.2vw,2.1rem)] 2xl:text-[clamp(1.95rem,1.8vw,2.4rem)] [font-family:DM_Sans,Manrope,sans-serif]">
                          <span className="min-w-0 truncate">{new Intl.NumberFormat("ru-RU").format(product.price)}</span>
                          <span className="shrink-0">₽</span>
                        </p>
                        <div className="mt-4 grid gap-2 md:mt-8 md:gap-3">
                          {(cartQuantities[product.slug] ?? 0) > 0 ? (
                            <div
                              className={`grid h-11 min-w-0 grid-cols-[44px_minmax(0,1fr)_44px] overflow-hidden bg-[#111] text-white transition-all duration-300 md:h-14 md:grid-cols-[52px_minmax(0,1fr)_52px] 2xl:h-16 ${animatedCartSlug === product.slug ? "scale-[1.015] shadow-[0_16px_34px_rgba(17,17,17,0.18)]" : ""}`}
                            >
                              <button
                                type="button"
                                onClick={() => handleCartQuantityStep(product.slug, -1)}
                                className="flex items-center justify-center border-r border-white/12 text-[22px] leading-none transition-colors hover:bg-white/8 md:text-[28px]"
                                aria-label="Уменьшить количество"
                              >
                                −
                              </button>
                              <div className="flex min-w-0 items-center justify-center px-1 md:px-2">
                                <span
                                  key={`${product.slug}-${cartQuantities[product.slug] ?? 0}`}
                                  className="inline-flex min-w-0 items-baseline justify-center gap-1.5 leading-none animate-[cartQtyPop_380ms_cubic-bezier(0.22,1,0.36,1)] text-[9px] uppercase tracking-[1px] md:gap-2.5 md:text-[13px] md:tracking-[1.6px] 2xl:text-[15px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                                >
                                  <span className="shrink-0 self-center text-[16px] leading-none tabular-nums md:text-[22px] 2xl:text-[26px]">
                                    {cartQuantities[product.slug] ?? 0}
                                  </span>
                                  {!isLanding ? (
                                    <span className="hidden min-w-0 self-center translate-y-[1px] truncate whitespace-nowrap leading-none md:translate-y-[2px] lg:inline">в корзине</span>
                                  ) : null}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCartQuantityStep(product.slug, 1)}
                                className="flex items-center justify-center border-l border-white/12 text-[20px] leading-none transition-colors hover:bg-white/8 md:text-[26px]"
                                aria-label="Увеличить количество"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleAddToCart(product)}
                              disabled={pendingCartSlug === product.slug}
                              className="inline-flex h-11 items-center justify-center bg-[#111] px-2 text-[10px] uppercase tracking-[1.3px] text-white transition-all duration-300 hover:bg-[#2a2a26] disabled:cursor-wait disabled:bg-[#2a2a26] md:h-14 md:text-[16px] md:tracking-[2px] md:hover:tracking-[2.5px] 2xl:h-16 2xl:text-[17px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                            >
                              {pendingCartSlug === product.slug ? "добавляем" : "в корзину"}
                            </button>
                          )}
                          <a
                            href={`/checkout?product=${product.slug}`}
                            className="inline-flex min-h-[44px] items-center justify-center border border-[#111] px-2 py-2 text-center text-[10px] uppercase tracking-[1.1px] text-[#111] transition-all duration-300 hover:border-[#d3b46a] hover:text-[#7f6522] md:h-14 md:min-h-0 md:text-[16px] md:tracking-[2px] 2xl:h-16 2xl:text-[17px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                          >
                            купить в 1 клик
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                  {isFetchingMore
                    ? Array.from({ length: Math.min(itemsPerPage, 6) }).map((_, index) => (
                        <CatalogCardSkeleton key={`catalog-append-skeleton-${index}`} />
                      ))
                    : null}
                </div>

                {pageProducts.length === 0 ? (
                  <div className="mt-10 border border-[#ebe5de] px-8 py-14 text-center text-[24px] text-[#6f6f69] 2xl:text-[28px] [font-family:DM_Sans,Manrope,sans-serif]">
                    По заданным параметрам товары не найдены.
                  </div>
                ) : null}
              </div>

              {isFetchingMore ? (
                <div className="mt-8 border-t border-[#ebe5de] pt-6 text-center text-[14px] uppercase tracking-[1.2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace] md:mt-10">
                  Загружаем еще
                </div>
              ) : null}

              {hasMore && !isFetchingMore ? (
                <div className="mt-10 border-t border-[#ebe5de] pt-7 md:mt-14 md:pt-10">
                  <button
                    type="button"
                    onClick={() => {
                      if (isFetchingMore || isFetchingResults) return;
                      const nextPage = page + 1;
                      setPage(nextPage);
                      void loadCatalogPage(nextPage, "append");
                    }}
                    className="mx-auto flex h-14 w-full max-w-[420px] items-center justify-center bg-[#111] text-[14px] uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#2a2a26] md:h-16 md:text-[16px] md:tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    Загрузить еще
                  </button>
                </div>
              ) : null}

              {!hasMore && pageProducts.length > 0 ? (
                <div className="mt-8 border-t border-[#ebe5de] pt-6 text-center text-[14px] uppercase tracking-[1.2px] text-[#8a8a85] [font-family:Jaldi,'JetBrains_Mono',monospace] md:mt-10">
                  Все товары загружены
                </div>
              ) : null}
            </div>
          </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

function getCategorySizeClass(categorySlug: string, index: number) {
  const wideCards = new Set(["kaminy", "sushilki-dlya-ruk"]);
  const tallCards = new Set([
    "dizayn-radiatory",
    "promyshlennye-ventilyatory",
    "bytovaya-pritochnaya-ventilyatsiya",
  ]);

  if (wideCards.has(categorySlug)) {
    return "md:col-span-2";
  }

  if (tallCards.has(categorySlug)) {
    return "md:row-span-2";
  }

  const pattern = index % 12;
  if (pattern === 7) return "md:row-span-2";
  return "";
}

function getCategoryImageClass(categorySlug: string) {
  const imageClassMap: Record<string, string> = {
    "dizayn-radiatory": "scale-[1.42]",
    "mobilnye-konditsionery": "scale-[1.08]",
    "osushiteli-vozdukha": "scale-[1.14]",
    "uvlazhniteli-i-ochistiteli-vozdukha": "scale-[1.12]",
    "vodonagrevateli": "scale-[1.12]",
    "split-sistemy": "scale-[1.14]",
    "radiatory-otopleniya": "scale-[1.12]",
    "teplovye-pushki": "scale-[1.12]",
    "konvektory": "scale-[1.2]",
    "kaminy": "scale-[1.22]",
    "teplye-poly-elektricheskie": "scale-[1.08]",
    "promyshlennye-ventilyatory": "scale-[1.12]",
    "gazovye-obogrevateli": "scale-[1.16]",
    "umnyy-dom": "scale-[1.14]",
    "teploventilyatory": "scale-[1.12]",
    "vytyazhnye-bytovye-ventilyatory": "scale-[1.16]",
    "sushilki-dlya-ruk": "scale-[1.34]",
  };

  return imageClassMap[categorySlug] ?? "scale-[1.1]";
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

function CatalogCardSkeleton() {
  return (
    <article className="flex h-full flex-col border border-[#ebe5de] bg-white p-4 md:p-6 2xl:p-8">
      <div className="catalog-skeleton aspect-square w-full rounded-[2px]" />
      <div className="mt-4 flex flex-1 flex-col md:mt-8">
        <div className="catalog-skeleton h-3 w-24 md:h-4 md:w-32" />
        <div className="mt-3 space-y-2 md:mt-4">
          <div className="catalog-skeleton h-5 w-full md:h-7" />
          <div className="catalog-skeleton h-5 w-3/4 md:h-7" />
        </div>
        <div className="mt-3 space-y-2 md:mt-4">
          <div className="catalog-skeleton h-3 w-2/3 md:h-4" />
          <div className="catalog-skeleton h-3 w-1/2 md:h-4" />
        </div>
        <div className="catalog-skeleton mt-auto h-8 w-2/3 pt-5 md:pt-8 md:h-10" />
        <div className="mt-4 grid gap-2 md:mt-8 md:gap-3">
          <div className="catalog-skeleton h-11 w-full md:h-14 2xl:h-16" />
          <div className="catalog-skeleton h-11 w-full md:h-14 2xl:h-16" />
        </div>
      </div>
    </article>
  );
}

function shallowRangeRecordEqual(
  left: Record<string, [number, number]>,
  right: Record<string, [number, number]>,
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  for (const key of leftKeys) {
    if (!(key in right)) return false;
    if (left[key][0] !== right[key][0] || left[key][1] !== right[key][1]) return false;
  }

  return true;
}

function shallowTextRecordEqual(left: Record<string, string[]>, right: Record<string, string[]>) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  for (const key of leftKeys) {
    if (!(key in right)) return false;
    if (left[key].length !== right[key].length) return false;
    for (let index = 0; index < left[key].length; index += 1) {
      if (left[key][index] !== right[key][index]) return false;
    }
  }

  return true;
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

function stripArticleFromTitle(title: string, article?: string) {
  const rawTitle = title ?? "";
  const rawArticle = (article ?? "").trim();
  if (!rawTitle.trim() || !rawArticle) {
    return rawTitle;
  }

  // Avoid stripping generic labels: only attempt when the article looks like an actual code.
  if (!/\d/.test(rawArticle)) {
    return rawTitle;
  }

  const variants = Array.from(
    new Set([
      rawArticle,
      rawArticle.replace(/_/g, " "),
      rawArticle.replace(/\s+/g, " "),
      rawArticle.replace(/_/g, " ").replace(/\s+/g, " "),
    ]),
  )
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  let result = rawTitle;

  for (const variant of variants) {
    if (variant.length < 3) continue;
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Remove the exact article token, allowing light punctuation around it.
    result = result.replace(
      new RegExp(`(?:\\s*[\\(\\[\\{,;|—–-]\\s*)?${escaped}(?:\\s*[\\)\\]\\},;|—–-]\\s*)?`, "gi"),
      " ",
    );
  }

  result = result
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;|—–-])/g, "$1")
    .replace(/[,;|—–-]\s*$/g, "")
    .trim();

  return result || rawTitle;
}

function sanitizeCardMetaLine(value: string | undefined | null) {
  const trimmed = (value ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (/^Мощность:\s*0(?:\.0)?\s*кВт$/i.test(trimmed)) return "";
  if (/Энергоэффективность\s+уточняется/i.test(trimmed)) return "";
  return trimmed;
}

export default CatalogPage;
