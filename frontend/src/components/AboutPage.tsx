import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import type { NewsPostView } from "../lib/backend-api";

type AboutPageProps = {
  newsPosts?: NewsPostView[];
};

const aboutHeroStats = [
  { value: "25", lines: ["лет на", "российском рынке"] },
  { value: "100+", lines: ["реализованных", "проектов"] },
  { value: "10+", lines: ["лет инженерной", "практики"] },
  { value: "63+", lines: ["брендов в", "ассортименте"] },
] as const;

const aboutBrandLogoFiles = [
  "Chicha.png",
  "El_Taco.png",
  "Fish.png",
  "KFC.png",
  "The toy.png",
  "artest.png",
  "belgian-beer-cafe.png",
  "bijou.png",
  "botanika.png",
  "bowl-room.png",
  "bruder.png",
  "burger-king.png",
  "chaichana_evroazia.png",
  "chefs-table.png",
  "chestnay_riba.png",
  "christian-2.png",
  "co-co-chalet.png",
  "corner-burgers.png",
  "dyuzhina.png",
  "eli-satsibeli.png",
  "enzo-2.png",
  "erch.png",
  "farshing.png",
  "folk.png",
  "frank-by-basta-2.png",
  "franklins-burger.png",
  "gastormatket_balchug.png",
  "gorilla-by-basta.png",
  "gorynych.png",
  "gruzinskie_kanikuli.png",
  "hamster-2.png",
  "hand-sign.png",
  "hmelburg.png",
  "il_patio.png",
  "kabuki.png",
  "kaspiyka.png",
  "krasota.png",
  "kvartiranti.png",
  "moremania.png",
  "narval.png",
  "nino.png",
  "papa-johns.png",
  "port.png",
  "red-chinese-logo.png",
  "regent.png",
  "restaurant-central-house-of-writers.png",
  "rico-dom.png",
  "rostics.png",
  "sakhalin.png",
  "sbarro.png",
  "sesilia.png",
  "svarnya.png",
  "syrovarnya.png",
  "tanuki1.png",
  "tashir-pizza.png",
  "tehnikum.png",
  "turquoise-circle-logo.png",
  "ugolek.png",
  "urok.png",
  "vanwok.png",
  "vokrug_sveta.png",
  "white-rabbit.png",
  "wilka_lojka.png",
] as const;

const aboutBrandLogos = aboutBrandLogoFiles.map((file) => ({
  path: `/image/clear_logo/${encodeURIComponent(file)}`,
  alt: file.replace(/\.png$/i, "").replace(/[_-]+/g, " "),
}));

const aboutBlog = [
  {
    image: "/image/news-1.png",
    title: "Почему инженерия должна быть частью тихого интерьера",
    text: "Разбираем, как оборудование высокого класса интегрируется в пространство без визуального и акустического давления.",
    wide: true,
    publishedAt: "2026-04-20T11:30:00+03:00",
  },
  {
    image: "/image/news-2.png",
    title: "Сервис и контроль системы после запуска",
    text: "Что важно предусмотреть заранее, чтобы климатическая система не требовала постоянного внимания.",
    publishedAt: "2026-04-20T11:05:00+03:00",
  },
  {
    image: "/image/news-3.png",
    title: "Что нужно знать про VRF-решения",
    text: "Коротко о сценариях применения и тонкостях подбора для объектов разного масштаба.",
    publishedAt: "2026-04-20T10:20:00+03:00",
  },
  {
    image: "/image/news-4.png",
    title: "Надёжность как главный критерий премиальной инженерии",
    text: "Почему стабильная работа системы важнее перегруженного набора характеристик в спецификации.",
    publishedAt: "2026-04-20T09:15:00+03:00",
  },
] as const;

const clampTextStyle = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
  }) as const;

const formatRelativePublication = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "только что";
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? "минуту" : diffMinutes < 5 ? "минуты" : "минут"} назад`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"} назад`;
};

export function AboutPage({ newsPosts: _newsPosts = [] }: AboutPageProps) {
  const aboutBlogTopRow = aboutBlog.slice(0, 2);
  const aboutBlogBottomRow = aboutBlog.slice(2, 4);
  const mobileAboutBlogLead = aboutBlog[0];
  const mobileAboutBlogMiddle = aboutBlog.slice(1, 3);
  const mobileAboutBlogTail = aboutBlog[3];
  const renderAboutBlogCard = (
    article: (typeof aboutBlog)[number],
    isWide: boolean,
    imageClassName: string,
    contentClassName: string,
  ) => (
    <article
      key={article.title}
      className={`group relative flex h-full flex-col overflow-hidden border border-[#ddd6cc] bg-white transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${isWide ? "md:col-span-8" : "md:col-span-4"}`}
    >
      <a href="/news" aria-label={`Открыть новость: ${article.title}`} className="absolute inset-0 z-10" />
      <img
        src={article.image}
        alt=""
        loading="lazy"
        decoding="async"
        width="1200"
        height="760"
        className={`w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025] ${imageClassName}`}
      />
      <div className={`flex h-full flex-col border-t border-[#ddd6cc] bg-[#e1ddd6] px-5 py-4 md:px-6 md:py-5 ${contentClassName}`}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 md:gap-5">
          <h3
            className="max-w-none pr-2 text-[clamp(24px,1.55vw,42px)] font-semibold leading-[0.9] tracking-[-0.03em] text-[#0d0d0b] [font-family:'Cormorant_Garamond',serif]"
            style={clampTextStyle(2)}
          >
            {article.title}
          </h3>
          <span className="shrink-0 pt-1 text-[clamp(12px,0.55vw+10px,17px)] leading-none text-[#9a9891]">
            {formatRelativePublication(article.publishedAt)}
          </span>
        </div>
        <p
          className="mt-4 max-w-[34ch] text-[clamp(15px,0.5vw+13px,21px)] leading-[1.28] text-[#30302c] md:max-w-[52ch]"
          style={clampTextStyle(isWide ? 2 : 3)}
        >
          {article.text}
        </p>
        <div className="mt-auto flex justify-end pt-5">
          <span className="inline-flex h-12 min-w-[144px] items-center justify-center bg-[#1a1a1a] px-8 text-[clamp(12px,0.4vw+10px,14px)] uppercase tracking-[1.2px] text-white [font-family:'JetBrains_Mono',monospace]">
            читать
          </span>
        </div>
      </div>
    </article>
  );
  const renderMobileAboutBlogCard = (article: (typeof aboutBlog)[number], isWide: boolean) => (
    <article
      key={`${article.title}-${isWide ? "wide" : "narrow"}`}
      className={`group relative flex h-full flex-col overflow-hidden border border-[#ddd6cc] bg-white transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${
        isWide ? "" : "min-w-0"
      }`}
    >
      <a href="/news" aria-label={`Открыть новость: ${article.title}`} className="absolute inset-0 z-10" />
      <img
        src={article.image}
        alt=""
        loading="lazy"
        decoding="async"
        width="1200"
        height="760"
        className={`w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025] ${
          isWide ? "aspect-[16/7.7]" : "aspect-[4/3.2]"
        }`}
      />
      <div className={`flex h-full flex-col border-t border-[#ddd6cc] bg-[#e1ddd6] ${isWide ? "px-4 py-3" : "px-3 py-3"}`}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3
            className={`max-w-none pr-2 font-semibold leading-[0.92] tracking-[-0.03em] text-[#0d0d0b] [font-family:'Cormorant_Garamond',serif] ${
              isWide ? "text-[clamp(22px,5.6vw,32px)]" : "text-[clamp(18px,4.6vw,24px)]"
            }`}
            style={clampTextStyle(isWide ? 2 : 3)}
          >
            {article.title}
          </h3>
          <span className="shrink-0 pt-1 text-[12px] leading-none text-[#9a9891]">
            {formatRelativePublication(article.publishedAt)}
          </span>
        </div>
        <div className="mt-4 flex justify-end">
          <span
            className={`inline-flex items-center justify-center bg-[#1a1a1a] text-[11px] uppercase tracking-[1.2px] text-white [font-family:'JetBrains_Mono',monospace] ${
              isWide ? "h-11 min-w-[132px] px-6" : "h-10 min-w-[112px] px-4"
            }`}
          >
            читать
          </span>
        </div>
      </div>
    </article>
  );

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />
        <section className="relative overflow-hidden bg-[#050505] text-white">
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-0 h-full w-screen -translate-x-1/2 overflow-hidden">
              <img
                src="/image/about-trust-mobile.png"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.03] md:hidden"
              />
              <img
                src="/image/hero-desktop-bg.jpeg"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
              />
              <video
                className="absolute inset-0 hidden h-full w-full object-cover md:block"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/image/hero-desktop-bg.jpeg"
              >
                <source src="/video/about-trust.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,15,0.18)_0%,rgba(8,11,16,0.22)_24%,rgba(8,11,16,0.3)_50%,rgba(8,11,16,0.46)_100%)] md:bg-[linear-gradient(180deg,rgba(7,10,15,0.58)_0%,rgba(8,11,16,0.56)_18%,rgba(8,11,16,0.66)_44%,rgba(8,11,16,0.76)_70%,rgba(8,11,16,0.86)_100%)]" />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex min-h-[420px] max-w-[1860px] flex-col justify-between px-3 pb-8 pt-10 sm:px-5 md:min-h-[520px] md:px-10 md:pb-12 md:pt-14 xl:min-h-[680px] xl:px-12 xl:pb-16 xl:pt-16 2xl:px-20">
            <p className="breadcrumb-nav uppercase tracking-[1.5px] text-white/70 [font-family:Jaldi,'JetBrains_Mono',monospace]">
              <a href="/" className="transition hover:text-white">Главная</a>
              <span className="mx-2 text-white/35">/</span>
              <a href="/about" className="transition hover:text-white">О компании</a>
              <span className="mx-2 text-white/35">/</span>
              <span className="tracking-[2.8px]">CLIMATRADE</span>
            </p>
            <p className="text-[clamp(28px,2vw,54px)] font-normal italic leading-none text-white/88 [font-family:'Cormorant_Garamond',serif]">
              О нашей работе и опыте
            </p>
          </div>
        </section>

        <section className="bg-white px-3 py-6 sm:px-5 md:px-10 md:py-8 xl:px-12 xl:py-10 2xl:px-20">
          <div className="mx-auto max-w-[1860px]">
            <div className="grid gap-4 md:gap-5 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-stretch xl:gap-8">
              <div className="flex min-h-[118px] flex-col justify-start rounded-[18px] bg-white px-6 py-6 text-[#12120f] md:min-h-[124px] md:px-8 md:py-6 xl:min-h-[132px] xl:justify-between xl:px-10 xl:py-7">
                <p className="text-[clamp(10px,0.28vw+9px,13px)] uppercase tracking-[0.18em] text-[#7f8ea3] [font-family:'JetBrains_Mono',monospace]">
                  25 лет на российском рынке
                </p>
                <h1 className="mt-8 max-w-[12ch] text-[clamp(32px,8vw,46px)] leading-[0.9] tracking-[-0.035em] [font-family:'Cormorant_Garamond',serif] md:mt-0 md:max-w-[14ch] md:text-[clamp(30px,2.1vw,42px)] md:leading-[0.96] md:tracking-[-0.028em]">
                  ВостокСтройЭксперт
                </h1>
              </div>
              <div className="flex min-h-[116px] items-center rounded-[18px] bg-white px-6 py-6 text-[#12120f] md:min-h-[124px] md:px-8 md:py-6 xl:min-h-[132px] xl:px-14 2xl:px-16">
                <p className="max-w-[61ch] text-[clamp(24px,1.5vw,40px)] leading-[1.14] tracking-[-0.01em] [font-family:'Cormorant_Garamond',serif]">
                  Прецизионный климат-контроль Dantex для элитных резиденций и промышленных объектов высшего класса. Когда тишина становится ощутимой.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-6 2xl:gap-8">
              {aboutHeroStats.map(({ value, lines }) => (
                <article
                  key={value}
                  className="flex min-h-[128px] flex-col justify-between rounded-[18px] border border-[#d7dee8] bg-[linear-gradient(180deg,#5c6576_0%,#474e5d_100%)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] xl:min-h-[176px] xl:px-7 xl:py-6"
                >
                  <strong className="block text-[clamp(2rem,6vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[#eef0f4] xl:text-[clamp(2.45rem,2.4vw,3.7rem)]">
                    {value}
                  </strong>
                  <p className="text-[clamp(13px,1.1vw,18px)] font-semibold leading-[0.98] text-[#d7dae1] xl:text-[clamp(17px,0.72vw+13px,26px)]">
                    <span className="block whitespace-nowrap">{lines[0]}</span>
                    <span className="block whitespace-nowrap">{lines[1]}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-3 pb-8 sm:px-5 md:px-10 md:pb-12 xl:px-12 xl:pb-14 2xl:px-20">
          <div className="mx-auto max-w-[1860px] rounded-[24px] bg-[#fbfaf8] p-4 text-[#12120f] md:p-6 xl:p-8">
            <div className="flex flex-col gap-3 border-b border-[#ece6dd] pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[clamp(12px,0.45vw+10px,17px)] uppercase tracking-[1.5px] text-[#b99863] [font-family:'JetBrains_Mono',monospace]">
                  Более 63 брендов
                </p>
                <h2 className="mt-3 text-[clamp(28px,2.6vw,58px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">
                  Бренды, с которыми мы работали и которые знаем вживую
                </h2>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
              {aboutBrandLogos.map(({ path, alt }) => (
                <article
                  key={path}
                  className="group flex min-h-[122px] items-center justify-center rounded-[18px] border border-[#efebe4] bg-white px-4 py-4 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#dbc7a1] hover:shadow-[0_18px_30px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex h-[clamp(54px,5vw,72px)] w-full items-center justify-center overflow-hidden">
                    <img
                      src={path}
                      alt={alt}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full w-auto max-w-[82%] object-contain object-center transition duration-300 ease-out group-hover:scale-[1.05] group-hover:[filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.08))_contrast(1.04)]"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about-blog" className="bg-white px-3 py-10 sm:px-5 md:px-10 md:py-14 xl:px-12 xl:py-16 2xl:px-20">
          <div className="mx-auto max-w-[1860px]">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-[clamp(32px,3vw,60px)] leading-[0.95] [font-family:'Cormorant_Garamond',serif]">Новостной блог</h2>
              <a href="/news" className="pb-2 text-[clamp(12px,0.45vw+10px,17px)] uppercase tracking-[1.2px] text-[#2f2f2c] [font-family:'JetBrains_Mono',monospace]">Все новости</a>
            </div>
          <div className="mt-12 space-y-6 xl:space-y-8">
            <div className="space-y-4 md:hidden">
              {mobileAboutBlogLead ? renderMobileAboutBlogCard(mobileAboutBlogLead, true) : null}
              <div className="grid grid-cols-2 gap-4">
                {mobileAboutBlogMiddle.map((article) => renderMobileAboutBlogCard(article, false))}
              </div>
              {mobileAboutBlogTail ? renderMobileAboutBlogCard(mobileAboutBlogTail, true) : null}
            </div>

            <div className="hidden gap-6 md:grid lg:grid-cols-12 xl:gap-8">
              {aboutBlogTopRow.map((article, index) =>
                renderAboutBlogCard(
                  article,
                    index === 0,
                    index === 0 ? "aspect-[16/9] md:h-[300px] md:aspect-auto" : "aspect-[4/3] md:h-[300px] md:aspect-auto",
                    "min-h-[180px] md:min-h-[188px]",
                  ),
                )}
              </div>
            <div className="hidden gap-6 md:grid lg:grid-cols-12 xl:gap-8">
              {aboutBlogBottomRow.map((article, index) =>
                renderAboutBlogCard(
                  article,
                    index === 1,
                    index === 1 ? "aspect-[16/9] md:h-[260px] md:aspect-auto" : "aspect-[4/3] md:h-[260px] md:aspect-auto",
                    "min-h-[180px] md:min-h-[188px]",
                  ),
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

export default AboutPage;
