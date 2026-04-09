import { featuredProduct, formatPrice, products as fallbackProducts, type Product } from "../data/products";
import { accountOrders as fallbackAccountOrders, customerProfile as fallbackCustomerProfile, orderTemplates as fallbackOrderTemplates } from "../data/account";
import { adminCatalog as fallbackAdminCatalog, adminClients as fallbackAdminClients, adminNews as fallbackAdminNews, adminOrders as fallbackAdminOrders } from "../data/admin";
import { newsPosts as siteNewsPosts } from "../data/site";
import { ApiError, apiRequest } from "./api-client";
import { getStoredAccessToken } from "./auth";

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

type ApiDiscount = {
  id: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number;
} | null;

type ApiProduct = {
  id: string;
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
  category?: ApiCategory | null;
  discount?: ApiDiscount;
};

type ApiNews = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
  contentBlocks?: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  createdAt: string;
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
  firstName: string;
  lastName?: string | null;
  companyName?: string | null;
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

type ApiAccountDiscount = {
  personalDiscountPercent?: number | string | null;
};

type ApiOrderItem = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string | null;
  sku?: string | null;
};

type ApiPayment = {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  method: "CARD" | "SBP" | "INVOICE" | "CASH";
};

type ApiOrder = {
  id: string;
  orderNumber: string;
  status: "NEW" | "PENDING_PAYMENT" | "PAID" | "ASSEMBLY" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;
  placedAt?: string | null;
  createdAt: string;
  items: ApiOrderItem[];
  payments: ApiPayment[];
  summary: {
    itemsCount: number;
    subtotal: number;
    discountTotal: number;
    vatTotal: number;
    total: number;
  };
  user?: {
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
  category: string;
  content: string[];
  dateLabel: string;
  status: string;
};

export type AccountProfileView = {
  id: string;
  name: string;
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
        image: product?.images?.[0] ?? service?.imageUrl ?? featuredProduct.image,
        qty: item.quantity,
        totalPrice: item.totalPrice,
        kind: product ? ("product" as const) : ("service" as const),
      };
    }),
    subtotal: cart.summary.subtotal,
    discountTotal: cart.summary.discountTotal,
    total: cart.summary.total,
  };
}

export type AdminClientView = {
  id: string;
  name: string;
  segment: string;
  manager: string;
  orders: string;
  status: string;
};

export type AdminOrderView = {
  id: string;
  client: string;
  items: string;
  amount: string;
  status: string;
  date: string;
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
  return product.images?.[0] || featuredProduct.image;
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

function mapApiProduct(product: ApiProduct): Product {
  const brand = product.brand ?? "Climate";
  const power = typeof product.power === "number" ? product.power : 0;
  const volume = typeof product.volume === "number" ? product.volume : 0;
  const actualPrice = typeof product.finalPrice === "number" ? product.finalPrice : product.price;

  return {
    slug: product.slug,
    image: resolveImage(product),
    gallery: product.images?.length ? product.images : [resolveImage(product)],
    brand,
    brandLabel: product.brandLabel ?? brand.toUpperCase(),
    title: product.name,
    article: product.sku,
    category: product.category?.name ?? "Каталог",
    country: product.country ?? "Не указано",
    type: product.type ?? "Оборудование",
    power,
    volume,
    price: actualPrice,
    rating: product.rating ?? `Мощность: ${power.toFixed(1)} кВт`,
    efficiency: product.efficiency ?? "Энергоэффективность уточняется",
    efficiencyClass: product.efficiencyClass ?? undefined,
    coverage: product.coverage ?? undefined,
    acoustics: product.acoustics ?? undefined,
    filtration: product.filtration ?? undefined,
    description: splitDescription(product.description),
  };
}

function mapApiNews(item: ApiNews): NewsPostView {
  const fallback = siteNewsPosts.find((post) => post.slug === item.slug);

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? fallback?.excerpt ?? "",
    image: item.coverImageUrl ?? fallback?.image ?? "/image/новостнойблок1.png",
    category: item.category ?? fallback?.category ?? "Новости",
    content: item.contentBlocks?.length ? item.contentBlocks : fallback?.content ?? [],
    dateLabel: formatDate(item.publishedAt ?? item.createdAt),
    status: mapNewsStatus(item.status),
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

async function loadPublicNewsRaw() {
  return apiRequest<ApiNews[]>("/api/news", {
    query: { limit: 100 },
  });
}

export async function loadCatalogProducts(): Promise<Product[]> {
  try {
    const data = await loadPublicProductsRaw();

    if (!Array.isArray(data) || data.length === 0) {
      return [...fallbackProducts, featuredProduct];
    }

    return data.map(mapApiProduct);
  } catch (error) {
    console.warn("Catalog API is unavailable, fallback mock data is used.", error);
    return [...fallbackProducts, featuredProduct];
  }
}

export async function loadCatalogProductBySlug(slug: string) {
  try {
    const data = await loadPublicProductsRaw();
    const current = data.find((item) => item.slug === slug);

    if (!current) {
      throw new Error(`Product with slug ${slug} was not found.`);
    }

    const mappedCurrent = mapApiProduct(current);
    const relatedProducts = data
      .filter((item) => item.slug !== slug)
      .filter((item) => item.category?.id === current.category?.id || item.brand === current.brand)
      .slice(0, 4)
      .map(mapApiProduct);

    return {
      product: mappedCurrent,
      relatedProducts,
      allProducts: data.map(mapApiProduct),
    };
  } catch (error) {
    console.warn("Product detail API is unavailable, fallback mock data is used.", error);
    const allProducts = [...fallbackProducts, featuredProduct];
    const product = allProducts.find((item) => item.slug === slug) ?? featuredProduct;

    return {
      product,
      relatedProducts: allProducts.filter((item) => item.slug !== product.slug).slice(0, 4),
      allProducts,
    };
  }
}

export async function loadNewsPosts() {
  try {
    const data = await loadPublicNewsRaw();

    if (!Array.isArray(data) || data.length === 0) {
      return [...siteNewsPosts].map((item) => ({
        id: item.slug,
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        image: item.image,
        category: item.category,
        content: [...item.content],
        dateLabel: "—",
        status: "Опубликовано",
      }));
    }

    return data.map(mapApiNews);
  } catch (error) {
    console.warn("News API is unavailable, fallback mock data is used.", error);
    return [...siteNewsPosts].map((item) => ({
      id: item.slug,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      image: item.image,
      category: item.category,
      content: [...item.content],
      dateLabel: "—",
      status: "Опубликовано",
    }));
  }
}

export async function loadNewsPostBySlug(slug: string) {
  const posts = await loadNewsPosts();
  return posts.find((post) => post.slug === slug) ?? null;
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
      email: profile.email,
      phone: profile.phone ?? profile.clientProfile?.contactPhone ?? "—",
      totalOrders: mappedOrders.length,
      personalDiscount:
        toNumber(discount.personalDiscountPercent) !== null
          ? `${toNumber(discount.personalDiscountPercent)}%`
          : "—",
      totalSpent: formatPrice(totalSpent),
    } satisfies AccountProfileView,
    orders: mappedOrders,
    templates: templates.map(mapOrderTemplate),
  };
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
    apiRequest<Array<ApiClientProfile & { user?: { email?: string | null } | null }>>("/api/client-profiles", {
      authToken,
      query: { limit: 100 },
    }),
    apiRequest<ApiOrder[]>("/api/orders", {
      authToken,
      query: { limit: 100 },
    }),
    apiRequest<ApiNews[]>("/api/news", {
      authToken,
      query: { limit: 100 },
    }),
    apiRequest<ApiProduct[]>("/api/products", {
      authToken,
      query: { limit: 100 },
    }),
  ]);

  return {
    clients: clients.map((item) => ({
      id: item.id,
      name: profileName(item, item.user?.email ?? null),
      segment: item.companyName ?? "Частный клиент",
      manager: "—",
      orders: "—",
      status: "Активен",
    })) satisfies AdminClientView[],
    orders: orders.map((item) => ({
      id: item.orderNumber,
      client: profileName(item.user?.clientProfile, item.user?.email ?? null),
      items: `${item.summary.itemsCount} поз.`,
      amount: formatPrice(item.summary.total),
      status: mapOrderStatus(item.status)[0],
      date: formatDate(item.placedAt ?? item.createdAt),
    })) satisfies AdminOrderView[],
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
      brand: item.brandLabel ?? item.brand ?? "—",
      price: formatPrice(typeof item.finalPrice === "number" ? item.finalPrice : item.price),
      stock: typeof item.stock === "number" && item.stock > 0 ? "В наличии" : "Под заказ",
    })) satisfies AdminCatalogView[],
  };
}

export const fallbackAccountData = {
  profile: {
    id: "mock-user",
    name: fallbackCustomerProfile.name,
    email: fallbackCustomerProfile.email,
    phone: "—",
    totalOrders: fallbackCustomerProfile.totalOrders,
    personalDiscount: fallbackCustomerProfile.personalDiscount,
    totalSpent: fallbackCustomerProfile.totalSpent,
  } satisfies AccountProfileView,
  orders: fallbackAccountOrders.map((order) => ({
    id: order.id.toLowerCase(),
    orderNumber: order.id,
    date: order.date,
    status: order.status,
    statusColor: order.statusColor,
    delivery: order.delivery,
    payment: order.payment,
    address: order.address,
    total: order.total,
    items: order.items.map((item, index) => ({
      id: `${order.id}-${index}`,
      title: item.title,
      qty: item.qty,
      price: item.price,
      image: null,
    })),
  })) satisfies AccountOrderView[],
  templates: fallbackOrderTemplates.map((template) => ({
    id: template.id,
    title: template.title,
    contact: template.contact,
    phone: template.phone,
    address: template.address,
    comment: template.comment,
    isDefault: false,
  })) satisfies OrderTemplateView[],
};

export const fallbackAdminSectionData = {
  clients: fallbackAdminClients.map((item, index) => ({
    id: String(index),
    ...item,
  })) satisfies AdminClientView[],
  orders: fallbackAdminOrders.map((item) => ({
    id: item.id,
    client: item.client,
    items: item.items,
    amount: item.amount,
    status: item.status,
    date: item.date,
  })) satisfies AdminOrderView[],
  news: fallbackAdminNews.map((item, index) => ({
    id: String(index),
    ...item,
  })) satisfies AdminNewsView[],
  catalog: fallbackAdminCatalog.map((item, index) => ({
    id: String(index),
    ...item,
  })) satisfies AdminCatalogView[],
};
