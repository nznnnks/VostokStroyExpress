import type { Product } from "../data/products";
import { loadCatalogProductBySlug, loadCatalogProducts, resolveProductIdsBySlugs, type CartView } from "./backend-api";

type StoredCartItem = {
  slug: string;
  quantity: number;
  snapshot?: Pick<Product, "slug" | "title" | "article" | "image" | "price" | "brandLabel">;
};

const CART_COOKIE_KEY = "vostokstroyexpert-cart";
export const SESSION_CART_UPDATED_EVENT = "session-cart-updated";

function isBrowser() {
  return typeof document !== "undefined";
}

function readCookie(name: string) {
  if (!isBrowser()) {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");

    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

function writeCookie(name: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function normalizeItems(items: StoredCartItem[]) {
  const merged = new Map<string, { quantity: number; snapshot?: StoredCartItem["snapshot"] }>();

  for (const item of items) {
    const slug = item.slug?.trim();
    const quantity = Math.max(0, Math.floor(item.quantity));

    if (!slug || quantity <= 0) {
      continue;
    }

    const current = merged.get(slug);
    merged.set(slug, {
      quantity: (current?.quantity ?? 0) + quantity,
      snapshot: item.snapshot ?? current?.snapshot,
    });
  }

  return Array.from(merged.entries()).map(([slug, value]) => ({ slug, quantity: value.quantity, snapshot: value.snapshot }));
}

function readStoredCartItems() {
  const raw = readCookie(CART_COOKIE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return normalizeItems(JSON.parse(raw) as StoredCartItem[]);
  } catch {
    clearCookie(CART_COOKIE_KEY);
    return [];
  }
}

function writeStoredCartItems(items: StoredCartItem[]) {
  const normalized = normalizeItems(items);

  if (normalized.length === 0) {
    clearCookie(CART_COOKIE_KEY);
    notifySessionCartUpdated();
    return;
  }

  writeCookie(CART_COOKIE_KEY, JSON.stringify(normalized));
  notifySessionCartUpdated();
}

function notifySessionCartUpdated() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_CART_UPDATED_EVENT));
}

function mapCart(products: Product[], items: StoredCartItem[]): CartView {
  const productMap = new Map(products.map((product) => [product.slug, product]));
  const normalizedItems: CartView["items"] = [];

  for (const item of items) {
    const product = productMap.get(item.slug);

    if (!product) {
      continue;
    }

    normalizedItems.push({
      id: product.slug,
      slug: product.slug,
      title: product.title,
      article: product.article,
      image: product.image,
      qty: item.quantity,
      totalPrice: product.price * item.quantity,
      kind: "product",
      brandLabel: product.brandLabel,
    });
  }

  for (const item of items) {
    if (normalizedItems.some((current) => current.slug === item.slug)) {
      continue;
    }

    if (!item.snapshot) {
      continue;
    }

    normalizedItems.push({
      id: item.slug,
      slug: item.slug,
      title: item.snapshot.title,
      article: item.snapshot.article,
      image: item.snapshot.image,
      qty: item.quantity,
      totalPrice: item.snapshot.price * item.quantity,
      kind: "product",
      brandLabel: item.snapshot.brandLabel,
    });
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: "session-cart",
    items: normalizedItems,
    subtotal,
    discountTotal: 0,
    total: subtotal,
  };
}

function canBuildCartFromSnapshots(items: StoredCartItem[]) {
  return items.every((item) => item.snapshot);
}

function buildCartFromSnapshots(items: StoredCartItem[]) {
  const normalizedItems: CartView["items"] = items
    .filter((item): item is StoredCartItem & { snapshot: NonNullable<StoredCartItem["snapshot"]> } => Boolean(item.snapshot))
    .map((item) => ({
      id: item.slug,
      slug: item.slug,
      title: item.snapshot.title,
      article: item.snapshot.article,
      image: item.snapshot.image,
      qty: item.quantity,
      totalPrice: item.snapshot.price * item.quantity,
      kind: "product" as const,
      brandLabel: item.snapshot.brandLabel,
    }));

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: "session-cart",
    items: normalizedItems,
    subtotal,
    discountTotal: 0,
    total: subtotal,
  };
}

async function buildCartFromCookie() {
  const storedItems = readStoredCartItems();
  const products = await loadCatalogProducts();
  const cart = mapCart(products, storedItems);

  if (cart.items.length !== storedItems.length) {
    writeStoredCartItems(cart.items.map((item) => ({ slug: item.slug, quantity: item.qty })));
  }

  return cart;
}

export async function loadSessionCart() {
  return buildCartFromCookie();
}

export async function addProductToSessionCartBySlug(slug: string) {
  const items = readStoredCartItems();
  const nextItems = [...items];
  const existing = nextItems.find((item) => item.slug === slug);

  if (existing) {
    existing.quantity += 1;
    if (existing.snapshot) {
      writeStoredCartItems(nextItems);
      return buildCartFromSnapshots(normalizeItems(nextItems));
    }
  } else {
    nextItems.push({ slug, quantity: 1 });
  }

  const result = await loadCatalogProductBySlug(slug);
  const product = result.product;
  const snapshot = {
    slug: product.slug,
    title: product.title,
    article: product.article,
    image: product.image,
    price: product.price,
    brandLabel: product.brandLabel,
  } satisfies StoredCartItem["snapshot"];

  const target = nextItems.find((item) => item.slug === slug);
  if (target) {
    target.snapshot = snapshot;
  }

  writeStoredCartItems(nextItems);
  return buildCartFromSnapshots(normalizeItems(nextItems));
}

export async function addProductToSessionCart(product: Product) {
  const items = readStoredCartItems();
  const nextItems = [...items];
  const existing = nextItems.find((item) => item.slug === product.slug);
  const snapshot = {
    slug: product.slug,
    title: product.title,
    article: product.article,
    image: product.image,
    price: product.price,
    brandLabel: product.brandLabel,
  } satisfies StoredCartItem["snapshot"];

  if (existing) {
    existing.quantity += 1;
    existing.snapshot = snapshot;
  } else {
    nextItems.push({ slug: product.slug, quantity: 1, snapshot });
  }

  writeStoredCartItems(nextItems);
  return buildCartFromSnapshots(normalizeItems(nextItems));
}

export async function updateSessionCartItem(itemId: string, quantity: number) {
  const items = readStoredCartItems();
  const nextItems =
    quantity <= 0
      ? items.filter((item) => item.slug !== itemId)
      : items.map((item) => (item.slug === itemId ? { ...item, quantity } : item));

  writeStoredCartItems(nextItems);
  const normalizedItems = normalizeItems(nextItems);
  if (canBuildCartFromSnapshots(normalizedItems)) {
    return buildCartFromSnapshots(normalizedItems);
  }
  return buildCartFromCookie();
}

export async function removeSessionCartItem(itemId: string) {
  const items = readStoredCartItems().filter((item) => item.slug !== itemId);
  writeStoredCartItems(items);
  const normalizedItems = normalizeItems(items);
  if (canBuildCartFromSnapshots(normalizedItems)) {
    return buildCartFromSnapshots(normalizedItems);
  }
  return buildCartFromCookie();
}

export function clearSessionCart() {
  clearCookie(CART_COOKIE_KEY);
  notifySessionCartUpdated();
}

export async function resolveSessionCartOrderItems(cart: CartView) {
  const productIds = await resolveProductIdsBySlugs(cart.items.map((item) => item.slug));

  return cart.items
    .map((item) => {
      const productId = productIds.get(item.slug);

      if (!productId) {
        return null;
      }

      return {
        productId,
        quantity: item.qty,
      };
    })
    .filter((item): item is { productId: string; quantity: number } => Boolean(item));
}
