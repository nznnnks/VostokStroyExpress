import { useState, type FormEvent } from "react";

import { loginUser } from "../lib/auth";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await loginUser(email, password);
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/") ? next : null;

      window.location.href = session.type === "admin" ? "/admin" : safeNext || "/account";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Не удалось выполнить вход.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] [font-family:DM_Sans,Manrope,'Liberation_Sans',sans-serif]">
      <div className="flex-1">
        <SiteHeader />

        <section className="border-b border-[#ece8e1]">
          <div className="grid min-h-[calc(100svh-90px)] overflow-hidden xl:min-h-[calc(100svh-112px)] xl:grid-cols-[1.4fr_1fr]">
            <div className="hidden items-center justify-center border-r border-[#ece8e1] bg-[#efefec] p-6 xl:flex">
              <img
                src="/login/login-photo.png"
                alt="Промышленная система"
                width="1600"
                height="2100"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="max-h-full w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex items-start px-5 py-7 sm:px-8 md:px-12 md:py-9 xl:items-center xl:px-16 xl:py-8">
              <div className="mx-auto w-full max-w-[560px]">
                <p className="breadcrumb-nav uppercase tracking-[1.5px] text-[#7a7a75] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <a href="/" className="hover:text-[#111]">Главная</a>
                  <span className="mx-2 text-[#b5b2ab]">/</span>
                  <span>Вход</span>
                </p>
                <h1 className="mt-4 text-[clamp(1.9rem,4.2vw,3.6rem)] leading-[1.05] [font-family:'Cormorant_Garamond',serif]">Вход</h1>
                <div className="mt-3 h-px w-[58px] bg-[#d3b46a]" />

                <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                      Электронная почта
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="example@aura.com"
                      className="mt-3 h-12 w-full border-b border-[#d9d4cc] bg-transparent text-[clamp(1rem,1.25vw,1.25rem)] text-[#6d6d67] outline-none placeholder:text-[#c9c9c4]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-[clamp(0.8rem,0.7vw,1rem)] uppercase tracking-[2px] text-[#7d7d78] [font-family:Jaldi,'JetBrains_Mono',monospace]">Пароль</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="mt-3 h-12 w-full border-b border-[#d9d4cc] bg-transparent text-[clamp(1rem,1.25vw,1.25rem)] text-[#6d6d67] outline-none placeholder:text-[#c9c9c4]"
                      required
                    />
                  </label>

                  {error ? <p className="text-[clamp(0.85rem,0.8vw,0.95rem)] leading-7 text-[#b24c47]">{error}</p> : null}

                  <button
                    disabled={loading}
                    className="inline-flex h-[52px] w-full items-center justify-center gap-6 bg-[#111] px-10 text-[clamp(0.9rem,1.2vw,1.05rem)] uppercase tracking-[2.4px] text-white [font-family:Jaldi,'JetBrains_Mono',monospace]"
                  >
                    <span>{loading ? "вход..." : "войти"}</span>
                    <img
                      src="/login/arrow.svg"
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

                <div className="mt-7 flex items-center gap-4 text-[clamp(0.68rem,0.6vw,0.85rem)] uppercase tracking-[2px] text-[#9a9993] [font-family:Jaldi,'JetBrains_Mono',monospace]">
                  <span className="h-px flex-1 bg-[#e1ddd5]" />
                  <span>Precise Control</span>
                  <span className="h-px flex-1 bg-[#e1ddd5]" />
                </div>

                <p className="mt-3 text-center text-[clamp(0.9rem,1vw,1.05rem)] text-[#7d7d78]">
                  Нет аккаунта?{" "}
                  <a href="/register" className="border-b border-[#d3b46a] font-semibold text-[#111]">
                    Зарегистрироваться
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

export default LoginPage;
