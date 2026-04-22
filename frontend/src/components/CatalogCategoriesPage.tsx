import { useEffect, useMemo, useRef, useState } from "react";

import type { Product } from "../data/products";
import { slugify } from "../lib/slug";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

type CatalogCategoriesPageProps = {
  products: Product[];
};

type CategoryCard = {
  name: string;
  slug: string;
  count: number;
  image: string;
};

export function CatalogCategoriesPage({ products }: CatalogCategoriesPageProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categories = useMemo<CategoryCard[]>(() => {
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

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const threshold = 2;

    const update = () => {
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      setCanScrollLeft(el.scrollLeft > threshold);
      setCanScrollRight(el.scrollLeft < maxScrollLeft - threshold);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener("resize", update);
    }

    return () => {
      el.removeEventListener("scroll", update);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, [categories.length]);

  function scrollRail(direction: "left" | "right") {
    const el = railRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.82, 320);
    el.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#2b2a27]">
      <SiteHeader fullBleed />

      <main className="mx-auto w-full max-w-[1700px] px-5 pb-14 pt-8 md:px-8 md:pt-10">
        <div>
          <h1 className="text-[42px] leading-[1.05] md:text-[56px] [font-family:'Cormorant_Garamond',serif]">Каталог</h1>
          <p className="mt-4 max-w-[760px] text-[18px] leading-8 text-[#7a7a75]">Выберите категорию и пролистайте ленту вправо, чтобы открыть остальные разделы.</p>
        </div>

        <section className="relative mt-8">
          <div ref={railRef} className="overflow-x-auto overflow-y-hidden pb-4 [scrollbar-width:thin] [scrollbar-color:#d6d0c8_transparent]">
            <div
              className="grid content-start auto-cols-[minmax(230px,72vw)] grid-flow-col grid-rows-2 gap-4 md:auto-cols-[minmax(260px,30vw)] md:gap-6 xl:auto-cols-[minmax(280px,18vw)]"
              style={{
                gridTemplateRows: "repeat(2, minmax(240px, 320px))",
                gridAutoFlow: "column dense",
              }}
            >
              {categories.map((category, index) => (
                <a
                  key={category.slug}
                  href={`/catalog/category/${category.slug}`}
                  className={[
                    "group flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#e7e1d9] bg-white",
                    "transition-shadow hover:shadow-[0_18px_40px_rgba(38,35,31,0.10)]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2a27]/40",
                    getCategorySizeClass(index),
                  ].join(" ")}
                >
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f7f7f9] p-4 md:p-6">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          loading="lazy"
                          className="max-h-full w-auto max-w-[92%] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="h-full w-full rounded-[14px] bg-[#f0efec]" aria-hidden />
                      )}
                    </div>

                    <div className="bg-white px-5 py-5 md:px-6">
                      <h2 className="text-[16px] font-medium leading-[1.25] md:text-[18px] [font-family:Manrope,system-ui]">{category.name}</h2>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {canScrollLeft ? (
            <button
              type="button"
              onClick={() => scrollRail("left")}
              className="absolute left-0 top-1/2 z-10 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[18px] border border-[#e7e1d9] bg-white text-[#2b2a27] shadow-[0_18px_40px_rgba(38,35,31,0.10)] transition-transform hover:translate-y-[-50%] hover:scale-[1.03]"
              aria-label="Прокрутить категории влево"
            >
              <svg className="rotate-180" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}

          {canScrollRight ? (
            <button
              type="button"
              onClick={() => scrollRail("right")}
              className="absolute right-0 top-1/2 z-10 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[18px] border border-[#e7e1d9] bg-white text-[#2b2a27] shadow-[0_18px_40px_rgba(38,35,31,0.10)] transition-transform hover:translate-y-[-50%] hover:scale-[1.03]"
              aria-label="Прокрутить категории вправо"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function getCategorySizeClass(index: number) {
  const pattern = index % 12;

  if (pattern === 0 || pattern === 7) return "row-span-2";
  if (pattern === 3 || pattern === 9) return "col-span-2";
  if (pattern === 5) return "col-span-2 row-span-2";
  return "";
}

export default CatalogCategoriesPage;

