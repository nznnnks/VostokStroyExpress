import { defineMiddleware } from "astro:middleware";

import { buildApiUrl } from "./lib/api-client";
import { AUTH_TOKEN_COOKIE_KEY, AUTH_TYPE_COOKIE_KEY } from "./lib/auth";

const ADMIN_ROUTE_PREFIX = "/admin";
const CHECKOUT_ROUTE_PREFIX = "/checkout";

async function verifyAccess(path: string, accessToken: string) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;
  const requestedPath = `${pathname}${search}`;
  const accessToken = context.cookies.get(AUTH_TOKEN_COOKIE_KEY)?.value;
  const authType = context.cookies.get(AUTH_TYPE_COOKIE_KEY)?.value;
  const isQuickCheckout = pathname === CHECKOUT_ROUTE_PREFIX && context.url.searchParams.has("product");

  if (pathname === CHECKOUT_ROUTE_PREFIX || pathname.startsWith(`${CHECKOUT_ROUTE_PREFIX}/`)) {
    if (isQuickCheckout) {
      return next();
    }

    if (!accessToken || authType !== "user") {
      return context.redirect(`/login?next=${encodeURIComponent(requestedPath)}`);
    }

    try {
      if (await verifyAccess("/api/users/me", accessToken)) {
        return next();
      }
    } catch {
      return context.redirect(`/login?next=${encodeURIComponent(requestedPath)}`);
    }

    return context.redirect(`/login?next=${encodeURIComponent(requestedPath)}`);
  }

  if (!(pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`))) {
    return next();
  }

  if (!accessToken || authType !== "admin") {
    return context.redirect(`/login?next=${encodeURIComponent(requestedPath)}`);
  }

  try {
    if (await verifyAccess("/api/auth/admin/me", accessToken)) {
      return next();
    }
  } catch {
    return context.redirect("/login");
  }

  return context.redirect(authType === "user" ? "/account" : "/login");
});
