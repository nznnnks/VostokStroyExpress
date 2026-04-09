import { useState, type FormEvent } from "react";

import { loginAdmin, loginUser } from "../lib/auth";

export function LoginPage() {
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "admin") {
        await loginAdmin(email, password);
        window.location.href = "/admin";
        return;
      }

      await loginUser(email, password);
      window.location.href = "/account";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Не удалось выполнить вход.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <header className="border-b border-[#ece8e1] px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1580px] items-center gap-4">
          <a href="/" className="text-[28px] italic tracking-[-0.03em] text-[#050505] [font-family:'Cormorant_Garamond',serif]">
            Р’РѕСЃС‚РѕРєРЎС‚СЂРѕР№Р­РєСЃРїРµСЂС‚
          </a>
          <nav className="ml-auto hidden items-center gap-10 text-[14px] uppercase tracking-[1.5px] text-[#6d6d67] md:flex [font-family:Jaldi,'JetBrains_Mono',monospace]">
            <a href="/">РіР»Р°РІРЅР°СЏ</a>
            <a href="/about">Рѕ РЅР°СЃ</a>
            <a href="/services">СѓСЃР»СѓРіРё</a>
            <a href="/news">РїСЂРѕРµРєС‚С‹</a>
            <a href="/catalog">РєР°С‚Р°Р»РѕРі</a>
            <a href="/news">Р±Р»РѕРі</a>
          </nav>
          <div className="flex items-center gap-4">
            <img src="/image/Р»СѓРїР°.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
            <img src="/image/cart.png" alt="" aria-hidden="true" width="18" height="18" className="h-[18px] w-[18px]" />
          </div>
        </div>
      </header>

      <section className="border-b border-[#ece8e1]">
        <div className="grid xl:grid-cols-[1.8fr_1fr]">
          <div className="border-r border-[#ece8e1]">
            <img
              src="/РІС…РѕРґ/С„РѕС‚Рѕ СЃ РІС…РѕРґР°.png"
              alt="РџСЂРѕРјС‹С€Р»РµРЅРЅР°СЏ СЃРёСЃС‚РµРјР°"
              width="1600"
              height="2100"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-full min-h-[560px] w-full object-cover"
            />
          </div>

          <div className="flex items-center px-6 py-16 md:px-12 xl:px-20">
            <div className="mx-auto w-full max-w-[480px]">
              <h1 className="text-[48px] leading-none md:text-[70px] [font-family:'Cormorant_Garamond',serif]">Р’С…РѕРґ РІ СЃРёСЃС‚РµРјСѓ</h1>
              <p className="mt-6 max-w-[460px] text-[18px] leading-[1.55] text-[#7d7d78] md:text-[22px]">
                Используйте существующий backend login для пользовательской или административной роли.
              </p>

              <div className="mt-10 flex gap-3">
                {(["user", "admin"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`inline-flex h-12 items-center justify-center px-6 text-[14px] uppercase tracking-[2px] [font-family:Jaldi,'JetBrains_Mono',monospace] ${
                      mode === item ? "bg-[#111] text-white" : "border border-[#d9d4cc] text-[#6f6f69]"
                    }`}
                  >
                    {item === "user" ? "client" : "admin"}
                  </button>
                ))}
              </div>

              <form className="mt-16 space-y-10" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-[16px] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Р­Р»РµРєС‚СЂРѕРЅРЅР°СЏ РїРѕС‡С‚Р°
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="mt-8 h-16 w-full border-b border-[#d9d4cc] bg-transparent text-[24px] text-[#111] outline-none placeholder:text-[#d4d3ce]"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-[16px] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                    Пароль
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="mt-8 h-16 w-full border-b border-[#d9d4cc] bg-transparent text-[24px] text-[#111] outline-none placeholder:text-[#d4d3ce]"
                    required
                  />
                </label>

                {error ? <p className="text-[15px] leading-7 text-[#b24c47]">{error}</p> : null}

                <button disabled={loading} className="inline-flex h-20 w-full items-center justify-between bg-[#111] px-10 text-[20px] uppercase tracking-[4px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <span>{loading ? "вход..." : "войти"}</span>
                  <img
                    src="/РІС…РѕРґ/СЃС‚СЂРµР»РѕС‡РєР°.svg"
                    alt=""
                    aria-hidden="true"
                    width="18"
                    height="18"
                    loading="lazy"
                    decoding="async"
                    className="h-[18px] w-[18px] object-contain"
                  />
                </button>
              </form>

              <p className="mt-12 max-w-[470px] text-[15px] leading-[1.65] text-[#7d7d78] md:text-[18px]">
                Регистрация и вход по коду пока не переведены на backend, потому что соответствующих endpoints в текущем API нет.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
