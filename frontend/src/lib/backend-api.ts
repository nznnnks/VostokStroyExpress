import { formatPrice, type Product, type ProductFilter } from "../data/products";
import { ApiError, apiRequest } from "./api-client";
import { getStoredAccessToken } from "./auth";

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
};

export type AdminCategoryView = ApiCategory;
export type CatalogCategoryView = ApiCategory;

type ApiFilterGroup = {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  parameters?: ApiFilterParameter[];
};

type ApiFilterParameter = {
  id: string;
  groupId: string;
  name: string;
  slug: string;
  type: "TEXT" | "NUMBER";
  unit?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  group?: ApiFilterGroup | null;
};

type ApiProductFilterValue = {
  id: string;
  parameterId: string;
  value: string;
  numericValue?: number | null;
  parameter?: ApiFilterParameter | null;
};

export type AdminFilterGroupView = ApiFilterGroup & {
  parameters: ApiFilterParameter[];
};

type ApiDiscount = {
  id: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number;
  scope?: "ORDER" | "PRODUCT" | "CATEGORY" | "CLIENT";
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  clientProfileId?: string | null;
} | null;

type ApiProduct = {
  id: string;
  categoryId: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string | null;
  brandLabel?: string | null;
  country?: string | null;
  type?: string | null;
  price: number;
  finalPrice?: number | null;
  power?: number | null;
  volume?: number | null;
  rating?: string | null;
  efficiency?: string | null;
  efficiencyClass?: string | null;
  coverage?: string | null;
  acoustics?: string | null;
  filtration?: string | null;
  images?: string[];
  stock?: number;
  status?: string;
  oldPrice?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  category?: ApiCategory | null;
  discount?: ApiDiscount;
  filterValues?: ApiProductFilterValue[];
};

type ApiCatalogMeta = {
  brands: string[];
  countries: string[];
  types: string[];
  maxPrice: number;
  categoryCards: Array<{
    name: string;
    slug: string;
    count: number;
    image?: string;
  }>;
  categoryTypeTree: Array<{
    category: string;
    slug: string;
    count: number;
    types: Array<{ type: string; count: number }>;
  }>;
  currentCategoryTypes: Array<{ type: string; count: number }>;
  dynamicFilters: Array<{
    id: string;
    groupId: string;
    groupName: string;
    groupSlug: string;
    parameterName: string;
    parameterSlug: string;
    parameterType: "TEXT" | "NUMBER";
    unit?: string;
    values: string[];
    numericValues: number[];
    min: number;
    max: number;
  }>;
};

type ApiCatalogResponse = {
  items: ApiProduct[];
  page: number;
  limit: number;
  total: number;
  totalAll: number;
  hasMore: boolean;
  meta: ApiCatalogMeta | null;
};

type ApiNews = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
  images?: string[];
  contentBlocks?: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  createdAt: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  author?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string;
  } | null;
};

type ApiClientProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string | null;
  companyName?: string | null;
  inn?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  postalCode?: string | null;
  personalDiscountPercent?: number | string | null;
  comment?: string | null;
};

type ApiAccountProfile = {
  id: string;
  email: string;
  phone?: string | null;
  clientProfile?: ApiClientProfile | null;
};

type ApiService = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  heroTitle?: string | null;
  lead?: string | null;
  detailTitle?: string | null;
  bullets?: string[];
  detailImages?: string[];
  deliverables?: string[];
  imageUrl?: string | null;
  basePrice?: number | null;
  durationHours?: number | null;
  isActive?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
};

type ApiAdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  role: "SUPERADMIN" | "MANAGER" | "EDITOR";
  isActive?: boolean;
};

type ApiUser = {
  id: string;
  email: string;
  phone?: string | null;
  role: "CLIENT" | "MANAGER";
  status: "ACTIVE" | "BLOCKED";
  clientProfile?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

type ApiPayment = {
  id: string;
  orderId: string;
  method: "CARD" | "SBP" | "INVOICE" | "CASH";
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amount: number;
  provider?: string | null;
  transactionId?: string | null;
  currency?: string | null;
  paidAt?: string | null;
};

type ApiAccountDiscount = {
  personalDiscountPercent?: number | string | null;
};

type ApiOrderItem = {
  id: string;
  productId?: string | null;
  serviceId?: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string | null;
  sku?: string | null;
};

type ApiOrderPayment = {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  method: "CARD" | "SBP" | "INVOICE" | "CASH";
};

type ApiOrder = {
  id: string;
  orderNumber: string;
  status: "NEW" | "PENDING_PAYMENT" | "PAID" | "ASSEMBLY" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  comment?: string | null;
  placedAt?: string | null;
  createdAt: string;
  items: ApiOrderItem[];
  payments: ApiOrderPayment[];
  summary: {
    itemsCount: number;
    subtotal: number;
    discountTotal: number;
    vatTotal: number;
    total: number;
  };
  user?: {
    id: string;
    email?: string | null;
    clientProfile?: ApiClientProfile | null;
  } | null;
};

type ApiOrderTemplate = {
  id: string;
  title: string;
  contactName: string;
  phone: string;
  address: string;
  city?: string | null;
  postalCode?: string | null;
  comment?: string | null;
  isDefault: boolean;
};

export type AdminOrderStatus =
  | "NEW"
  | "PENDING_PAYMENT"
  | "PAID"
  | "ASSEMBLY"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

type ApiCartItem = {
  id: string;
  quantity: number;
  totalPrice: number;
  product?: ApiProduct | null;
  service?: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    basePrice?: number | null;
  } | null;
};

type ApiCart = {
  id: string;
  items: ApiCartItem[];
  summary: {
    itemsCount: number;
    itemsQuantity: number;
    subtotal: number;
    discountTotal: number;
    total: number;
  };
};

export type NewsPostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  images: string[];
  category: string;
  content: string[];
  dateLabel: string;
  publishedAt?: string | null;
  createdAt: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

export type ServiceView = {
  id: string;
  slug: string;
  title: string;
  shortText: string;
  image: string;
  heroTitle: string;
  lead: string;
  detailTitle: string;
  detailText: string;
  bullets: string[];
  detailImages: string[];
  deliverables: string[];
  basePrice?: number;
  durationHours?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

export type AccountProfileView = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone: string;
  totalOrders: number;
  personalDiscount: string;
  totalSpent: string;
};

export type AccountOrderView = {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  statusColor: string;
  delivery: string;
  payment: string;
  address: string;
  total: string;
  items: Array<{
    id: string;
    title: string;
    qty: number;
    price: string;
    image?: string | null;
  }>;
};

export type OrderTemplateView = {
  id: string;
  title: string;
  contact: string;
  phone: string;
  address: string;
  comment: string;
  isDefault: boolean;
};

export type CartView = {
  id: string;
  items: Array<{
    id: string;
    slug: string;
    title: string;
    article: string;
    image: string;
    qty: number;
    totalPrice: number;
    kind: "product" | "service";
    productId?: string;
    serviceId?: string;
    brandLabel?: string | null;
  }>;
  subtotal: number;
  discountTotal: number;
  total: number;
};

function mapCartResponse(cart: ApiCart): CartView {
  return {
    id: cart.id,
    items: cart.items.map((item) => {
      const product = item.product;
      const service = item.service;

      return {
        id: item.id,
        slug: product?.slug ?? service?.slug ?? item.id,
        title: product?.name ?? service?.name ?? "Позиция",
        article: product?.sku ?? "SERVICE",
        image: product?.images?.[0] ?? service?.imageUrl ?? "",
        qty: item.quantity,
        totalPrice: item.totalPrice,
        kind: product ? ("product" as const) : ("service" as const),
        productId: product?.id,
        serviceId: service?.id,
        brandLabel: product?.brandLabel ?? product?.brand ?? null,
      };
    }),
    subtotal: cart.summary.subtotal,
    discountTotal: cart.summary.discountTotal,
    total: cart.summary.total,
  };
}

export type AdminClientView = {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  inn?: string;
  contactPhone?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  comment?: string;
  personalDiscountPercent?: string;
  segment: string;
  manager: string;
  orders: string;
  totalSpent?: string;
  status: string;
};

export type AdminOrderView = {
  id: string;
  userId?: string;
  orderNumber: string;
  client: string;
  items: string;
  itemLines?: string;
  amount: string;
  status: string;
  statusCode?: AdminOrderStatus;
  date: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  contactName?: string;
  contactPhone?: string;
  comment?: string;
};

export type AdminNewsView = {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
};

export type AdminCatalogView = {
  id: string;
  title: string;
  brand: string;
  price: string;
  stock: string;
  categoryId: string;
};

function splitDescription(description?: string | null) {
  if (!description) {
    return undefined;
  }

  const paragraphs = description
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : undefined;
}

function resolveImage(product: ApiProduct) {
  return product.images?.[0] ?? "";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function mapOrderStatus(status: ApiOrder["status"]) {
  switch (status) {
    case "NEW":
      return ["Новый", "#8b8b86"] as const;
    case "PENDING_PAYMENT":
      return ["Ожидает оплаты", "#d3b46a"] as const;
    case "PAID":
      return ["Оплачен", "#3b9c54"] as const;
    case "ASSEMBLY":
      return ["Сборка", "#8a6a2a"] as const;
    case "SHIPPING":
      return ["Доставка", "#2a7b8a"] as const;
    case "DELIVERED":
      return ["Доставлен", "#2ebf63"] as const;
    case "CANCELLED":
      return ["Отменён", "#b24c47"] as const;
    default:
      return [status, "#8b8b86"] as const;
  }
}

function mapPaymentStatus(payments: ApiPayment[]) {
  const current = payments[0];

  if (!current) {
    return "Не указан";
  }

  switch (current.status) {
    case "PAID":
      return "Оплачено";
    case "PENDING":
      return "Ожидание оплаты";
    case "FAILED":
      return "Ошибка оплаты";
    case "REFUNDED":
      return "Возврат";
    default:
      return current.status;
  }
}

function mapNewsStatus(status: ApiNews["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "Опубликовано";
    case "DRAFT":
      return "Черновик";
    case "ARCHIVED":
      return "Архив";
    default:
      return status;
  }
}

function mapProductFilters(product: ApiProduct): ProductFilter[] {
  return (product.filterValues ?? [])
    .map((item) => {
      if (!item.parameter?.group) {
        return null;
      }

      if (item.parameter.isActive === false) {
        return null;
      }

      return {
        parameterId: item.parameterId,
        parameterName: item.parameter.name,
        parameterSlug: item.parameter.slug,
        parameterType: item.parameter.type,
        groupId: item.parameter.group.id,
        groupName: item.parameter.group.name,
        groupSlug: item.parameter.group.slug,
        unit: item.parameter.unit ?? undefined,
        value: item.value,
        numericValue: typeof item.numericValue === "number" ? item.numericValue : null,
      } satisfies ProductFilter;
    })
    .filter((item): item is ProductFilter => Boolean(item));
}

function mapApiProduct(product: ApiProduct): Product {
  const brand = product.brand ?? "Climate";
  const filters = mapProductFilters(product);
  const powerFilter = filters.find((item) => item.parameterSlug === "power" && item.parameterType === "NUMBER");
  const volumeFilter = filters.find((item) => item.parameterSlug === "volume" && item.parameterType === "NUMBER");
  const power = typeof product.power === "number" ? product.power : powerFilter?.numericValue ?? 0;
  const volume = typeof product.volume === "number" ? product.volume : volumeFilter?.numericValue ?? 0;
  const rawPrice = (product as unknown as { price?: unknown }).price;
  const rawFinalPrice = (product as unknown as { finalPrice?: unknown }).finalPrice;
  const parsedPrice = typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" ? Number(rawPrice) : NaN;
  const parsedFinalPrice =
    typeof rawFinalPrice === "number" ? rawFinalPrice : typeof rawFinalPrice === "string" ? Number(rawFinalPrice) : NaN;
  const actualPrice = Number.isFinite(parsedFinalPrice) ? parsedFinalPrice : Number.isFinite(parsedPrice) ? parsedPrice : product.price;

  return {
    slug: product.slug,
    image: resolveImage(product),
    gallery: product.images?.length ? product.images : [resolveImage(product)],
    brand,
    brandLabel: product.brandLabel ?? brand.toUpperCase(),
    title: product.name,
    article: product.sku,
    category: product.category?.name ?? "Каталог",
    categorySlug: product.category?.slug ?? undefined,
    country: product.country ?? "Не указано",
    type: product.type ?? "Оборудование",
    power,
    volume,
    price: actualPrice,
    rating: product.rating ?? (power >= 0.1 ? `Мощность: ${power.toFixed(1)} кВт` : ""),
    efficiency: product.efficiency && /уточняется/i.test(product.efficiency) ? "" : product.efficiency ?? "",
    efficiencyClass: product.efficiencyClass ?? undefined,
    coverage: product.coverage ?? undefined,
    acoustics: product.acoustics ?? undefined,
    filtration: product.filtration ?? undefined,
    filters,
    description: splitDescription(product.description),
    metaTitle: product.metaTitle ?? undefined,
    metaDescription: product.metaDescription ?? undefined,
    metaKeywords: product.metaKeywords ?? undefined,
  };
}

export type CatalogListingQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  countries?: string[];
  types?: string[];
  sort?: "popular" | "new" | "price-asc" | "price-desc";
  textFilters?: Record<string, string[]>;
  numericFilters?: Record<string, [number, number]>;
  includeMeta?: boolean;
};

export type CatalogListingResponse = {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalAll: number;
  hasMore: boolean;
  meta: ApiCatalogMeta | null;
};

function mapApiNews(item: ApiNews): NewsPostView {
  const images = Array.isArray(item.images) ? item.images : [];
  const coverImage = images[0] ?? item.coverImageUrl ?? "";

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? "",
    image: coverImage,
    images,
    category: item.category ?? "Новости",
    content: item.contentBlocks?.length ? item.contentBlocks : [],
    dateLabel: formatDate(item.publishedAt ?? item.createdAt),
    publishedAt: item.publishedAt ?? null,
    createdAt: item.createdAt,
    status: mapNewsStatus(item.status),
    metaTitle: item.metaTitle ?? undefined,
    metaDescription: item.metaDescription ?? undefined,
    metaKeywords: item.metaKeywords ?? undefined,
  };
}

function mapOrder(order: ApiOrder): AccountOrderView {
  const [status, statusColor] = mapOrderStatus(order.status);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: formatDate(order.placedAt ?? order.createdAt),
    status,
    statusColor,
    delivery: order.deliveryMethod ?? "Не указана",
    payment: mapPaymentStatus(order.payments),
    address: order.deliveryAddress ?? "Не указан",
    total: formatPrice(order.summary.total),
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      qty: item.quantity,
      price: formatPrice(item.totalPrice),
      image: item.imageUrl ?? null,
    })),
  };
}

function mapOrderTemplate(template: ApiOrderTemplate): OrderTemplateView {
  const addressParts = [template.address, template.city, template.postalCode].filter(Boolean);

  return {
    id: template.id,
    title: template.title,
    contact: template.contactName,
    phone: template.phone,
    address: addressParts.join(", "),
    comment: template.comment ?? "—",
    isDefault: template.isDefault,
  };
}

function profileName(profile?: ApiClientProfile | null, email?: string | null) {
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  return fullName || email || "Клиент";
}

async function loadPublicProductsRaw() {
  return apiRequest<ApiProduct[]>("/api/products", {
    query: { limit: 100 },
  });
}

export async function resolveProductIdsBySlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs)).filter(Boolean);

  if (uniqueSlugs.length === 0) {
    return new Map<string, string>();
  }

  const map = new Map<string, string>();

  // Fast path: try resolving from the generic public products listing.
  // Note: the endpoint is paginated/limited, so we may not see every product.
  const data = await loadPublicProductsRaw().catch(() => [] as ApiProduct[]);

  for (const product of data) {
    if (uniqueSlugs.includes(product.slug)) {
      map.set(product.slug, product.id);
    }
  }

  // Fallback: resolve missing slugs individually via the stable slug endpoint.
  const missing = uniqueSlugs.filter((slug) => !map.has(slug));

  if (missing.length === 0) {
    return map;
  }

  const resolved = await Promise.allSettled(
    missing.map(async (slug) => {
      const product = await apiRequest<ApiProduct>(`/api/products/slug/${encodeURIComponent(slug)}`);
      return { slug, id: product.id };
    }),
  );

  for (const entry of resolved) {
    if (entry.status !== "fulfilled") continue;
    map.set(entry.value.slug, entry.value.id);
  }

  return map;
}

async function loadPublicNewsRaw() {
  return apiRequest<ApiNews[]>("/api/news", {
    query: { limit: 100 },
  });
}

async function loadPublicServicesRaw() {
  return apiRequest<ApiService[]>("/api/services", {
    query: { limit: 100 },
  });
}

export async function loadCatalogProducts(): Promise<Product[]> {
  const data = await loadPublicProductsRaw();
  return Array.isArray(data) ? data.map(mapApiProduct) : [];
}

export async function loadCatalogListing(query: CatalogListingQuery = {}): Promise<CatalogListingResponse> {
  const data = await apiRequest<ApiCatalogResponse>("/api/products/catalog", {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 24,
      search: query.search?.trim() || undefined,
      category: query.category?.trim() || undefined,
      minPrice: typeof query.minPrice === "number" ? query.minPrice : undefined,
      maxPrice: typeof query.maxPrice === "number" ? query.maxPrice : undefined,
      sort: query.sort ?? "popular",
      brands: query.brands?.length ? JSON.stringify(query.brands) : undefined,
      countries: query.countries?.length ? JSON.stringify(query.countries) : undefined,
      types: query.types?.length ? JSON.stringify(query.types) : undefined,
      textFilters:
        query.textFilters && Object.keys(query.textFilters).length > 0 ? JSON.stringify(query.textFilters) : undefined,
      numericFilters:
        query.numericFilters && Object.keys(query.numericFilters).length > 0
          ? JSON.stringify(query.numericFilters)
          : undefined,
      includeMeta: query.includeMeta ?? true,
    },
  });

  return {
    items: Array.isArray(data.items) ? data.items.map(mapApiProduct) : [],
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalAll: data.totalAll,
    hasMore: data.hasMore,
    meta: data.meta,
  };
}

export async function loadCatalogCategories(): Promise<CatalogCategoryView[]> {
  const data = await apiRequest<ApiCategory[]>("/api/categories", {
    query: { limit: 100 },
  });

  return Array.isArray(data) ? data : [];
}

export async function loadCatalogProductBySlug(slug: string) {
  const current = await apiRequest<ApiProduct>(`/api/products/slug/${encodeURIComponent(slug)}`);
  const mappedCurrent = mapApiProduct(current);
  const relatedFetchLimit = 24;

  const emptyListing: CatalogListingResponse = {
    items: [],
    page: 1,
    limit: relatedFetchLimit,
    total: 0,
    totalAll: 0,
    hasMore: false,
    meta: null,
  };

  const sameCategoryPromise = mappedCurrent.categorySlug
    ? loadCatalogListing({ category: mappedCurrent.categorySlug, limit: relatedFetchLimit, includeMeta: false }).catch(() => emptyListing)
    : Promise.resolve(emptyListing);
  const sameBrandPromise = mappedCurrent.brand
    ? loadCatalogListing({ brands: [mappedCurrent.brand], limit: relatedFetchLimit, includeMeta: false }).catch(() => emptyListing)
    : Promise.resolve(emptyListing);

  const [sameCategory, sameBrand] = await Promise.all([sameCategoryPromise, sameBrandPromise]);

  const allProducts = [...sameCategory.items, ...sameBrand.items]
    .filter((item) => item.slug !== mappedCurrent.slug)
    .filter((item, index, items) => items.findIndex((entry) => entry.slug === item.slug) === index);

  const relatedProducts = allProducts.slice(0, 12);

  return {
    product: mappedCurrent,
    relatedProducts,
    allProducts,
  };
}

function mapApiService(item: ApiService): ServiceView {
  return {
    id: item.id,
    slug: item.slug,
    title: item.name,
    shortText: item.shortDescription ?? "",
    image: item.imageUrl ?? "",
    heroTitle: item.heroTitle ?? item.name,
    lead: item.lead ?? "",
    detailTitle: item.detailTitle ?? item.name,
    detailText: item.description ?? "",
    bullets: item.bullets?.length ? item.bullets : [],
    detailImages: item.detailImages?.length ? item.detailImages : item.imageUrl ? [item.imageUrl] : [],
    deliverables: item.deliverables?.length ? item.deliverables : [],
    basePrice: item.basePrice ?? undefined,
    durationHours: item.durationHours ?? undefined,
    metaTitle: item.metaTitle ?? undefined,
    metaDescription: item.metaDescription ?? undefined,
    metaKeywords: item.metaKeywords ?? undefined,
  };
}

export async function loadNewsPosts() {
  const data = await loadPublicNewsRaw();
  return Array.isArray(data) ? data.map(mapApiNews) : [];
}

export async function loadNewsPostBySlug(slug: string) {
  const posts = await loadNewsPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function loadServices() {
  const services = await loadPublicServicesRaw();
  return services.filter((item) => item.isActive !== false).map(mapApiService);
}

export async function loadServiceBySlug(slug: string) {
  const services = await loadPublicServicesRaw();
  const service = services.find((item) => item.slug === slug && item.isActive !== false);
  return service ? mapApiService(service) : null;
}

export async function loadAccountSnapshot() {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  const [profile, discount, orders, templates] = await Promise.all([
    apiRequest<ApiAccountProfile>("/api/account/profile", { authToken }),
    apiRequest<ApiAccountDiscount>("/api/account/discount", { authToken }),
    apiRequest<ApiOrder[]>("/api/account/orders", { authToken, query: { limit: 100 } }),
    apiRequest<ApiOrderTemplate[]>("/api/account/order-templates", { authToken, query: { limit: 100 } }),
  ]);

  const mappedOrders = orders.map(mapOrder);
  const totalSpent = orders.reduce((sum, item) => sum + item.summary.total, 0);

  return {
    profile: {
      id: profile.id,
      name: profileName(profile.clientProfile, profile.email),
      firstName: profile.clientProfile?.firstName ?? null,
      lastName: profile.clientProfile?.lastName ?? null,
      email: profile.email,
      phone: profile.phone ?? profile.clientProfile?.contactPhone ?? "—",
      totalOrders: mappedOrders.length,
      personalDiscount:
        toNumber(discount.personalDiscountPercent) !== null
          ? `${toNumber(discount.personalDiscountPercent)}%`
          : "0%",
      totalSpent: formatPrice(totalSpent),
    } satisfies AccountProfileView,
    orders: mappedOrders,
    templates: templates.map(mapOrderTemplate),
  };
}

export async function updateAccountProfile(payload: {
  email?: string;
  phone?: string;
  password?: string;
  clientProfile?: {
    firstName?: string;
    lastName?: string;
  };
}) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  return apiRequest<ApiAccountProfile>("/api/account/profile", {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function loadAccountOrder(orderId: string) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  const [profile, order] = await Promise.all([
    apiRequest<ApiAccountProfile>("/api/account/profile", { authToken }),
    apiRequest<ApiOrder>(`/api/account/orders/${orderId}`, { authToken }),
  ]);

  return {
    profileName: profileName(profile.clientProfile, profile.email),
    order: mapOrder(order),
  };
}

export async function createOrderTemplate(payload: {
  title: string;
  contactName: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  comment?: string;
  isDefault?: boolean;
}) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  return apiRequest<ApiOrderTemplate>("/api/order-templates", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateOrderTemplate(
  id: string,
  payload: {
    title?: string;
    contactName?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    comment?: string;
    isDefault?: boolean;
  },
) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  return apiRequest<ApiOrderTemplate>(`/api/order-templates/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteOrderTemplate(id: string) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  await apiRequest(`/api/order-templates/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function loadCurrentCart() {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  const cart = await apiRequest<ApiCart>("/api/carts/current", { authToken });

  return mapCartResponse(cart);
}

export async function addProductToCurrentCartBySlug(slug: string) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  const products = await loadPublicProductsRaw();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    throw new ApiError(`Товар ${slug} не найден.`, 404);
  }

  await apiRequest("/api/carts/current/items", {
    method: "POST",
    authToken,
    body: {
      productId: product.id,
      quantity: 1,
    },
  });

  return loadCurrentCart();
}

export async function updateCurrentCartItem(itemId: string, quantity: number) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  const cart = await apiRequest<ApiCart>(`/api/carts/current/items/${itemId}`, {
    method: "PATCH",
    authToken,
    body: { quantity },
  });

  return mapCartResponse(cart);
}

export async function removeCurrentCartItem(itemId: string) {
  const authToken = getStoredAccessToken("user");

  if (!authToken) {
    throw new ApiError("Требуется авторизация пользователя.", 401);
  }

  const cart = await apiRequest<ApiCart>(`/api/carts/current/items/${itemId}`, {
    method: "DELETE",
    authToken,
  });

  return mapCartResponse(cart);
}

export async function loadAdminSectionData() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  const [clients, orders, news, catalog] = await Promise.all([
    apiRequest<Array<ApiClientProfile & { user?: { id: string; email?: string | null; status?: "ACTIVE" | "BLOCKED" } | null }>>("/api/client-profiles", {
      authToken,
      query: { limit: 50 },
    }),
    apiRequest<ApiOrder[]>("/api/orders", {
      authToken,
      query: { limit: 50 },
    }),
    apiRequest<ApiNews[]>("/api/news", {
      authToken,
      query: { limit: 50 },
    }),
    apiRequest<ApiProduct[]>("/api/products", {
      authToken,
      query: { limit: 50 },
    }),
  ]);

  const ordersByUserId = new Map<string, { count: number; total: number }>();

  for (const order of orders) {
    const userId = order.user?.id;

    if (!userId) {
      continue;
    }

    const current = ordersByUserId.get(userId) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += order.summary.total;
    ordersByUserId.set(userId, current);
  }

  const mappedClients = clients.map((item) => {
    const stats = ordersByUserId.get(item.userId) ?? { count: 0, total: 0 };

      return {
        id: item.id,
        userId: item.userId,
        name: profileName(item, item.user?.email ?? null),
        email: item.user?.email ?? "",
      firstName: item.firstName,
      lastName: item.lastName ?? "",
      companyName: item.companyName ?? "",
      inn: item.inn ?? "",
      contactPhone: item.contactPhone ?? "",
      addressLine1: item.addressLine1 ?? "",
      city: item.city ?? "",
      postalCode: item.postalCode ?? "",
      comment: item.comment ?? "",
        personalDiscountPercent:
          toNumber(item.personalDiscountPercent) !== null
            ? String(toNumber(item.personalDiscountPercent))
            : "",
        segment: item.companyName ?? "Частный клиент",
        manager: "—",
        orders: String(stats.count),
        totalSpent: formatPrice(stats.total),
        status: item.user?.status === "BLOCKED" ? "Заблокирован" : "Активен",
      };
    }) satisfies AdminClientView[];

  const mappedOrders = orders.map((item) => ({
    id: item.id,
    userId: item.user?.id ?? "",
    orderNumber: item.orderNumber,
    client: profileName(item.user?.clientProfile, item.user?.email ?? null),
    items: `${item.summary.itemsCount} поз.`,
    itemLines: item.items
      .map((orderItem) => {
        const kind = orderItem.productId ? "product" : "service";
        const entityId = orderItem.productId ?? orderItem.serviceId;

        return entityId ? `${kind}:${entityId}:${orderItem.quantity}` : "";
      })
      .filter(Boolean)
      .join("\n"),
    amount: formatPrice(item.summary.total),
    status: mapOrderStatus(item.status)[0],
    statusCode: item.status,
    date: formatDate(item.placedAt ?? item.createdAt),
    deliveryMethod: item.deliveryMethod ?? "",
    deliveryAddress: item.deliveryAddress ?? "",
    contactName: item.contactName ?? "",
    contactPhone: item.contactPhone ?? "",
    comment: item.comment ?? "",
  })) satisfies AdminOrderView[];

  return {
    clients: clients.map((item) => ({
      id: item.id,
      name: profileName(item, item.user?.email ?? null),
      email: item.user?.email ?? "",
      segment: item.companyName ?? "Частный клиент",
      manager: "—",
      orders: "—",
      status: "Активен",
    })) satisfies AdminClientView[],
    orders: orders.map((item) => ({
      id: item.id,
      orderNumber: item.orderNumber,
      client: profileName(item.user?.clientProfile, item.user?.email ?? null),
      items: `${item.summary.itemsCount} поз.`,
      amount: formatPrice(item.summary.total),
      status: mapOrderStatus(item.status)[0],
      date: formatDate(item.placedAt ?? item.createdAt),
    })) satisfies AdminOrderView[],
    ...{
      clients: mappedClients,
      orders: mappedOrders,
    },
    news: news.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category ?? "Новости",
      date: formatDate(item.publishedAt ?? item.createdAt),
      status: mapNewsStatus(item.status),
    })) satisfies AdminNewsView[],
    catalog: catalog.map((item) => ({
      id: item.id,
      title: item.name,
      categoryId: item.category?.id ?? item.categoryId,
      brand: item.brandLabel ?? item.brand ?? "—",
      price: formatPrice(typeof item.finalPrice === "number" ? item.finalPrice : item.price),
      stock: typeof item.stock === "number" && item.stock > 0 ? "В наличии" : "Под заказ",
    })) satisfies AdminCatalogView[],
  };
}

export async function loadAdminCategories() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiCategory[]>("/api/categories", {
    authToken,
    query: { limit: 50 },
  });
}

export async function loadAdminServices() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiService[]>("/api/services", {
    authToken,
    query: { limit: 50 },
  });
}

export async function loadAdminCategoryById(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiCategory>(`/api/categories/${id}`.replace(/\/+/g, "/"), {
    authToken,
  });
}

export async function loadAdminServiceById(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiService>(`/api/services/${id}`.replace(/\/+/g, "/"), {
    authToken,
  });
}

export async function loadAdminDiscounts() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiDiscount[]>("/api/discounts", {
    authToken,
    query: { limit: 50 },
  });
}

export async function loadAdminPayments() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiPayment[]>("/api/payments", {
    authToken,
    query: { limit: 50 },
  });
}

export async function loadAdminUsers() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiAdminUser[]>("/api/admin-users", {
    authToken,
    query: { limit: 50 },
  });
}

export async function loadUsers() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiUser[]>("/api/users", {
    authToken,
    query: { limit: 50 },
  });
}

export async function createUser(payload: {
  email: string;
  phone?: string;
  passwordHash: string;
  role?: "CLIENT" | "MANAGER";
  status?: "ACTIVE" | "BLOCKED";
  clientProfile?: {
    firstName: string;
    lastName?: string;
  };
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiUser>("/api/users", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateUser(
  id: string,
  payload: {
    email?: string;
    phone?: string;
    passwordHash?: string;
    role?: "CLIENT" | "MANAGER";
    status?: "ACTIVE" | "BLOCKED";
    clientProfile?: {
      firstName?: string;
      lastName?: string;
    };
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiUser>(`/api/users/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteUser(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/users/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminService(payload: {
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  heroTitle?: string;
  lead?: string;
  detailTitle?: string;
  bullets?: string[];
  detailImages?: string[];
  deliverables?: string[];
  imageUrl?: string;
  basePrice?: number;
  durationHours?: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiService>("/api/services", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminService(
  id: string,
  payload: {
    slug?: string;
    name?: string;
    shortDescription?: string;
    description?: string;
    heroTitle?: string;
    lead?: string;
    detailTitle?: string;
    bullets?: string[];
    detailImages?: string[];
    deliverables?: string[];
    imageUrl?: string;
    basePrice?: number;
    durationHours?: number;
    isActive?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiService>(`/api/services/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminService(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/services/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminDiscount(payload: {
  name: string;
  code?: string;
  description?: string;
  type: "PERCENT" | "FIXED";
  scope?: "ORDER" | "PRODUCT" | "CATEGORY" | "CLIENT";
  value: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  productId?: string;
  categoryId?: string;
  clientProfileId?: string;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiDiscount>("/api/discounts", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminDiscount(
  id: string,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    type?: "PERCENT" | "FIXED";
    scope?: "ORDER" | "PRODUCT" | "CATEGORY" | "CLIENT";
    value?: number;
    isActive?: boolean;
    startsAt?: string;
    endsAt?: string;
    productId?: string;
    categoryId?: string;
    clientProfileId?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiDiscount>(`/api/discounts/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminDiscount(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/discounts/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminUser(payload: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  role?: "SUPERADMIN" | "MANAGER" | "EDITOR";
  isActive?: boolean;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiAdminUser>("/api/admin-users", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminUser(
  id: string,
  payload: {
    email?: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    role?: "SUPERADMIN" | "MANAGER" | "EDITOR";
    isActive?: boolean;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiAdminUser>(`/api/admin-users/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminUser(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/admin-users/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminPayment(payload: {
  orderId: string;
  method: "CARD" | "SBP" | "INVOICE" | "CASH";
  status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amount: number;
  provider?: string;
  transactionId?: string;
  currency?: string;
  paidAt?: string;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiPayment>("/api/payments", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminPayment(
  id: string,
  payload: {
    orderId?: string;
    method?: "CARD" | "SBP" | "INVOICE" | "CASH";
    status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    amount?: number;
    provider?: string;
    transactionId?: string;
    currency?: string;
    paidAt?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiPayment>(`/api/payments/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminPayment(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/payments/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminOrder(payload: {
  userId: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  contactName?: string;
  contactPhone?: string;
  comment?: string;
  items: Array<
    | { productId: string; quantity: number }
    | { serviceId: string; quantity: number }
  >;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiOrder>("/api/orders", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminOrder(
  id: string,
  payload: {
    status?: AdminOrderStatus;
    deliveryMethod?: string;
    deliveryAddress?: string;
    contactName?: string;
    contactPhone?: string;
    comment?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiOrder>(`/api/orders/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function updateAdminOrderStatus(id: string, status: AdminOrderStatus) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiOrder>(`/api/orders/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: { status },
  });
}

export async function deleteAdminOrder(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/orders/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createOrder(payload: {
  contactName?: string;
  contactPhone?: string;
  email?: string;
  deliveryAddress?: string;
  deliveryMethod?: string;
  comment?: string;
  items: Array<{ productId: string; quantity: number }>;
  payment?: {
    method: "CARD" | "SBP" | "INVOICE" | "CASH";
    provider?: string;
    transactionId?: string;
    currency?: string;
    paidAt?: string;
  };
}) {
  const authToken = getStoredAccessToken("user");

  return apiRequest<ApiOrder>("/api/orders", {
    method: "POST",
    authToken: authToken ?? undefined,
    body: payload,
  });
}

export async function createAdminClientProfile(payload: {
  userId: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
  inn?: string;
  contactPhone?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  comment?: string;
  personalDiscountPercent?: number;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiClientProfile>("/api/client-profiles", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminClientProfile(
  id: string,
  payload: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    inn?: string;
    contactPhone?: string;
    addressLine1?: string;
    city?: string;
    postalCode?: string;
    comment?: string;
    personalDiscountPercent?: number;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiClientProfile>(`/api/client-profiles/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminClientProfile(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/client-profiles/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminCategory(payload: {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiCategory>("/api/categories", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminCategory(
  id: string,
  payload: {
    name?: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiCategory>(`/api/categories/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminCategory(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/categories/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminNews(payload: {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  images?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiNews>("/api/news", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminNews(
  id: string,
  payload: {
    title?: string;
    slug?: string;
    excerpt?: string;
    category?: string;
    images?: string[];
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    publishedAt?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiNews>(`/api/news/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminNews(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/news/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function loadAdminNewsById(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiNews>(`/api/news/${id}`.replace(/\/+/g, "/"), {
    authToken,
  });
}

export async function loadAdminFilterGroups() {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  const groups = await apiRequest<ApiFilterGroup[]>("/api/filter-groups", {
    authToken,
  });

  return groups.map((group) => ({
    ...group,
    parameters: group.parameters ?? [],
  })) satisfies AdminFilterGroupView[];
}

export async function uploadAdminNewsImage(file: File) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<{ url: string; path: string; name: string; size: number; mimeType: string }>("/api/news/upload-image", {
    method: "POST",
    authToken,
    body: formData,
  });
}

export async function uploadAdminProductImage(file: File) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<{ url: string; path: string; name: string; size: number; mimeType: string }>("/api/products/upload-image", {
    method: "POST",
    authToken,
    body: formData,
  });
}

export async function createAdminFilterGroup(payload: {
  name: string;
  slug: string;
  sortOrder?: number;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  return apiRequest<ApiFilterGroup>("/api/filter-groups", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminFilterGroup(
  id: string,
  payload: {
    name?: string;
    slug?: string;
    sortOrder?: number;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  return apiRequest<ApiFilterGroup>(`/api/filter-groups/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminFilterGroup(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  await apiRequest(`/api/filter-groups/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminFilterParameter(
  groupId: string,
  payload: {
    name: string;
    slug: string;
    type?: "TEXT" | "NUMBER";
    unit?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  return apiRequest<ApiFilterParameter>(`/api/filter-groups/${groupId}/parameters`.replace(/\/+/g, "/"), {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminFilterParameter(
  groupId: string,
  parameterId: string,
  payload: {
    name?: string;
    slug?: string;
    type?: "TEXT" | "NUMBER";
    unit?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  return apiRequest<ApiFilterParameter>(
    `/api/filter-groups/${groupId}/parameters/${parameterId}`.replace(/\/+/g, "/"),
    {
      method: "PATCH",
      authToken,
      body: payload,
    },
  );
}

export async function deleteAdminFilterParameter(groupId: string, parameterId: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.", 401);
  }

  await apiRequest(`/api/filter-groups/${groupId}/parameters/${parameterId}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function createAdminProduct(payload: {
  categoryId: string;
  slug: string;
  sku: string;
  name: string;
  price: number;
  oldPrice?: number;
  brand?: string;
  brandLabel?: string;
  country?: string;
  type?: string;
  shortDescription?: string;
  description?: string;
  efficiency?: string;
  efficiencyClass?: string;
  coverage?: string;
  acoustics?: string;
  filtration?: string;
  power?: number;
  volume?: number;
  filterValues?: Array<{
    parameterId: string;
    value?: string;
    numericValue?: number;
  }>;
  images?: string[];
  stock?: number;
  status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiProduct>("/api/products", {
    method: "POST",
    authToken,
    body: payload,
  });
}

export async function updateAdminProduct(
  id: string,
  payload: {
    categoryId?: string;
    slug?: string;
    sku?: string;
    name?: string;
    price?: number;
    oldPrice?: number;
    brand?: string;
    brandLabel?: string;
    country?: string;
    type?: string;
    shortDescription?: string;
    description?: string;
    efficiency?: string;
    efficiencyClass?: string;
    coverage?: string;
    acoustics?: string;
    filtration?: string;
    power?: number;
    volume?: number;
    filterValues?: Array<{
      parameterId: string;
      value?: string;
      numericValue?: number;
    }>;
    images?: string[];
    stock?: number;
    status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  },
) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiProduct>(`/api/products/${id}`.replace(/\/+/g, "/"), {
    method: "PATCH",
    authToken,
    body: payload,
  });
}

export async function deleteAdminProduct(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  await apiRequest(`/api/products/${id}`.replace(/\/+/g, "/"), {
    method: "DELETE",
    authToken,
  });
}

export async function loadAdminProductById(id: string) {
  const authToken = getStoredAccessToken("admin");

  if (!authToken) {
    throw new ApiError("Требуется авторизация администратора.", 401);
  }

  return apiRequest<ApiProduct>(`/api/products/${id}`.replace(/\/+/g, "/"), {
    authToken,
  });
}
