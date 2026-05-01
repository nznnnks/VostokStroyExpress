import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, FilterParameterType, Prisma, ProductStatus } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import {
  findShowcaseCategoryDefinition,
  resolveShowcaseCategoryMatch,
  resolveShowcaseMatchedType,
} from './showcase-category.matcher';
import {
  SHOWCASE_CATEGORY_DEFINITIONS,
} from './showcase-category.config';
import { UpdateProductDto } from './dto/update-product.dto';

const productInclude = {
  category: true,
  filterValues: {
    include: {
      parameter: {
        include: {
          group: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  discounts: {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.ProductInclude;

type CatalogMetadataSourceProduct = {
  id: string;
  name: string;
  brand: string | null;
  country: string | null;
  type: string | null;
  price: Prisma.Decimal;
  images: string[];
  power: Prisma.Decimal | null;
  volume: Prisma.Decimal | null;
  createdAt: Date;
  showcaseCategorySlug: string | null;
  category: { id: string; name: string; slug: string } | null;
  filterValues: Array<{
    parameterId: string;
    value: string;
    numericValue: Prisma.Decimal | null;
    parameter: {
      id: string;
      name: string;
      slug: string;
      type: FilterParameterType;
      unit: string | null;
      group: {
        id: string;
        name: string;
        slug: string;
        sortOrder: number;
      };
    };
  }>;
};

type CatalogMetadata = {
  brands: string[];
  countries: string[];
  types: string[];
  maxPrice: number;
  categoryCards: Array<{ name: string; slug: string; count: number; image?: string }>;
  categoryTypeTree: Array<{
    category: string;
    slug: string;
    count: number;
    types: Array<{ type: string; count: number }>;
  }>;
  currentCategoryTypes: Array<{ type: string; slug: string; count: number }>;
  dynamicFilters: Array<{
    id: string;
    groupId: string;
    groupName: string;
    groupSlug: string;
    parameterName: string;
    parameterSlug: string;
    parameterType: 'TEXT' | 'NUMBER';
    unit?: string;
    values: string[];
    numericValues: number[];
    min: number;
    max: number;
  }>;
};

type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type LandingCategoryDefinition = {
  name: string;
  slug: string;
  includeNames: string[];
  fallbackRootNames?: string[];
  fallbackIncludeNames?: string[];
};
const LANDING_CATEGORY_DEFINITIONS: LandingCategoryDefinition[] = SHOWCASE_CATEGORY_DEFINITIONS;

@Injectable()
export class ProductsService {
  private readonly metadataCache = new Map<string, { expiresAt: number; value: CatalogMetadata }>();
  private readonly metadataCacheTtlMs = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async findCatalog(query: CatalogQueryDto) {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });
    const categoryIds = this.resolveCategoryIds(query.category, categories);
    const limit = query.limit;
    const page = query.page;
    const publicWhere = this.buildPublicCatalogWhere(query, categoryIds);
    const cachedMetadata = query.includeMeta ? this.getCachedCatalogMetadata(query) : null;
    const metadataSqlWhere =
      query.includeMeta && !cachedMetadata
        ? this.buildPublicCatalogSqlWhere(
            { ...query, minPrice: undefined, maxPrice: undefined },
            categoryIds,
          )
        : null;

    const metadataPromise: Promise<CatalogMetadata | null> = !query.includeMeta
      ? Promise.resolve(null)
      : cachedMetadata
        ? Promise.resolve(cachedMetadata)
        : metadataSqlWhere
          ? this.getOrBuildCatalogMetadataLite(query, metadataSqlWhere)
          : Promise.resolve(this.getEmptyCatalogMetadata());

    const [totalAll, total, pagedProducts, metadata] = await Promise.all([
      this.prisma.product.count({
        where: { status: ProductStatus.ACTIVE },
      }),
      this.prisma.product.count({
        where: publicWhere,
      }),
      this.prisma.product.findMany({
        where: publicWhere,
        include: productInclude,
        orderBy: this.getCatalogOrderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      metadataPromise,
    ]);

    const items = pagedProducts.map((product) => this.toProductResponse(product));

    return {
      items,
      page,
      limit,
      total,
      totalAll,
      hasMore: page * limit < total,
      meta: metadata,
    };
  }

  private getEmptyCatalogMetadata(): CatalogMetadata {
    return {
      brands: [],
      countries: [],
      types: [],
      maxPrice: 0,
      categoryCards: [],
      categoryTypeTree: [],
      currentCategoryTypes: [],
      dynamicFilters: [],
    };
  }

  private async getOrBuildCatalogMetadataLite(query: CatalogQueryDto, sqlWhere: Prisma.Sql) {
    const cacheKey = this.buildCatalogMetadataCacheKey(query);
    const now = Date.now();
    const cached = this.metadataCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = await this.buildCatalogMetadataLite(sqlWhere);
    this.metadataCache.set(cacheKey, { value, expiresAt: now + this.metadataCacheTtlMs });

    if (this.metadataCache.size > 100) {
      const oldestKey = this.metadataCache.keys().next().value;
      if (oldestKey) {
        this.metadataCache.delete(oldestKey);
      }
    }

    return value;
  }

  private async buildCatalogMetadataLite(sqlWhere: Prisma.Sql): Promise<CatalogMetadata> {
    // NOTE:
    // Some Prisma Query Engine versions can panic on complex `findMany`/`include` queries at scale.
    // We compute catalog metadata via raw SQL aggregations to keep the query engine in the "simple" path.
    const [priceAgg, brands, countries, types, dynamicFilters, legacyPower, legacyVolume] =
      await Promise.all([
        this.prisma.$queryRaw<Array<{ maxPrice: number | null }>>`
          select max(p.price)::double precision as "maxPrice"
          from "Product" p
          ${sqlWhere}
        `,
        this.prisma.$queryRaw<Array<{ value: string }>>`
          select distinct p.brand as value
          from "Product" p
          ${sqlWhere}
            and p.brand is not null and btrim(p.brand) <> ''
          order by value asc
        `,
        this.prisma.$queryRaw<Array<{ value: string }>>`
          select distinct p.country as value
          from "Product" p
          ${sqlWhere}
            and p.country is not null and btrim(p.country) <> ''
          order by value asc
        `,
        this.prisma.$queryRaw<Array<{ value: string }>>`
          select distinct p.type as value
          from "Product" p
          ${sqlWhere}
            and p.type is not null and btrim(p.type) <> ''
          order by value asc
        `,
        this.prisma.$queryRaw<
          Array<{
            id: string;
            groupId: string;
            groupName: string;
            groupSlug: string;
            parameterName: string;
            parameterSlug: string;
            parameterType: 'TEXT' | 'NUMBER';
            unit: string | null;
            values: string[];
            numericValues: number[];
            min: number | null;
            max: number | null;
          }>
        >`
          select
            fp.id as "id",
            fp."groupId" as "groupId",
            fg.name as "groupName",
            fg.slug as "groupSlug",
            fp.name as "parameterName",
            fp.slug as "parameterSlug",
            fp.type::text as "parameterType",
            fp.unit as "unit",
            coalesce(array_agg(distinct pfv.value) filter (where fp.type = 'TEXT'), array[]::text[]) as "values",
            coalesce(array_agg(distinct (pfv."numericValue")::double precision) filter (where pfv."numericValue" is not null), array[]::double precision[]) as "numericValues",
            min(pfv."numericValue") filter (where pfv."numericValue" is not null) as "min",
            max(pfv."numericValue") filter (where pfv."numericValue" is not null) as "max"
          from "ProductFilterValue" pfv
          join "FilterParameter" fp on fp.id = pfv."parameterId"
          join "FilterGroup" fg on fg.id = fp."groupId"
          join "Product" p on p.id = pfv."productId"
          ${sqlWhere}
            and fp."isActive" = true
          group by fp.id, fp."groupId", fg.name, fg.slug, fp.name, fp.slug, fp.type, fp.unit
          order by fg.name asc, fp.name asc
        `,
        this.prisma.$queryRaw<Array<{ min: number | null; max: number | null }>>`
          select min(p.power)::double precision as min, max(p.power)::double precision as max
          from "Product" p
          ${sqlWhere}
            and p.power is not null and p.power > 0
        `,
        this.prisma.$queryRaw<Array<{ min: number | null; max: number | null }>>`
          select min(p.volume)::double precision as min, max(p.volume)::double precision as max
          from "Product" p
          ${sqlWhere}
            and p.volume is not null and p.volume > 0
        `,
      ]);

    const maxPrice = priceAgg[0]?.maxPrice ?? 0;

    const legacyGroupName = 'Основные параметры';
    const legacyGroupSlug = 'osnovnye-parametry';
    const legacyGroupId = 'legacy-main';

    const normalizedDynamicFilters = dynamicFilters.map((item) => ({
      ...item,
      unit: item.unit ?? undefined,
      values: Array.isArray(item.values) ? item.values.filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru')) : [],
      numericValues: Array.isArray(item.numericValues) ? item.numericValues.filter((n) => Number.isFinite(n)) : [],
      min: item.min ?? 0,
      max: item.max ?? 0,
    }));

    const powerRow = legacyPower[0];
    if (powerRow?.min !== null && powerRow?.max !== null) {
      normalizedDynamicFilters.unshift({
        id: 'legacy-power',
        groupId: legacyGroupId,
        groupName: legacyGroupName,
        groupSlug: legacyGroupSlug,
        parameterName: 'Мощность',
        parameterSlug: 'power',
        parameterType: 'NUMBER',
        unit: 'кВт',
        values: [],
        numericValues: [],
        min: powerRow.min,
        max: powerRow.max,
      });
    }

    const volumeRow = legacyVolume[0];
    if (volumeRow?.min !== null && volumeRow?.max !== null) {
      normalizedDynamicFilters.unshift({
        id: 'legacy-volume',
        groupId: legacyGroupId,
        groupName: legacyGroupName,
        groupSlug: legacyGroupSlug,
        parameterName: 'Объём',
        parameterSlug: 'volume',
        parameterType: 'NUMBER',
        unit: 'л',
        values: [],
        numericValues: [],
        min: volumeRow.min,
        max: volumeRow.max,
      });
    }

    return {
      brands: brands.map((row) => row.value).filter(Boolean),
      countries: countries.map((row) => row.value).filter(Boolean),
      types: types.map((row) => row.value).filter(Boolean),
      maxPrice,
      categoryCards: [],
      categoryTypeTree: [],
      currentCategoryTypes: [],
      dynamicFilters: normalizedDynamicFilters,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const products = await this.prisma.product.findMany({
      where: query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    return this.toProductResponse(product);
  }

  async findOneBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found.`);
    }

    return this.toProductResponse(product);
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);
    const showcaseCategorySlug = await this.resolveShowcaseCategorySlug(dto.categoryId);

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: this.toCreateProductData(dto, showcaseCategorySlug),
      });

      await this.syncProductFilterValues(tx, created.id, dto.filterValues);

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: productInclude,
      });
    });

    this.clearCatalogMetadataCache();
    return this.toProductResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureProductExists(id);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const showcaseCategorySlug =
      'categoryId' in dto && dto.categoryId ? await this.resolveShowcaseCategorySlug(dto.categoryId) : undefined;

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: this.toUpdateProductData(dto, showcaseCategorySlug),
      });

      if ('filterValues' in dto) {
        await this.syncProductFilterValues(tx, id, dto.filterValues);
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });

    this.clearCatalogMetadataCache();
    return this.toProductResponse(product);
  }

  async remove(id: string) {
    await this.ensureProductExists(id);
    await this.prisma.product.delete({ where: { id } });
    this.clearCatalogMetadataCache();
    return { deleted: true, id };
  }

  private async ensureProductExists(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }
  }

  private async ensureCategoryExists(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }
  }

  private toProductResponse(
    product: Prisma.ProductGetPayload<{ include: typeof productInclude }>,
  ) {
    const discount = product.discounts[0];
    const price = product.price.toNumber();
    const finalPrice = discount
      ? discount.type === DiscountType.PERCENT
        ? price - price * (discount.value.toNumber() / 100)
        : Math.max(price - discount.value.toNumber(), 0)
      : price;

    return {
      ...product,
      images: this.normalizeUploads(product.images),
      price,
      oldPrice: product.oldPrice?.toNumber() ?? null,
      power: product.power?.toNumber() ?? null,
      volume: product.volume?.toNumber() ?? null,
      filterValues: [...product.filterValues]
        .sort((left, right) => {
          const groupOrder = left.parameter.group.sortOrder - right.parameter.group.sortOrder;
          if (groupOrder !== 0) {
            return groupOrder;
          }

          const parameterOrder = left.parameter.sortOrder - right.parameter.sortOrder;
          if (parameterOrder !== 0) {
            return parameterOrder;
          }

          return left.parameter.name.localeCompare(right.parameter.name, 'ru');
        })
        .map((item) => ({
        id: item.id,
        parameterId: item.parameterId,
        value: item.value,
        numericValue: item.numericValue?.toNumber() ?? null,
        parameter: {
          id: item.parameter.id,
          name: item.parameter.name,
          slug: item.parameter.slug,
          type: item.parameter.type,
          unit: item.parameter.unit,
          sortOrder: item.parameter.sortOrder,
          group: {
            id: item.parameter.group.id,
            name: item.parameter.group.name,
            slug: item.parameter.group.slug,
            sortOrder: item.parameter.group.sortOrder,
          },
        },
      })),
      finalPrice,
      discount,
    };
  }

  private getCatalogOrderBy(sort: CatalogQueryDto['sort']): Prisma.ProductOrderByWithRelationInput[] {
    if (sort === 'price-asc') return [{ price: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'price-desc') return [{ price: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'new') return [{ createdAt: 'desc' }];
    return [{ createdAt: 'asc' }];
  }

  private buildPublicCatalogWhere(
    query: Pick<
      CatalogQueryDto,
      | 'search'
      | 'category'
      | 'brands'
      | 'countries'
      | 'types'
      | 'minPrice'
      | 'maxPrice'
      | 'textFilters'
      | 'numericFilters'
    >,
    categoryIds: string[] = [],
  ): Prisma.ProductWhereInput {
    const and: Prisma.ProductWhereInput[] = [{ status: ProductStatus.ACTIVE }];
    const search = query.search?.trim();

    if (search) {
      const searchVariants = Array.from(
        new Set([search, search.replaceAll('ё', 'е'), search.replaceAll('е', 'ё')]),
      )
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      and.push({
        OR: searchVariants.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { type: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
        ]),
      });
    }

    const landingDefinition = findShowcaseCategoryDefinition(query.category);

    if (landingDefinition) {
      and.push({ showcaseCategorySlug: landingDefinition.slug });
    } else if (categoryIds.length > 0) {
      and.push({
        categoryId: { in: categoryIds },
      });
    }

    if (query.brands.length > 0) {
      and.push({ brand: { in: query.brands } });
    }

    if (query.countries.length > 0) {
      and.push({ country: { in: query.countries } });
    }

    if (query.types.length > 0) {
      and.push({ type: { in: query.types } });
    }

    if (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number') {
      and.push({
        price: {
          ...(typeof query.minPrice === 'number' ? { gte: query.minPrice } : {}),
          ...(typeof query.maxPrice === 'number' ? { lte: query.maxPrice } : {}),
        },
      });
    }

    for (const [parameterId, values] of Object.entries(query.textFilters)) {
      if (!values || values.length === 0) continue;

      and.push({
        filterValues: {
          some: {
            parameterId,
            value: { in: values },
          },
        },
      });
    }

    for (const [parameterId, range] of Object.entries(query.numericFilters)) {
      if (!Array.isArray(range) || range.length < 2) continue;
      const [min, max] = range;

      if (parameterId === 'legacy-power') {
        and.push({
          power: {
            gte: min,
            lte: max,
          },
        });
        continue;
      }

      if (parameterId === 'legacy-volume') {
        and.push({
          volume: {
            gte: min,
            lte: max,
          },
        });
        continue;
      }

      and.push({
        filterValues: {
          some: {
            parameterId,
            numericValue: {
              gte: min,
              lte: max,
            },
          },
        },
      });
    }

    return and.length === 1 ? and[0] : { AND: and };
  }

  private buildPublicCatalogSqlWhere(
    query: Pick<
      CatalogQueryDto,
      | 'search'
      | 'category'
      | 'brands'
      | 'countries'
      | 'types'
      | 'minPrice'
      | 'maxPrice'
      | 'textFilters'
      | 'numericFilters'
    >,
    categoryIds: string[] = [],
  ) {
    const conditions: Prisma.Sql[] = [Prisma.sql`p.status = 'ACTIVE'`];
    const search = query.search?.trim();

    if (search) {
      const variants = Array.from(new Set([search, search.replaceAll('ё', 'е'), search.replaceAll('е', 'ё')]))
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      const likeParts = variants.map((term) => {
        const like = `%${term}%`;
        return Prisma.sql`(
          p.name ilike ${like}
          or p.slug ilike ${like}
          or p.sku ilike ${like}
          or p.brand ilike ${like}
          or p.type ilike ${like}
        )`;
      });

      if (likeParts.length > 0) {
        conditions.push(Prisma.sql`(${Prisma.join(likeParts, ' or ')})`);
      }
    }

    const landingDefinition = findShowcaseCategoryDefinition(query.category);
    if (landingDefinition) {
      conditions.push(Prisma.sql`p."showcaseCategorySlug" = ${landingDefinition.slug}`);
    } else if (categoryIds.length > 0) {
      conditions.push(Prisma.sql`p."categoryId" in (${Prisma.join(categoryIds)})`);
    }

    if (query.brands.length > 0) {
      conditions.push(Prisma.sql`p.brand in (${Prisma.join(query.brands)})`);
    }

    if (query.countries.length > 0) {
      conditions.push(Prisma.sql`p.country in (${Prisma.join(query.countries)})`);
    }

    if (query.types.length > 0) {
      conditions.push(Prisma.sql`p.type in (${Prisma.join(query.types)})`);
    }

    if (typeof query.minPrice === 'number') {
      conditions.push(Prisma.sql`p.price >= ${query.minPrice}`);
    }
    if (typeof query.maxPrice === 'number') {
      conditions.push(Prisma.sql`p.price <= ${query.maxPrice}`);
    }

    for (const [parameterId, values] of Object.entries(query.textFilters)) {
      if (!values || values.length === 0) continue;
      conditions.push(Prisma.sql`exists (
        select 1 from "ProductFilterValue" pfv
        where pfv."productId" = p.id
          and pfv."parameterId" = ${parameterId}
          and pfv.value in (${Prisma.join(values)})
      )`);
    }

    for (const [parameterId, range] of Object.entries(query.numericFilters)) {
      if (!Array.isArray(range) || range.length < 2) continue;
      const [min, max] = range;

      if (parameterId === 'legacy-power') {
        conditions.push(Prisma.sql`p.power >= ${min} and p.power <= ${max}`);
        continue;
      }
      if (parameterId === 'legacy-volume') {
        conditions.push(Prisma.sql`p.volume >= ${min} and p.volume <= ${max}`);
        continue;
      }

      conditions.push(Prisma.sql`exists (
        select 1 from "ProductFilterValue" pfv
        where pfv."productId" = p.id
          and pfv."parameterId" = ${parameterId}
          and pfv."numericValue" is not null
          and pfv."numericValue" >= ${min}
          and pfv."numericValue" <= ${max}
      )`);
    }

    return Prisma.sql`where ${Prisma.join(conditions, ' and ')}`;
  }

  private buildCatalogMetadata(
    products: CatalogMetadataSourceProduct[],
    categories: CategoryTreeNode[],
    selectedCategory?: string,
  ) {
    const uniqueValues = (values: Array<string | null | undefined>) =>
      Array.from(new Set(values.map((item) => item?.trim()).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right, 'ru'),
      );

    const brands = uniqueValues(products.map((product) => product.brand));
    const countries = uniqueValues(products.map((product) => product.country));
    const types = uniqueValues(products.map((product) => product.type));
    const maxPrice = products.reduce((max, product) => Math.max(max, product.price.toNumber()), 0);

    const categoryMap = new Map(categories.map((item) => [item.id, item]));
    const childrenByParentId = new Map<string | null, CategoryTreeNode[]>();
    for (const category of categories) {
      const bucket = childrenByParentId.get(category.parentId) ?? [];
      bucket.push(category);
      childrenByParentId.set(category.parentId, bucket);
    }
    const definitionBySlug = new Map(LANDING_CATEGORY_DEFINITIONS.map((item) => [item.slug, item]));
    const definitionByName = new Map(LANDING_CATEGORY_DEFINITIONS.map((item) => [item.name, item]));
    const categoryCardsMap = new Map(
      LANDING_CATEGORY_DEFINITIONS.map((item) => [
        item.slug,
        { name: item.name, slug: item.slug, count: 0, image: undefined as string | undefined },
      ]),
    );
    const categoryTreeMap = new Map(
      LANDING_CATEGORY_DEFINITIONS.map((item) => [
        item.slug,
        { category: item.name, slug: item.slug, count: 0, types: new Map<string, number>() },
      ]),
    );

    const resolveCategoryPath = (categoryId: string | null | undefined) => {
      const path: CategoryTreeNode[] = [];
      let currentId: string | null | undefined = categoryId;
      while (currentId) {
        const current = categoryMap.get(currentId);
        if (!current) break;
        path.unshift(current);
        currentId = current.parentId;
      }
      return path;
    };

    for (const product of products) {
      const categoryPath = resolveCategoryPath(product.category?.id);
      const categoryPathNames = categoryPath.map((item) => item.name);
      const persistedDefinition = product.showcaseCategorySlug
        ? definitionBySlug.get(product.showcaseCategorySlug)
        : undefined;
      const match =
        persistedDefinition
          ? {
              definition: persistedDefinition,
              matchedType: resolveShowcaseMatchedType(categoryPathNames, persistedDefinition) ?? persistedDefinition.name,
            }
          : resolveShowcaseCategoryMatch(categoryPathNames);
      if (!match) continue;

      const categoryImage = product.images[0] ?? undefined;
      const card = categoryCardsMap.get(match.definition.slug);
      if (card) {
        card.count += 1;
        if (!card.image && categoryImage) {
          card.image = categoryImage;
        }
      }

      const tree = categoryTreeMap.get(match.definition.slug);
      if (tree) {
        tree.count += 1;
        tree.types.set(match.matchedType, (tree.types.get(match.matchedType) ?? 0) + 1);
      }
    }

    const categoryCards = LANDING_CATEGORY_DEFINITIONS.map((item) => categoryCardsMap.get(item.slug)!);

    const categoryTypeTree = LANDING_CATEGORY_DEFINITIONS.map((item) => categoryTreeMap.get(item.slug)!)
      .map((item) => ({
        category: item.category,
        slug: item.slug,
        count: item.count,
        types: Array.from(item.types.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type, 'ru')),
      }));

    const collectDescendantIds = (ids: string[]) => {
      const resolved = new Set<string>(ids);
      let changed = true;

      while (changed) {
        changed = false;
        for (const category of categories) {
          if (category.parentId && resolved.has(category.parentId) && !resolved.has(category.id)) {
            resolved.add(category.id);
            changed = true;
          }
        }
      }

      return resolved;
    };

    const resolveSelectedCategoryNodes = (value: string | undefined) => {
      const trimmed = value?.trim();
      if (!trimmed) return [] as CategoryTreeNode[];

      const selectedDefinition = definitionBySlug.get(trimmed) ?? definitionByName.get(trimmed);
      if (selectedDefinition) {
        return categories.filter((item) => selectedDefinition.includeNames.includes(item.name));
      }

      return categories.filter((item) => item.name === trimmed || item.slug === trimmed);
    };

    const currentCategoryTypesByName = new Map<string, { type: string; slug: string; count: number }>();
    const selectedDefinition = selectedCategory
      ? definitionBySlug.get(selectedCategory.trim()) ?? definitionByName.get(selectedCategory.trim())
      : undefined;

    if (selectedDefinition) {
      for (const product of products) {
        if (product.showcaseCategorySlug !== selectedDefinition.slug) {
          continue;
        }

        const categoryPath = resolveCategoryPath(product.category?.id);
        const matchedType = resolveShowcaseMatchedType(
          categoryPath.map((item) => item.name),
          selectedDefinition,
        );
        if (!matchedType) {
          continue;
        }

        const matchedNode = [...categoryPath].reverse().find((node) => node.name === matchedType);
        if (!matchedNode) {
          continue;
        }

        const normalizedName = matchedType.trim().toLowerCase();
        const existing = currentCategoryTypesByName.get(normalizedName);
        if (!existing) {
          currentCategoryTypesByName.set(normalizedName, {
            type: matchedType,
            slug: matchedNode.slug,
            count: 1,
          });
          continue;
        }

        existing.count += 1;
      }
    } else {
      const selectedCategoryNodes = resolveSelectedCategoryNodes(selectedCategory);
      const currentCategoryTypeCandidates = new Map<string, CategoryTreeNode>();

      for (const category of selectedCategoryNodes) {
        const directChildren = childrenByParentId.get(category.id) ?? [];
        const sourceNodes = directChildren.length > 0 ? directChildren : [category];

        for (const sourceNode of sourceNodes) {
          const existing = currentCategoryTypeCandidates.get(sourceNode.slug);
          if (!existing) {
            currentCategoryTypeCandidates.set(sourceNode.slug, sourceNode);
          }
        }
      }

      for (const category of Array.from(currentCategoryTypeCandidates.values())) {
        const normalizedName = category.name.trim().toLowerCase();
        const subtreeIds = collectDescendantIds([category.id]);
        const count = products.filter((product) => product.category?.id && subtreeIds.has(product.category.id)).length;
        if (count <= 0) continue;

        const existing = currentCategoryTypesByName.get(normalizedName);
        if (!existing) {
          currentCategoryTypesByName.set(normalizedName, {
            type: category.name,
            slug: category.slug,
            count,
          });
          continue;
        }

        existing.count += count;
      }
    }

    const currentCategoryTypes = Array.from(currentCategoryTypesByName.values())
      .map((item) => ({
        type: item.type,
        slug: item.slug,
        count: item.count,
      }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type, 'ru'));

    const filtersMap = new Map<
      string,
      {
        id: string;
        groupId: string;
        groupName: string;
        groupSlug: string;
        parameterName: string;
        parameterSlug: string;
        parameterType: 'TEXT' | 'NUMBER';
        unit?: string;
        values: Set<string>;
        numericValues: number[];
      }
    >();

    for (const product of products) {
      for (const filterValue of product.filterValues) {
        const current = filtersMap.get(filterValue.parameterId) ?? {
          id: filterValue.parameterId,
          groupId: filterValue.parameter.group.id,
          groupName: filterValue.parameter.group.name,
          groupSlug: filterValue.parameter.group.slug,
          parameterName: filterValue.parameter.name,
          parameterSlug: filterValue.parameter.slug,
          parameterType: filterValue.parameter.type,
          unit: filterValue.parameter.unit ?? undefined,
          values: new Set<string>(),
          numericValues: [],
        };

        current.values.add(filterValue.value);
        if (filterValue.numericValue !== null) {
          current.numericValues.push(filterValue.numericValue.toNumber());
        }

        filtersMap.set(filterValue.parameterId, current);
      }
    }

    const powerValues = products
      .map((product) => product.power?.toNumber() ?? null)
      .filter((item): item is number => typeof item === 'number' && Number.isFinite(item) && item > 0);
    const volumeValues = products
      .map((product) => product.volume?.toNumber() ?? null)
      .filter((item): item is number => typeof item === 'number' && Number.isFinite(item) && item > 0);

    if (!filtersMap.has('legacy-power') && powerValues.length > 0) {
      filtersMap.set('legacy-power', {
        id: 'legacy-power',
        groupId: 'legacy-main',
        groupName: 'Основные параметры',
        groupSlug: 'osnovnye-parametry',
        parameterName: 'Мощность',
        parameterSlug: 'power',
        parameterType: 'NUMBER',
        unit: 'кВт',
        values: new Set<string>(),
        numericValues: powerValues,
      });
    }

    if (!filtersMap.has('legacy-volume') && volumeValues.length > 0) {
      filtersMap.set('legacy-volume', {
        id: 'legacy-volume',
        groupId: 'legacy-main',
        groupName: 'Основные параметры',
        groupSlug: 'osnovnye-parametry',
        parameterName: 'Объем',
        parameterSlug: 'volume',
        parameterType: 'NUMBER',
        unit: 'л',
        values: new Set<string>(),
        numericValues: volumeValues,
      });
    }

    const dynamicFilters = Array.from(filtersMap.values())
      .map((item) => ({
        id: item.id,
        groupId: item.groupId,
        groupName: item.groupName,
        groupSlug: item.groupSlug,
        parameterName: item.parameterName,
        parameterSlug: item.parameterSlug,
        parameterType: item.parameterType,
        unit: item.unit,
        values: Array.from(item.values).sort((left, right) => left.localeCompare(right, 'ru')),
        numericValues: item.numericValues,
        min: item.numericValues.length > 0 ? Math.min(...item.numericValues) : 0,
        max: item.numericValues.length > 0 ? Math.max(...item.numericValues) : 0,
      }))
      .sort(
        (left, right) =>
          left.groupName.localeCompare(right.groupName, 'ru') ||
          left.parameterName.localeCompare(right.parameterName, 'ru'),
      );

    return {
      brands,
      countries,
      types,
      maxPrice,
      categoryCards,
      categoryTypeTree,
      currentCategoryTypes,
      dynamicFilters,
    };
  }

  private getOrBuildCatalogMetadata(
    query: CatalogQueryDto,
    products: CatalogMetadataSourceProduct[],
    categories: CategoryTreeNode[],
  ) {
    const cacheKey = this.buildCatalogMetadataCacheKey(query);
    const now = Date.now();
    const cached = this.metadataCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = this.buildCatalogMetadata(products, categories, query.category);
    this.metadataCache.set(cacheKey, {
      value,
      expiresAt: now + this.metadataCacheTtlMs,
    });

    if (this.metadataCache.size > 100) {
      const oldestKey = this.metadataCache.keys().next().value;
      if (oldestKey) {
        this.metadataCache.delete(oldestKey);
      }
    }

    return value;
  }

  private getCachedCatalogMetadata(query: CatalogQueryDto) {
    const cacheKey = this.buildCatalogMetadataCacheKey(query);
    const cached = this.metadataCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt <= Date.now()) {
      this.metadataCache.delete(cacheKey);
      return null;
    }

    return cached.value;
  }

  private buildCatalogMetadataCacheKey(query: CatalogQueryDto) {
    const textFilterEntries = Object.entries(query.textFilters)
      .map(([key, values]) => [key, [...values].sort()] as [string, string[]])
      .sort((left, right) => left[0].localeCompare(right[0]));
    const numericFilterEntries = Object.entries(query.numericFilters).sort((left, right) =>
      left[0].localeCompare(right[0]),
    );

    return JSON.stringify({
      search: query.search?.trim() ?? '',
      category: query.category?.trim() ?? '',
      brands: [...query.brands].sort(),
      countries: [...query.countries].sort(),
      types: [...query.types].sort(),
      textFilters: Object.fromEntries(textFilterEntries),
      numericFilters: Object.fromEntries(numericFilterEntries),
    });
  }

  private clearCatalogMetadataCache() {
    this.metadataCache.clear();
  }

  private async resolveShowcaseCategorySlug(categoryId: string) {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    const categoryMap = new Map(categories.map((item) => [item.id, item]));
    const categoryPathNames: string[] = [];
    let currentId: string | null | undefined = categoryId;

    while (currentId) {
      const current = categoryMap.get(currentId);
      if (!current) {
        break;
      }

      categoryPathNames.unshift(current.name);
      currentId = current.parentId;
    }

    return resolveShowcaseCategoryMatch(categoryPathNames)?.definition.slug ?? null;
  }

  private resolveCategoryIds(categoryQuery: string | undefined, categories: CategoryTreeNode[]) {
    const value = categoryQuery?.trim();
    if (!value) return [];

    const collectWithDescendants = (ids: string[]) => {
      if (ids.length === 0) {
        return [];
      }

      const resolved = new Set<string>(ids);
      let changed = true;
      while (changed) {
        changed = false;
        for (const category of categories) {
          if (category.parentId && resolved.has(category.parentId) && !resolved.has(category.id)) {
            resolved.add(category.id);
            changed = true;
          }
        }
      }

      return Array.from(resolved);
    };

    const landingDefinition = findShowcaseCategoryDefinition(value);
    if (landingDefinition) {
      return [];
    }

    const matching = categories.filter((item) => item.name === value || item.slug === value).map((item) => item.id);
    return collectWithDescendants(matching);
  }

  private toCreateProductData(dto: CreateProductDto, showcaseCategorySlug: string | null) {
    const { filterValues: _filterValues, ...productData } = dto;
    return {
      ...productData,
      showcaseCategorySlug,
    };
  }

  private toUpdateProductData(dto: UpdateProductDto, showcaseCategorySlug: string | null | undefined) {
    const { filterValues: _filterValues, ...productData } = dto;
    return {
      ...productData,
      ...(showcaseCategorySlug !== undefined ? { showcaseCategorySlug } : {}),
    };
  }

  private async syncProductFilterValues(
    tx: Prisma.TransactionClient,
    productId: string,
    filterValues: CreateProductDto['filterValues'] | UpdateProductDto['filterValues'] | undefined,
  ) {
    if (!filterValues) {
      return;
    }

    const normalizedValues = filterValues
      .map((item) => ({
        parameterId: item.parameterId,
        value: item.value?.trim() ?? '',
        numericValue:
          typeof item.numericValue === 'number' && Number.isFinite(item.numericValue)
            ? item.numericValue
            : null,
      }))
      .filter((item) => item.value || item.numericValue !== null);

    await tx.productFilterValue.deleteMany({
      where: { productId },
    });

    if (normalizedValues.length === 0) {
      await this.syncLegacyFilterFields(tx, productId, new Map());
      return;
    }

    const parameters = await tx.filterParameter.findMany({
      where: {
        id: {
          in: normalizedValues.map((item) => item.parameterId),
        },
      },
      select: {
        id: true,
        slug: true,
        type: true,
      },
    });

    const parameterMap = new Map(parameters.map((item) => [item.id, item]));
    const rows = normalizedValues
      .map((item) => {
        const parameter = parameterMap.get(item.parameterId);

        if (!parameter) {
          return null;
        }

        const isNumber = parameter.type === FilterParameterType.NUMBER;
        const numericValue = isNumber ? item.numericValue : null;
        const textValue = item.value || (numericValue !== null ? String(numericValue) : '');

        if (isNumber && numericValue === null) {
          return null;
        }

        if (!textValue) {
          return null;
        }

        return {
          parameterId: item.parameterId,
          value: textValue,
          numericValue,
        };
      })
      .filter((item): item is { parameterId: string; value: string; numericValue: number | null } => Boolean(item));

    if (rows.length === 0) {
      await this.syncLegacyFilterFields(tx, productId, new Map());
      return;
    }

    await tx.productFilterValue.createMany({
      data: rows.map((item) => ({
        productId,
        parameterId: item.parameterId,
        value: item.value,
        numericValue: item.numericValue,
      })),
    });

    const persistedParameters = new Map(
      parameters.map((item) => [item.id, item]),
    );
    await this.syncLegacyFilterFields(tx, productId, persistedParameters, rows);
  }

  private async syncLegacyFilterFields(
    tx: Prisma.TransactionClient,
    productId: string,
    parameters: Map<string, { id: string; slug: string; type: FilterParameterType }>,
    rows: Array<{ parameterId: string; value: string; numericValue: number | null }> = [],
  ) {
    let power: number | null | undefined;
    let volume: number | null | undefined;

    for (const row of rows) {
      const parameter = parameters.get(row.parameterId);

      if (!parameter || parameter.type !== FilterParameterType.NUMBER || row.numericValue === null) {
        continue;
      }

      if (parameter.slug === 'power') {
        power = row.numericValue;
      }

      if (parameter.slug === 'volume') {
        volume = row.numericValue;
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: {
        power: power ?? null,
        volume: volume ?? null,
      },
    });
  }

  private normalizeUploads(images: string[] | null | undefined) {
    if (!Array.isArray(images)) {
      return images ?? [];
    }

    return images.map((value) => {
      if (!value) {
        return value;
      }

      if (value.startsWith('/api/uploads/')) {
        return value;
      }

      if (value.startsWith('/uploads/')) {
        return `/api${value}`;
      }

      try {
        const url = new URL(value);
        if (url.pathname.startsWith('/uploads/')) {
          return `/api${url.pathname}`;
        }
      } catch {
        // ignore
      }

      return value;
    });
  }
}
