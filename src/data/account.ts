export const customerProfile = {
  name: "Алексей",
  email: "azimut.it.01@gmail.com",
  totalOrders: 3,
  personalDiscount: "7%",
  totalSpent: "142 500 ₽",
};

export const orderTemplates = [
  {
    id: "residence-main",
    title: "Основной адрес резиденции",
    contact: "Алексей В.",
    phone: "+7 985 386-22-22",
    address: "Москва, Калужская, 12",
    comment: "Подъезд через сервисный вход, согласование за 30 минут.",
  },
  {
    id: "office-delivery",
    title: "Офис / приёмка оборудования",
    contact: "Алексей В.",
    phone: "+7 999 200-40-00",
    address: "Москва, Пресненская наб., 10",
    comment: "Доставка только по будням до 18:00.",
  },
];

export const accountOrders = [
  {
    id: "AE-7729-01",
    date: "12.05.2024",
    status: "Ожидает оплаты",
    total: "48 200.00 ₽",
    statusColor: "#f1d212",
    items: [
      { title: "Смарт-консоль Matrix 7", qty: 1, price: "48 200 ₽" },
    ],
    delivery: "Курьером по Москве",
    payment: "Ожидание оплаты",
    address: "Москва, Калужская, 12",
  },
  {
    id: "AE-8114-04",
    date: "08.05.2024",
    status: "У курьера",
    total: "12 400.00 ₽",
    statusColor: "#12a53b",
    items: [
      { title: "Сервисный комплект фильтрации", qty: 1, price: "12 400 ₽" },
    ],
    delivery: "У курьера",
    payment: "Оплачено",
    address: "Москва, Калужская, 12",
  },
  {
    id: "AE-9002-12",
    date: "02.05.2024",
    status: "Доставлен",
    total: "81 900.00 ₽",
    statusColor: "#12a53b",
    items: [
      { title: "Настенная серия Aura", qty: 1, price: "81 900 ₽" },
    ],
    delivery: "Доставлен",
    payment: "Оплачено",
    address: "Москва, Пресненская наб., 10",
  },
  {
    id: "AE-6651-09",
    date: "28.04.2024",
    status: "У курьера",
    total: "22 000.00 ₽",
    statusColor: "#12a53b",
    items: [
      { title: "Выездная настройка системы", qty: 1, price: "22 000 ₽" },
    ],
    delivery: "У курьера",
    payment: "Оплачено",
    address: "Москва, Калужская, 12",
  },
];

