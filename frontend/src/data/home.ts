export const heroStats = [
  {
    value: "100+",
    mobileLines: ["реализовано", "проектов"],
    desktopLabel: "реализованных проектов",
  },
  {
    value: "10+",
    mobileLines: ["лет", "практики"],
    desktopLabel: "лет на рынке инженерных решений",
  },
  {
    value: "проверено",
    mobileLines: ["на объектах", "высокого класса"],
    desktopLabel: "на объектах высокого класса и в коммерческих пространствах",
  },
] as const;

export const trustHighlights = [
  { value: "25", lines: ["лет на", "российском рынке"] },
  { value: "100+", lines: ["реализованных", "проектов"] },
  { value: "10+", lines: ["лет инженерной", "практики"] },
  { value: "62+", lines: ["брендов в", "ассортименте"] },
] as const;

export const trustLogoTopRow = [
  { path: "/image/clear_logo/burger-king.png", alt: "Burger King" },
  { path: "/image/clear_logo/KFC.png", alt: "KFC" },
  { path: "/image/clear_logo/papa-johns.png", alt: "Papa Johns" },
  { path: "/image/clear_logo/vanwok.png", alt: "Vanwok" },
] as const;

export const trustLogoBottomRow = [
  { path: "/image/clear_logo/kabuki.png", alt: "Kabuki" },
  { path: "/image/clear_logo/bowl-room.png", alt: "Bowl Room" },
  { path: "/image/clear_logo/tehnikum.png", alt: "Tehnikum" },
] as const;

export const trustLogoDesktopTopRow = [
  { path: "/image/clear_logo/artest.png", alt: "Artest" },
  { path: "/image/clear_logo/white-rabbit.png", alt: "White Rabbit" },
  { path: "/image/clear_logo/tehnikum.png", alt: "Tehnikum" },
  { path: "/image/clear_logo/restaurant-central-house-of-writers.png", alt: "Central House of Writers" },
  { path: "/image/clear_logo/regent.png", alt: "Regent" },
  { path: "/image/clear_logo/ugolek.png", alt: "Ugolek" },
  { path: "/image/clear_logo/co-co-chalet.png", alt: "Co-Co Chalet" },
] as const;

export const trustLogoDesktopBottomRow = [
  { path: "/image/clear_logo/burger-king.png", alt: "Burger King" },
  { path: "/image/clear_logo/KFC.png", alt: "KFC" },
  { path: "/image/clear_logo/bowl-room.png", alt: "Bowl Room" },
  { path: "/image/clear_logo/papa-johns.png", alt: "Papa Johns" },
  { path: "/image/clear_logo/kabuki.png", alt: "Kabuki" },
  { path: "/image/clear_logo/vanwok.png", alt: "Vanwok" },
] as const;

export const services = [
  {
    poster: "/image/services-preview-2026.png",
    video: "/video/about-trust.mp4",
    title: "Тепловой контроль",
    text: "Настраиваем стабильную температуру и корректную работу систем в резиденциях, бутиках и инженерно сложных интерьерах.",
    accentClassName: "bg-[#9fd6f0]",
  },
  {
    poster: "/image/services-preview-2026.png",
    video: "/video/about-trust.mp4",
    title: "Очистка воздуха",
    text: "Подбираем фильтрацию, влажность и воздухообмен так, чтобы система работала незаметно и ощущалась как комфорт.",
    accentClassName: "bg-[#ecd693]",
  },
  {
    poster: "/image/services-preview-2026.png",
    video: "/video/about-trust.mp4",
    title: "Акустическая настройка",
    text: "Снижаем шум, убираем лишние вибрации и интегрируем оборудование без конфликта с архитектурой пространства.",
    accentClassName: "bg-[#ead79d]",
  },
] as const;

export const serviceHrefByTitle: Record<string, string> = {
  "Тепловой контроль": "/services/thermal-control",
  "Очистка воздуха": "/services/air-cleaning",
  "Акустическая настройка": "/services/acoustic-tuning",
};

export const steps = [
  ["/image/steps-1.png", "Диагностика", "Изучаем объект, ограничения и режим эксплуатации, чтобы не перегружать проект лишними решениями."],
  ["/image/steps-2.png", "Моделирование", "Собираем инженерную схему, считаем нагрузки и согласовываем логику системы."],
  ["/image/steps-3.png", "Интеграция", "Встраиваем оборудование в архитектуру, интерьер и существующие инженерные сети."],
  ["/image/steps-4.png", "Запуск", "Проводим настройку, тестирование и передаём систему в эксплуатацию с понятным сопровождением."],
] as const;

export const blog = [
  {
    image: "/image/news-1.png",
    title: "Почему инженерия должна быть частью тихого интерьера",
    text: "Разбираем, как оборудование высокого класса интегрируется в пространство без визуального и акустического давления.",
    wide: true,
    publishedLabel: "3 дня назад",
  },
  {
    image: "/image/news-2.png",
    title: "Сервис и контроль системы после запуска",
    text: "Что важно предусмотреть заранее, чтобы климатическая система не требовала постоянного внимания.",
    publishedLabel: "3 дня назад",
  },
  {
    image: "/image/news-3.png",
    title: "Что нужно знать про VRF-решения",
    text: "Коротко о сценариях применения и тонкостях подбора для объектов разного масштаба.",
    publishedLabel: "3 дня назад",
  },
  {
    image: "/image/news-4.png",
    title: "Надёжность как главный критерий премиальной инженерии",
    text: "Почему стабильная работа системы важнее перегруженного набора характеристик в спецификации.",
    publishedLabel: "3 дня назад",
  },
] as const;

export const reviews = [
  {
    rating: 5,
    text: "Инженерную систему для бутика собрали очень аккуратно: воздух ровный, техника не шумит, архитектура пространства не пострадала. Получили именно премиальное ощущение, а не набор оборудования.",
    company: 'ООО "Архитект Дизайн"',
    meta: "частный интерьерный проект",
  },
  {
    rating: 5,
    text: "Процесс был понятный от первой диагностики до запуска. Команда взяла на себя согласование, настройку и проверку режимов, поэтому объект вошёл в эксплуатацию без нервов и переделок.",
    company: 'ООО "Ритейл-Плюс"',
    meta: "коммерческий объект",
  },
  {
    rating: 5,
    text: "Для ресторана критично было убрать лишний шум и сохранить стабильный климат в зале и на кухне. Система работает спокойно, персонал не отвлекается, а гости это просто не замечают.",
    company: 'ООО "Гастро Групп"',
    meta: "ресторанный проект",
  },
  {
    rating: 5,
    text: "Понравилось, что инженерию не навязывали, а подстраивали под архитектуру. Все решения объясняли по-человечески, а после запуска оставили понятное сопровождение и контрольные точки.",
    company: 'ООО "Премиум Девелопмент"',
    meta: "объект высокого класса",
  },
  {
    rating: 5,
    text: "После запуска не осталось ощущения, что систему нужно постоянно контролировать. Температура стабильная, сервис реагирует быстро, а само решение работает спокойно и предсказуемо.",
    company: 'ООО "Городская Среда"',
    meta: "проект mixed-use формата",
  },
  {
    rating: 5,
    text: "Для нас было важно, чтобы инженерию встроили деликатно и без визуального шума. Команда аккуратно прошла все этапы, а объект сдали без лишних согласований и доработок.",
    company: 'ООО "Статус Концепт"',
    meta: "приватный объект",
  },
] as const;

export function formatPhone(raw: string) {
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
}
