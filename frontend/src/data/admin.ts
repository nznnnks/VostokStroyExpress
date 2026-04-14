export type AdminNavItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

export const adminNav: AdminNavItem[] = [
  { key: "dashboard", label: "Дашборд", href: "/admin", icon: "/admin/dashboard.svg" },
  { key: "requests", label: "Заявки", href: "/admin/requests", icon: "/admin/requests-projects.svg", badge: "1" },
  { key: "orders", label: "Заказы", href: "/admin/orders", icon: "/admin/orders.svg", badge: "2" },
  { key: "clients", label: "Клиенты", href: "/admin/clients", icon: "/admin/client-news-catalog.svg" },
  { key: "news", label: "Новости", href: "/admin/news", icon: "/admin/client-news-catalog.svg" },
  { key: "catalog", label: "Каталог", href: "/admin/catalog", icon: "/admin/client-news-catalog.svg" },
  { key: "settings", label: "Настройки", href: "/admin/settings", icon: "/admin/settings.svg" },
];

export const adminUser = {
  name: "Александр В.",
  avatar: "/admin/profile.png",
};

export const adminRequests = [
  {
    id: "REQ-1023",
    client: "Nordic Museum",
    service: "Акустическая настройка",
    budget: "1 250 000 ₽",
    status: "Новая",
    date: "07.04.2026",
  },
  {
    id: "REQ-1021",
    client: "Skyline Residences",
    service: "Тепловой контроль",
    budget: "980 000 ₽",
    status: "В работе",
    date: "05.04.2026",
  },
  {
    id: "REQ-1018",
    client: "Central House",
    service: "Очистка воздуха",
    budget: "640 000 ₽",
    status: "Коммерческое",
    date: "02.04.2026",
  },
];
export const adminOrders = [
  {
    id: "AE-7729-01",
    client: "Архитектурное бюро A1",
    items: "Monolith V2, 2 позиции",
    amount: "284 500 ₽",
    status: "Оплата ожидается",
    date: "06.04.2026",
  },
  {
    id: "AE-8114-04",
    client: "Green Valley Office",
    items: "Aerіs Glass Control",
    amount: "18 900 ₽",
    status: "Сборка",
    date: "03.04.2026",
  },
  {
    id: "AE-9002-12",
    client: "Industrial Park Beta",
    items: "Omni-Flow X1",
    amount: "245 900 ₽",
    status: "Доставка",
    date: "31.03.2026",
  },
];

export const adminClients = [
  {
    name: "Nordic Heavy",
    segment: "Коммерческие объекты",
    manager: "Кирилл М.",
    orders: "12",
    status: "Активен",
  },
  {
    name: "Aeris Pro",
    segment: "Частные резиденции",
    manager: "Алина К.",
    orders: "7",
    status: "Активен",
  },
  {
    name: "Regent",
    segment: "HoReCa",
    manager: "Олег С.",
    orders: "4",
    status: "На паузе",
  },
];

export const adminNews = [
  {
    title: "Инженерия как часть тишины",
    category: "Интеграция",
    date: "01.04.2026",
    status: "Опубликовано",
  },
  {
    title: "Сервис после запуска",
    category: "Эксплуатация",
    date: "26.03.2026",
    status: "Черновик",
  },
  {
    title: "Надёжность премиальной инженерии",
    category: "Подход",
    date: "18.03.2026",
    status: "Опубликовано",
  },
];

export const adminCatalog = [
  {
    title: "Omni-Flow X1",
    brand: "Aeris Industrial",
    price: "245 900 ₽",
    stock: "В наличии",
  },
  {
    title: "Titan Core V3",
    brand: "Nordic Heavy",
    price: "412 000 ₽",
    stock: "Под заказ",
  },
  {
    title: "Matrix 7",
    brand: "Aeris Pro",
    price: "118 500 ₽",
    stock: "В наличии",
  },
];
