import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { createRequest } from "../lib/backend-api";

const contactOptions = ["Telegram", "MAX", "WhatsApp"] as const;

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits === "7" || digits === "8") return "+7";
  let normalized = digits;
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (normalized.startsWith("7")) normalized = normalized.slice(1);
  const slice = normalized.slice(0, 10);
  if (!slice) return "";
  let result = "+7";
  if (slice.length > 0) result += ` (${slice.slice(0, 3)}`;
  if (slice.length > 3) result += ")";
  if (slice.length > 3) result += ` ${slice.slice(3, 6)}`;
  if (slice.length > 6) result += `-${slice.slice(6, 8)}`;
  if (slice.length > 8) result += `-${slice.slice(8, 10)}`;
  return result;
};

type ServiceOrderModalProps = {
  serviceTitle: string;
  triggerLabel?: string;
  triggerClassName?: string;
  trigger?: ReactNode;
};

export function ServiceOrderModal({
  serviceTitle,
  triggerLabel = "Заказать услугу",
  triggerClassName,
  trigger,
}: ServiceOrderModalProps) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const resetAndClose = () => {
    setIsOpen(false);
    setError("");
    setSent(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validPhone = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(phone);
    if (!name.trim()) {
      setError("Укажите имя.");
      return;
    }
    if (!validPhone) {
      setError("Введите телефон в формате +7 (777) 777-77-77.");
      return;
    }
    if (contacts.length === 0) {
      setError("Выберите удобный способ связи.");
      return;
    }

    try {
      await createRequest({
        name: name.trim(),
        phone,
        contactMethods: contacts as Array<"Telegram" | "MAX" | "WhatsApp">,
      });
      setError("");
      setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ??
          "inline-flex h-12 items-center justify-center bg-[#111] px-6 text-[13px] uppercase tracking-[1.2px] text-white md:h-14 md:px-8 md:text-[14px] md:tracking-[1.5px] [font-family:Jaldi,'JetBrains_Mono',monospace]"
        }
      >
        {trigger ?? triggerLabel}
      </button>

      {isOpen && mounted ? createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 px-3 py-3 sm:items-center sm:px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetAndClose();
          }}
        >
          <div className="relative w-full max-w-[560px] overflow-hidden rounded-[22px] bg-[#e1ddd6] text-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              aria-label="Закрыть"
              onClick={resetAndClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[#111]/15 text-[26px] leading-none text-[#111] transition hover:bg-[#111] hover:text-white"
            >
              ×
            </button>

            <form onSubmit={handleSubmit} className="grid gap-5 px-5 py-6 sm:px-8 sm:py-8">
              <div className="pr-10">
                <p className="text-[11px] uppercase tracking-[1.5px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">
                  {serviceTitle}
                </p>
                <h2 id={titleId} className="mt-2 text-[clamp(2rem,8vw,3.4rem)] leading-[0.94] [font-family:'Cormorant_Garamond',serif]">
                  Заказать услугу
                </h2>
              </div>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Имя</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  className="h-14 border border-[#cfcac1] bg-[#f6f3ed] px-4 text-[18px] text-[#111] outline-none transition focus:border-[#111]"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Ваше имя"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">Телефон</span>
                <input
                  value={phone}
                  onChange={(event) => {
                    setPhone(formatPhone(event.target.value));
                    setError("");
                  }}
                  className="h-14 border border-[#cfcac1] bg-[#f6f3ed] px-4 text-[18px] text-[#111] outline-none transition focus:border-[#111]"
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+7 (777) 777-77-77"
                />
              </label>

              <fieldset className="grid gap-3">
                <legend className="text-[11px] uppercase tracking-[1.4px] text-[#7a7a75] [font-family:'JetBrains_Mono',monospace]">
                  Как удобнее связаться
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {contactOptions.map((option) => {
                    const checked = contacts.includes(option);
                    return (
                      <label
                        key={option}
                        className={`flex h-12 cursor-pointer items-center gap-3 border px-4 text-[13px] uppercase tracking-[1px] transition [font-family:'JetBrains_Mono',monospace] ${
                          checked ? "border-[#111] bg-[#111] text-white" : "border-[#cfcac1] bg-[#f6f3ed] text-[#111]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#111]"
                          checked={checked}
                          onChange={(event) => {
                            setContacts((prev) =>
                              event.target.checked ? [...prev, option] : prev.filter((item) => item !== option),
                            );
                            setError("");
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {error ? <p className="text-[14px] leading-5 text-[#9a2d2d]">{error}</p> : null}
              {sent ? <p className="text-[14px] leading-5 text-[#4c6a35]">Заявка подготовлена. Мы свяжемся с вами удобным способом.</p> : null}

              <button
                type="submit"
                className="mt-1 inline-flex h-14 items-center justify-center bg-[#111] px-6 text-[13px] uppercase tracking-[1.4px] text-white [font-family:'JetBrains_Mono',monospace]"
              >
                Отправить
              </button>
            </form>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}

export default ServiceOrderModal;
