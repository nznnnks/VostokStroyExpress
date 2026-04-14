import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import type { NewsPostView } from "../lib/backend-api";

type NewsPageProps = {
  posts?: NewsPostView[];
};

export function NewsPage({ posts = [] }: NewsPageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />
        <section className="px-4 py-10 md:px-10 md:py-14">
          <div className="mx-auto max-w-[1480px]">
          <p className="text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/" className="hover:text-[#111]">Главная</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <a href="/news" className="hover:text-[#111]">Новости</a>
            <span className="mx-2 text-[#b5b2ab]">/</span>
            <span>Блог</span>
          </p>
          <h1 className="mt-8 max-w-[900px] text-[clamp(2.6rem,5.2vw,5.75rem)] leading-[0.92] [font-family:'Cormorant_Garamond',serif]">
            Новостной блок и заметки по инженерной интеграции
          </h1>
          {posts.length > 0 ? (
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {posts.map((post) => (
                <article key={post.slug} className="border border-[#e8e3db] bg-white">
                  <a href={`/news/${post.slug}`} className="flex h-full flex-col">
                    {post.image ? <img src={post.image} alt="" aria-hidden="true" width="1200" height="760" className="aspect-[16/10] w-full object-cover" /> : null}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-[clamp(0.68rem,0.5vw,0.85rem)] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">{post.category}</p>
                      <h2 className="mt-3 text-[clamp(1.8rem,2.6vw,2.5rem)] leading-[1.02] [font-family:'Cormorant_Garamond',serif]">{post.title}</h2>
                      <p className="mt-4 text-[clamp(0.95rem,1.1vw,1.15rem)] leading-7 text-[#5f5f5a]">{post.excerpt}</p>
                      <span className="mt-auto inline-flex pt-6 text-[clamp(0.75rem,0.6vw,0.95rem)] uppercase tracking-[1.5px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                        Читать новость
                      </span>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 border border-[#e8e3db] bg-white px-8 py-12 text-[20px] text-[#5f5f5a]">
              Новости пока не опубликованы.
            </div>
          )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}

export default NewsPage;
