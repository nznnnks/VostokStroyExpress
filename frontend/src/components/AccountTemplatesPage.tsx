import { useEffect, useState } from "react";

import { ApiError } from "../lib/api-client";
import { loadAccountSnapshot, type AccountProfileView, type OrderTemplateView } from "../lib/backend-api";

const navItems = [
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/РґР°РЅРЅС‹РµРєР»РёРµРЅС‚Р°.png", "Р”Р°РЅРЅС‹Рµ РєР»РёРµРЅС‚Р°", "/account", false],
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/Р·Р°РєР°Р·С‹.svg", "Р—Р°РєР°Р·С‹", "/account/orders", false],
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/С‚СЂР°РЅР·Р°РєС†РёРё.png", "РЁР°Р±Р»РѕРЅС‹ Р·Р°РєР°Р·Р°", "/account/templates", true],
  ["/Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚/РїРѕРґРґРµСЂР¶РєР°.svg", "РџРѕРґРґРµСЂР¶РєР°", "/account#support", false],
];

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 border border-[#ece8e1] bg-white px-8 py-10">
      <h2 className="text-[30px] [font-family:'Cormorant_Garamond',serif]">{title}</h2>
      <p className="mt-4 text-[18px] leading-8 text-[#6f6f69]">{description}</p>
    </div>
  );
}

export function AccountTemplatesPage() {
  const [profile, setProfile] = useState<AccountProfileView | null>(null);
  const [templates, setTemplates] = useState<OrderTemplateView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const data = await loadAccountSnapshot();

        if (!active) {
          return;
        }

        setProfile(data.profile);
        setTemplates(data.templates);
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error("Не удалось загрузить шаблоны."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

  const authRequired = error instanceof ApiError && error.status === 401;

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">Р’РѕСЃС‚РѕРєРЎС‚СЂРѕР№Р­РєСЃРїРµСЂС‚</a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">РіР»Р°РІРЅР°СЏ</a><a href="/about">Рѕ РЅР°СЃ</a><a href="/services">СѓСЃР»СѓРіРё</a><a href="/news">РїСЂРѕРµРєС‚С‹</a><a href="/catalog">РєР°С‚Р°Р»РѕРі</a><a href="/news">Р±Р»РѕРі</a>
          </nav>
          <div className="flex items-center gap-6 text-[14px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <img src="/image/Р»СѓРїР°.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <span>{profile?.name ?? "Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚"}</span>
          </div>
        </div>
      </header>
      <section className="grid xl:grid-cols-[360px_1fr]">
        <aside className="border-r border-[#ece8e1] bg-[#fcfbf8] px-5 py-16 md:px-8">
          <div className="border border-[#ece8e1] bg-white p-8">
            <h2 className="text-[26px] [font-family:'Cormorant_Garamond',serif]">Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚</h2>
            <p className="mt-4 text-[14px] uppercase tracking-[4px] text-[#8b8b86] [font-family:Jaldi,'JetBrains_Mono',monospace]">РІРѕСЃС‚РѕРєСЃС‚СЂРѕР№СЌРєСЃРїРµСЂС‚ business</p>
          </div>
          <nav className="mt-10 space-y-2">
            {navItems.map(([icon, label, href, active]) => (
              <a key={label as string} href={href as string} className={`flex min-h-[74px] items-center gap-4 px-6 text-[18px] ${active ? "bg-[#f5f3ef]" : "bg-transparent"}`}>
                <img src={icon as string} alt="" aria-hidden="true" width="24" height="24" className="h-6 w-6 object-contain" />
                <span className="[font-family:'Cormorant_Garamond',serif] text-[18px]">{label}</span>
              </a>
            ))}
          </nav>
        </aside>
        <div className="px-4 py-12 md:px-10 xl:px-16 xl:py-20">
          <div className="mx-auto max-w-[1200px]">
            <h1 className="text-[52px] leading-none md:text-[80px] [font-family:'Cormorant_Garamond',serif]">РЁР°Р±Р»РѕРЅС‹ Р·Р°РєР°Р·Р°</h1>

            {loading ? <StateMessage title="Загрузка" description="Загружаю сохранённые шаблоны заказа." /> : null}
            {!loading && authRequired ? <StateMessage title="Нужен вход" description="Для просмотра шаблонов войдите под пользовательской учетной записью." /> : null}
            {!loading && error && !authRequired ? <StateMessage title="Ошибка загрузки" description={error.message || "Не удалось загрузить шаблоны."} /> : null}

            {!loading && !error ? (
              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                {templates.map((template) => (
                  <article key={template.id} className="border border-[#ece8e1] bg-white p-10">
                    <h2 className="text-[34px] [font-family:'Cormorant_Garamond',serif]">{template.title}</h2>
                    <div className="mt-8 space-y-4 text-[17px] text-[#6f6f69]">
                      <p><span className="text-[#8b8b86]">РљРѕРЅС‚Р°РєС‚:</span> {template.contact}</p>
                      <p><span className="text-[#8b8b86]">РўРµР»РµС„РѕРЅ:</span> {template.phone}</p>
                      <p><span className="text-[#8b8b86]">РђРґСЂРµСЃ:</span> {template.address}</p>
                      <p><span className="text-[#8b8b86]">РљРѕРјРјРµРЅС‚Р°СЂРёР№:</span> {template.comment}</p>
                    </div>
                    <div className="mt-8 flex gap-3">
                      {template.isDefault ? (
                        <span className="inline-flex h-12 items-center justify-center bg-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ</span>
                      ) : (
                        <span className="inline-flex h-12 items-center justify-center border border-[#111] px-6 text-[14px] uppercase tracking-[1.4px] text-[#111] [font-family:Jaldi,'JetBrains_Mono',monospace]">СЃРѕС…СЂР°РЅРµРЅРЅС‹Р№ С€Р°Р±Р»РѕРЅ</span>
                      )}
                    </div>
                  </article>
                ))}
                {templates.length === 0 ? <div className="text-[18px] text-[#6f6f69]">Сохранённых шаблонов пока нет.</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AccountTemplatesPage;
