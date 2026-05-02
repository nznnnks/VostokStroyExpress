import { PrismaClient } from '@prisma/client';

type VentilationServiceSeed = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  heroTitle: string;
  lead: string;
  detailTitle: string;
  bullets: string[];
  deliverables: string[];
  imageUrl: string;
  detailImages: string[];
  basePrice: number;
  durationHours: number;
};

const services: VentilationServiceSeed[] = [
  {
    slug: 'restaurant',
    name: 'Проект вентиляции в ресторане',
    shortDescription:
      'Учитываем кухню и зал, запахи и санитарные требования. Проектируем так, чтобы гостям было комфортно, а персоналу — удобно работать.',
    description:
      'Подбираем и рассчитываем систему приточно-вытяжной вентиляции с учётом теплопритоков, кратности воздухообмена, акустики и норм. Продумываем трассы и размещение оборудования, чтобы сохранить интерьер и обеспечить стабильную работу.',
    heroTitle: 'Проект вентиляции для ресторана — без компромиссов по комфорту',
    lead: 'Расчёт, подбор оборудования и документация под нормы и реальные условия эксплуатации.',
    detailTitle: 'Что входит в услугу',
    bullets: ['Сбор исходных данных', 'Расчёт и подбор оборудования', 'Схемы и спецификации', 'Сопровождение до запуска'],
    deliverables: ['План-схемы и трассировки', 'Спецификация оборудования', 'Рекомендации по монтажу', 'Сметные ориентиры'],
    imageUrl: '/image/restaurant.jpg',
    detailImages: ['/image/restaurant.jpg', '/image/services-card-bg-2026.png'],
    basePrice: 180000,
    durationHours: 24,
  },
  {
    slug: 'country-house',
    name: 'Проект вентиляции в загородном доме',
    shortDescription:
      'Проектируем тихую и эффективную вентиляцию для круглогодичного проживания: приток/вытяжка, рекуперация и увлажнение — по задаче.',
    description:
      'Учитываем планировку, материалы, режимы проживания и сезонность. Прорабатываем трассы так, чтобы не ломать отделку и архитектуру, и закладываем понятную логику обслуживания.',
    heroTitle: 'Вентиляция в доме — тишина, свежесть и энергия под контролем',
    lead: 'Системное решение под ваш дом и сценарии проживания.',
    detailTitle: 'Что входит в услугу',
    bullets: ['Обмеры и ТЗ', 'Расчёт воздухообмена', 'Подбор решения', 'Комплект чертежей'],
    deliverables: ['Планы и узлы', 'Список оборудования', 'Рекомендации по шуму/вибро', 'Пусконаладочные параметры'],
    imageUrl: '/image/house.jpg',
    detailImages: ['/image/house.jpg', '/image/services-card-bg-2026.png'],
    basePrice: 160000,
    durationHours: 20,
  },
  {
    slug: 'apartment',
    name: 'Проект вентиляции в квартире',
    shortDescription:
      'Интегрируем вентиляцию в интерьер без лишних коробов: прорабатываем шахты, трассы и размещение оборудования.',
    description:
      'Делаем стабильный воздухообмен при минимальном уровне шума. Учитываем ограничения по высоте потолка и скрытую прокладку, чтобы всё выглядело аккуратно.',
    heroTitle: 'Вентиляция в квартире — незаметно в интерьере, заметно по качеству воздуха',
    lead: 'Аккуратная интеграция и понятная документация для монтажа.',
    detailTitle: 'Что входит в услугу',
    bullets: ['Планировочное решение', 'Трассы и размещение', 'Подбор оборудования', 'Документация для монтажа'],
    deliverables: ['Планы по помещениям', 'Сечения/узлы', 'Спецификация', 'Рекомендации по эксплуатации'],
    imageUrl: '/image/apartments.jpg',
    detailImages: ['/image/apartments.jpg', '/image/services-card-bg-2026.png'],
    basePrice: 140000,
    durationHours: 16,
  },
  {
    slug: 'warehouse',
    name: 'Проект вентиляции в складском комплексе',
    shortDescription:
      'Считаем воздухообмен под логистику и зоны хранения, учитываем высоты, ворота и теплопотери.',
    description:
      'Подбираем оборудование и режимы, чтобы снизить эксплуатационные затраты. Учитываем сезонные сценарии и требования к безопасности.',
    heroTitle: 'Складская вентиляция — расчёт под процессы и экономику',
    lead: 'Сбалансированная система под ваши зоны и режимы работы.',
    detailTitle: 'Что входит в услугу',
    bullets: ['Зонирование и исходные данные', 'Расчёты и сценарии', 'Подбор оборудования', 'Документация'],
    deliverables: ['Схемы и планы', 'Спецификация', 'Рекомендации по режимам', 'Оценка энергоэффективности'],
    imageUrl: '/image/complex.jpg',
    detailImages: ['/image/complex.jpg', '/image/services-card-bg-2026.png'],
    basePrice: 220000,
    durationHours: 32,
  },
  {
    slug: 'mall',
    name: 'Проект вентиляции в торговом центре',
    shortDescription:
      'Проектируем распределение воздуха по зонам с разной проходимостью и тепловой нагрузкой.',
    description:
      'Продумываем баланс притока/вытяжки и интеграцию с системами кондиционирования и дымоудаления. Учитываем требования арендаторов и общие зоны.',
    heroTitle: 'Вентиляция ТЦ — управление потоками воздуха по зонам',
    lead: 'Решение под большой объект с разными сценариями нагрузки.',
    detailTitle: 'Что входит в услугу',
    bullets: ['Анализ зон и нагрузок', 'Схемы распределения', 'Подбор оборудования', 'Документация и согласования'],
    deliverables: ['Планы и схемы', 'Спецификация', 'Увязка с инженерией', 'Рекомендации по эксплуатации'],
    imageUrl: '/image/mall.jpg',
    detailImages: ['/image/mall.jpg', '/image/services-card-bg-2026.png'],
    basePrice: 260000,
    durationHours: 40,
  },
  {
    slug: 'business-center',
    name: 'Проект вентиляции в бизнес-центре',
    shortDescription:
      'Прорабатываем вентиляцию под офисные зоны, переговорные и общие пространства с учётом плотности людей и режимов работы.',
    description:
      'Считаем нагрузки, обеспечиваем комфорт и соблюдение норм, продумываем обслуживание и доступ к оборудованию.',
    heroTitle: 'Вентиляция бизнес-центра — комфорт для людей и стабильность для эксплуатации',
    lead: 'Документация и подбор решений под офисные сценарии.',
    detailTitle: 'Что входит в услугу',
    bullets: ['Сбор исходных данных', 'Расчёты по зонам', 'Подбор оборудования', 'Проектная документация'],
    deliverables: ['Планы и схемы', 'Спецификация', 'Рекомендации по шуму', 'Параметры настройки'],
    imageUrl: '/image/center.jpg',
    detailImages: ['/image/center.jpg', '/image/services-card-bg-2026.png'],
    basePrice: 240000,
    durationHours: 36,
  },
];

async function main() {
  const prisma = new PrismaClient();

  try {
    for (const item of services) {
      await prisma.service.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          shortDescription: item.shortDescription,
          description: item.description,
          heroTitle: item.heroTitle,
          lead: item.lead,
          detailTitle: item.detailTitle,
          bullets: item.bullets,
          detailImages: item.detailImages,
          deliverables: item.deliverables,
          imageUrl: item.imageUrl,
          basePrice: item.basePrice,
          durationHours: item.durationHours,
          isActive: true,
        },
        create: {
          slug: item.slug,
          name: item.name,
          shortDescription: item.shortDescription,
          description: item.description,
          heroTitle: item.heroTitle,
          lead: item.lead,
          detailTitle: item.detailTitle,
          bullets: item.bullets,
          detailImages: item.detailImages,
          deliverables: item.deliverables,
          imageUrl: item.imageUrl,
          basePrice: item.basePrice,
          durationHours: item.durationHours,
          isActive: true,
        },
      });
    }

    console.log(`[services:seed-ventilation] upserted: ${services.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error('[services:seed-ventilation] failed', error);
  process.exitCode = 1;
});

