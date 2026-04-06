export type Product = {
  slug: string;
  image: string;
  gallery?: string[];
  brand: string;
  brandLabel: string;
  title: string;
  article: string;
  category: string;
  country: string;
  type: string;
  power: number;
  volume: number;
  price: number;
  rating: string;
  efficiency: string;
  efficiencyClass?: string;
  coverage?: string;
  acoustics?: string;
  filtration?: string;
  description?: string[];
  relatedSlugs?: string[];
};

export const products: Product[] = [
  {
    slug: "omni-flow-x1",
    image: "/каталог/товар2.png",
    brand: "Aeris Pro",
    brandLabel: "AERIS INDUSTRIAL",
    title: "Модульный блок Omni-Flow X1",
    article: "AER-100-OFX1",
    category: "Системы климат-контроля",
    country: "Германия",
    type: "Устройства климат контроля",
    power: 14.5,
    volume: 12,
    price: 245900,
    rating: "Рейтинг: 14.5 кВт",
    efficiency: "Эффективность: SEER 22",
    efficiencyClass: "A++ Business",
    coverage: "До 85 м²",
    acoustics: "23 дБ",
    filtration: "HEPA 13",
    description: [
      "Omni-Flow X1 разработан для встраивания в премиальные интерьеры и серверные зоны, где важны компактность и стабильность.",
      "Модуль позволяет построить гибкую систему управления температурой и воздухообменом без перегрузки пространства визуальными элементами.",
    ],
    relatedSlugs: ["titan-core-v3", "matrix-7", "aura-wall-series", "arctic-flow-geothermal-4"],
  },
  {
    slug: "titan-core-v3",
    image: "/каталог/товар3.png",
    brand: "Nordic Heavy",
    brandLabel: "NORDIC HEAVY",
    title: "Обменник Titan Core V3",
    article: "AER-155-TCV3",
    category: "Системы климат-контроля",
    country: "Швейцария",
    type: "Котлы",
    power: 28,
    volume: 18,
    price: 412000,
    rating: "Рейтинг: 28.0 кВт",
    efficiency: "Эффективность: SEER 18",
    efficiencyClass: "A+ Industrial",
    coverage: "До 130 м²",
    acoustics: "28 дБ",
    filtration: "Carbon HEPA",
    description: [
      "Titan Core V3 создан для объектов с непрерывной нагрузкой и длительными циклами работы.",
      "Система стабильно держит температурный режим в инженерных пространствах и хорошо комбинируется с высокопроизводительными приточными решениями.",
    ],
    relatedSlugs: ["omni-flow-x1", "matrix-7", "vertex-roof-chiller", "arctic-flow-geothermal-4"],
  },
  {
    slug: "matrix-7",
    image: "/каталог/товар1.png",
    brand: "Aeris Pro",
    brandLabel: "AERIS PRO",
    title: "Смарт-консоль Matrix 7",
    article: "AER-210-MX7",
    category: "Системы климат-контроля",
    country: "Япония",
    type: "Другое",
    power: 8.2,
    volume: 7,
    price: 118500,
    rating: "Рейтинг: 8.2 кВт",
    efficiency: "Эффективность: SEER 24",
    efficiencyClass: "A Premium",
    coverage: "До 45 м²",
    acoustics: "18 дБ",
    filtration: "HEPA 12",
    description: [
      "Matrix 7 объединяет управление климатом, сценарием освещения и основными инженерными функциями в одной консоли.",
      "Это хороший выбор для частных резиденций и конференц-зон, где нужен лаконичный интерфейс и быстрый доступ к настройкам.",
    ],
    relatedSlugs: ["omni-flow-x1", "aura-wall-series", "monolith-v2", "titan-core-v3"],
  },
  {
    slug: "vertex-roof-chiller",
    image: "/каталог/товар4.png",
    brand: "Zenith Industrial",
    brandLabel: "ZENITH IND.",
    title: "Крышный чиллер Vertex",
    article: "AER-310-VRTX",
    category: "Системы климат-контроля",
    country: "Германия",
    type: "Котлы",
    power: 45,
    volume: 32,
    price: 890000,
    rating: "Рейтинг: 45.0 кВт",
    efficiency: "Эффективность: SEER 16",
    efficiencyClass: "A+++ Industrial",
    coverage: "До 220 м²",
    acoustics: "31 дБ",
    filtration: "Industrial HEPA",
    description: [
      "Vertex рассчитан на коммерческие и производственные площадки с высокой пиковой нагрузкой.",
      "Решение подходит для объектов, где приоритетом являются надёжность, сервисопригодность и ровный температурный режим в течение суток.",
    ],
    relatedSlugs: ["titan-core-v3", "arctic-flow-geothermal-4", "omni-flow-x1", "matrix-7"],
  },
  {
    slug: "aura-wall-series",
    image: "/каталог/товар5.png",
    brand: "Aeris Pro",
    brandLabel: "AERIS PURE",
    title: "Настенная серия Aura",
    article: "AER-118-AURA",
    category: "Системы климат-контроля",
    country: "Япония",
    type: "Устройства климат контроля",
    power: 5.5,
    volume: 5,
    price: 94200,
    rating: "Рейтинг: 5.5 кВт",
    efficiency: "Эффективность: SEER 26",
    efficiencyClass: "A Residential",
    coverage: "До 35 м²",
    acoustics: "16 дБ",
    filtration: "HEPA 11",
    description: [
      "Aura — настенная серия для тихих приватных помещений, кабинетов и комнат отдыха.",
      "Она хорошо работает там, где нужна спокойная визуальная интеграция и минимальный уровень шума ночью.",
    ],
    relatedSlugs: ["matrix-7", "omni-flow-x1", "monolith-v2", "titan-core-v3"],
  },
  {
    slug: "arctic-flow-geothermal-4",
    image: "/каталог/товар6.png",
    brand: "Nordic Heavy",
    brandLabel: "NORDIC HEAVY",
    title: "Arctic Flow Geothermal 4",
    article: "AER-401-AFG4",
    category: "Системы климат-контроля",
    country: "Швейцария",
    type: "Другое",
    power: 22,
    volume: 20,
    price: 560000,
    rating: "Рейтинг: 22.0 кВт",
    efficiency: "Эффективность: SEER 20",
    efficiencyClass: "A++ Geo",
    coverage: "До 150 м²",
    acoustics: "24 дБ",
    filtration: "HEPA 14 Industrial",
    description: [
      "Geothermal 4 проектировался для энергоэффективных объектов с опорой на геотермальный контур и долгий срок эксплуатации.",
      "Подходит для частных домов и небольших общественных зданий, где важна экономичность и устойчивость системы круглый год.",
    ],
    relatedSlugs: ["vertex-roof-chiller", "titan-core-v3", "omni-flow-x1", "aura-wall-series"],
  },
];

export const featuredProduct: Product = {
  slug: "monolith-v2",
  image: "/страница товара/фото товара главная 1.png",
  gallery: [
    "/страница товара/фото товара главная 1.png",
    "/страница товара/фото товара главная 2.png",
    "/страница товара/фото товара главная 3.png",
    "/страница товара/фото товара главная 4.png",
    "/страница товара/фото товара главная 5.png",
  ],
  brand: "Aeris Precision",
  brandLabel: "AERIS PRECISION",
  title: "Система климат-контроля Monolith V2",
  article: "AER-204-XLT",
  category: "Системы климат-контроля",
  country: "Германия",
  type: "Устройства климат контроля",
  power: 19,
  volume: 14,
  price: 284500,
  rating: "Рейтинг: 19.0 кВт",
  efficiency: "Эффективность: SEER 25",
  efficiencyClass: "A+++ Premium",
  coverage: "До 120 м²",
  acoustics: "19 дБ",
  filtration: "HEPA 14 Industrial",
  description: [
    "Monolith V2 представляет собой смену парадигмы в климатических технологиях. Разработанный для взыскательного взгляда, он устраняет визуальный шум традиционных систем кондиционирования.",
    "Помимо контроля температуры, система служит полноценным очистителем воздуха для всего дома, используя фильтры медицинского класса HEPA 14 для удаления 99,99% взвешенных частиц.",
  ],
  relatedSlugs: ["matrix-7", "omni-flow-x1", "aura-wall-series", "arctic-flow-geothermal-4"],
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

