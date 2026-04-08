import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, ItemKind, Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

const orderInclude = {
  user: {
    include: {
      clientProfile: true,
    },
  },
  template: true,
  appliedDiscount: true,
  items: {
    orderBy: { createdAt: 'asc' },
  },
  payments: {
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const orders = await this.prisma.order.findMany({
      where: query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  email: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : undefined,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return orders.map((order) => this.toOrderResponse(order));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }

    return this.toOrderResponse(order);
  }

  async create(dto: CreateOrderDto) {
    await this.ensureUserExists(dto.userId);

    if (dto.templateId) {
      await this.ensureTemplateExists(dto.templateId);
    }

    const discount = dto.appliedDiscountId
      ? await this.prisma.discount.findUnique({ where: { id: dto.appliedDiscountId } })
      : null;

    const items = await Promise.all(
      dto.items.map(async (item) => {
        if (item.productId) {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found.`);
          }

          return {
            productId: product.id,
            serviceId: null,
            kind: ItemKind.PRODUCT,
            title: product.name,
            sku: product.sku,
            imageUrl: product.images[0] ?? null,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price.mul(item.quantity),
          };
        }

        if (!item.serviceId) {
          throw new NotFoundException('Order item must reference productId or serviceId.');
        }

        const service = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
        });

        if (!service) {
          throw new NotFoundException(`Service ${item.serviceId} not found.`);
        }

        const unitPrice = service.basePrice ?? new Prisma.Decimal(0);

        return {
          productId: null,
          serviceId: service.id,
          kind: ItemKind.SERVICE,
          title: service.name,
          sku: null,
          imageUrl: service.imageUrl ?? null,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice.mul(item.quantity),
        };
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice.toNumber(), 0);
    const discountTotal = this.getDiscountValue(subtotal, discount);
    const taxableBase = Math.max(subtotal - discountTotal, 0);
    const vatTotal = Number((taxableBase * 0.2).toFixed(2));
    const total = Number((taxableBase + vatTotal).toFixed(2));

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId: dto.userId,
        templateId: dto.templateId,
        appliedDiscountId: dto.appliedDiscountId,
        deliveryMethod: dto.deliveryMethod,
        deliveryAddress: dto.deliveryAddress,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        comment: dto.comment,
        subtotal,
        discountTotal,
        vatTotal,
        total,
        placedAt: new Date(),
        items: {
          create: items,
        },
        payments: dto.payment
          ? {
              create: {
                method: dto.payment.method,
                provider: dto.payment.provider,
                transactionId: dto.payment.transactionId,
                currency: dto.payment.currency ?? 'RUB',
                amount: total,
                paidAt: dto.payment.paidAt ? new Date(dto.payment.paidAt) : undefined,
                status: dto.payment.paidAt ? 'PAID' : 'PENDING',
              },
            }
          : undefined,
      },
      include: orderInclude,
    });

    return this.toOrderResponse(order);
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.ensureOrderExists(id);

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        templateId: dto.templateId,
        appliedDiscountId: dto.appliedDiscountId,
        status: dto.status,
        deliveryMethod: dto.deliveryMethod,
        deliveryAddress: dto.deliveryAddress,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        comment: dto.comment,
      },
      include: orderInclude,
    });

    return this.toOrderResponse(order);
  }

  async remove(id: string) {
    await this.ensureOrderExists(id);
    await this.prisma.order.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
  }

  private async ensureTemplateExists(id: string) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!template) {
      throw new NotFoundException(`Order template ${id} not found.`);
    }
  }

  private async ensureOrderExists(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
  }

  private generateOrderNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `VSE-${stamp}-${suffix}`;
  }

  private getDiscountValue(
    subtotal: number,
    discount: Prisma.DiscountGetPayload<{}> | null,
  ) {
    if (!discount) {
      return 0;
    }

    if (discount.type === DiscountType.PERCENT) {
      return Number((subtotal * (discount.value.toNumber() / 100)).toFixed(2));
    }

    return Math.min(discount.value.toNumber(), subtotal);
  }

  private toOrderResponse(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
    return {
      ...order,
      user: order.user
        ? {
            ...order.user,
            passwordHash: undefined,
          }
        : null,
      items: order.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
      summary: {
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.subtotal.toNumber(),
        discountTotal: order.discountTotal.toNumber(),
        vatTotal: order.vatTotal.toNumber(),
        total: order.total.toNumber(),
      },
    };
  }
}
