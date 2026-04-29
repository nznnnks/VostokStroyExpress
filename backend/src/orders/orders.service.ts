import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, ItemKind, Prisma } from '@prisma/client';

import { OptionalAuthPrincipal, AuthPrincipal } from '../auth/interfaces/auth-principal.interface';
import { PasswordService } from '../auth/password.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MailService } from '../mail/mail.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(query: PaginationQueryDto, auth: AuthPrincipal) {
    const filters: Prisma.OrderWhereInput[] = [];

    if (auth.type === 'user') {
      filters.push({ userId: auth.userId });
    }

    if (query.search) {
      filters.push(
        auth.type === 'admin'
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
          : {
              orderNumber: { contains: query.search, mode: 'insensitive' },
            },
      );
    }

    const orders = await this.prisma.order.findMany({
      where: filters.length ? { AND: filters } : undefined,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return orders.map((order) => this.toOrderResponse(order));
  }

  async findOne(id: string, auth: AuthPrincipal) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }

    if (auth.type === 'user' && order.userId !== auth.userId) {
      throw new ForbiddenException(`Order ${id} does not belong to the current user.`);
    }

    return this.toOrderResponse(order);
  }

  async create(dto: CreateOrderDto, auth?: OptionalAuthPrincipal) {
    const userId = await this.resolveOrderUserId(dto, auth);

    if (dto.templateId) {
      await this.ensureTemplateExists(dto.templateId, userId);
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
        userId,
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

    await this.sendOrderCreatedEmail(order);
    return this.toOrderResponse(order);
  }

  async update(id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException(`Order ${id} not found.`);
    }

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

    if (dto.status && dto.status !== existing.status) {
      await this.sendOrderStatusChangedEmail(order, existing.status);
    }

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

  private async resolveOrderUserId(dto: CreateOrderDto, auth?: OptionalAuthPrincipal) {
    if (auth?.type === 'admin') {
      if (!dto.userId) {
        throw new BadRequestException('userId is required when an admin creates an order.');
      }
      await this.ensureUserExists(dto.userId);
      return dto.userId;
    }

    if (auth?.type === 'user') {
      await this.ensureUserExists(auth.userId);
      return auth.userId;
    }

    if (!dto.email) {
      throw new BadRequestException('email is required for guest checkout.');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return existingUser.id;
    }

    const contactName = dto.contactName?.trim() || 'Гость';
    const [firstName, ...rest] = contactName.split(/\s+/).filter(Boolean);
    const lastName = rest.length > 0 ? rest.join(' ') : undefined;
    const passwordHash = await this.passwordService.hashPassword(
      `guest-${normalizedEmail}-${Date.now()}`,
    );

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        phone: dto.contactPhone?.trim() || null,
        passwordHash,
        firstName: firstName || contactName,
        lastName,
        clientProfile: {
          create: {
            firstName: firstName || contactName,
            lastName,
            contactPhone: dto.contactPhone?.trim() || null,
          },
        },
      },
      select: { id: true },
    });

    return user.id;
  }

  private async ensureTemplateExists(id: string, userId?: string) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!template) {
      throw new NotFoundException(`Order template ${id} not found.`);
    }

    if (userId && template.userId !== userId) {
      throw new ForbiddenException(`Order template ${id} does not belong to the current user.`);
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

  private get notifyEmail() {
    return process.env.ORDERS_NOTIFY_EMAIL ?? null;
  }

  private async sendOrderCreatedEmail(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
    const customerEmail = order.user?.email;
    if (!customerEmail) {
      return;
    }

    const subject = `Заказ ${order.orderNumber} оформлен`;
    const body = this.formatOrderEmail(order, {
      header: `Спасибо! Мы получили ваш заказ ${order.orderNumber}.`,
      statusLine: `Текущий статус: ${order.status}`,
    });

    try {
      await this.mailService.sendMail({
        to: this.notifyEmail ? `${customerEmail}, ${this.notifyEmail}` : customerEmail,
        subject,
        text: body,
      });
    } catch {
      // Do not block order placement if mail is misconfigured/unavailable.
    }
  }

  private async sendOrderStatusChangedEmail(
    order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
    previousStatus: string,
  ) {
    const customerEmail = order.user?.email;
    if (!customerEmail) {
      return;
    }

    const subject = `Статус заказа ${order.orderNumber}: ${previousStatus} → ${order.status}`;
    const body = this.formatOrderEmail(order, {
      header: `Статус вашего заказа ${order.orderNumber} изменился.`,
      statusLine: `Статус: ${previousStatus} → ${order.status}`,
    });

    try {
      await this.mailService.sendMail({
        to: this.notifyEmail ? `${customerEmail}, ${this.notifyEmail}` : customerEmail,
        subject,
        text: body,
      });
    } catch {
      // Do not block status updates if mail is misconfigured/unavailable.
    }
  }

  private formatOrderEmail(
    order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
    meta: { header: string; statusLine: string },
  ) {
    const lines: string[] = [];

    lines.push(meta.header);
    lines.push(meta.statusLine);
    lines.push('');
    lines.push(`Номер: ${order.orderNumber}`);
    lines.push(`Дата: ${order.placedAt ? new Date(order.placedAt).toLocaleString('ru-RU') : '-'}`);
    lines.push('');

    lines.push('Контакты:');
    lines.push(`- Имя: ${order.contactName ?? order.user?.clientProfile?.firstName ?? order.user?.firstName ?? '-'}`);
    lines.push(`- Телефон: ${order.contactPhone ?? order.user?.phone ?? order.user?.clientProfile?.contactPhone ?? '-'}`);
    lines.push(`- Email: ${order.user?.email ?? '-'}`);
    lines.push('');

    if (order.deliveryMethod || order.deliveryAddress) {
      lines.push('Доставка:');
      if (order.deliveryMethod) lines.push(`- Способ: ${order.deliveryMethod}`);
      if (order.deliveryAddress) lines.push(`- Адрес: ${order.deliveryAddress}`);
      lines.push('');
    }

    if (order.comment) {
      lines.push('Комментарий:');
      lines.push(order.comment);
      lines.push('');
    }

    lines.push('Состав заказа:');
    for (const item of order.items) {
      const unit = item.unitPrice.toNumber();
      const total = item.totalPrice.toNumber();
      lines.push(`- ${item.title} × ${item.quantity} = ${total.toFixed(2)} RUB (${unit.toFixed(2)} за шт.)`);
    }

    lines.push('');
    lines.push('Итого:');
    lines.push(`- Подытог: ${order.subtotal.toNumber().toFixed(2)} RUB`);
    lines.push(`- Скидка: ${order.discountTotal.toNumber().toFixed(2)} RUB`);
    lines.push(`- НДС (20%): ${order.vatTotal.toNumber().toFixed(2)} RUB`);
    lines.push(`- К оплате: ${order.total.toNumber().toFixed(2)} RUB`);

    return lines.join('\n');
  }
}
