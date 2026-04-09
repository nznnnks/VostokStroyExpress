import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { newsPosts as fallbackNewsPosts } from "../data/site";
import type { NewsPostView } from "../lib/backend-api";

type NewsPageProps = {
  posts?: NewsPostView[];
};

function getFallbackNews() {
  return fallbackNewsPosts.map((post) => ({
    id: post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    image: post.image,
    category: post.category,
    content: [...post.content],
    dateLabel: "—",
    status: "Опубликовано",
  }));
}

export function NewsPage({ posts = getFallbackNews() }: NewsPageProps) {
  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <SiteHeader />
      <section className="px-4 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">Новости / блог</p>
          <h1 className="mt-8 max-w-[900px] text-[56px] leading-[0.92] md:text-[92px] [font-family:'Cormorant_Garamond',serif]">
            Новостной блок и заметки по инженерной интеграции
          </h1>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <article key={post.slug} className="border border-[#e8e3db] bg-white">
                <img src={post.image} alt="" aria-hidden="true" width="1200" height="760" className="aspect-[16/10] w-full object-cover" />
                <div className="p-6">
                  <p className="text-[13px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">{post.category}</p>
                  <h2 className="mt-3 text-[40px] leading-[1.02] [font-family:'Cormorant_Garamond',serif]">{post.title}</h2>
                  <p className="mt-4 text-[17px] leading-7 text-[#5f5f5a]">{post.excerpt}</p>
                  <a href={`/news/${post.slug}`} className="mt-6 inline-flex text-[14px] uppercase tracking-[1.5px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Читать новость
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

export default NewsPage;
