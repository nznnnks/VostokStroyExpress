import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, ItemKind, Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

const cartInclude = {
  user: {
    include: {
      clientProfile: true,
    },
  },
  appliedDiscount: true,
  items: {
    include: {
      product: {
        include: {
          category: true,
        },
      },
      service: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CartInclude;

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const carts = await this.prisma.cart.findMany({
      where: query.search
        ? {
            user: {
              OR: [
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          }
        : undefined,
      include: cartInclude,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return carts.map((cart) => this.toCartResponse(cart));
  }

  async findOne(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: cartInclude,
    });

    if (!cart) {
      throw new NotFoundException(`Cart ${id} not found.`);
    }

    return this.toCartResponse(cart);
  }

  async create(dto: CreateCartDto) {
    const cart = await this.prisma.cart.create({
      data: dto,
      include: cartInclude,
    });

    return this.toCartResponse(cart);
  }

  async update(id: string, dto: UpdateCartDto) {
    await this.ensureCartExists(id);
    const cart = await this.prisma.cart.update({
      where: { id },
      data: dto,
      include: cartInclude,
    });
    return this.toCartResponse(cart);
  }

  async addItem(cartId: string, dto: AddCartItemDto) {
    await this.ensureCartExists(cartId);

    const quantity = dto.quantity ?? 1;

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${dto.productId} not found.`);
      }

      const existing = await this.prisma.cartItem.findFirst({
        where: { cartId, productId: dto.productId },
      });

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
            totalPrice: product.price.mul(existing.quantity + quantity),
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId,
            productId: dto.productId,
            kind: ItemKind.PRODUCT,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price.mul(quantity),
          },
        });
      }
    }

    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Service ${dto.serviceId} not found.`);
      }

      const existing = await this.prisma.cartItem.findFirst({
        where: { cartId, serviceId: dto.serviceId },
      });

      const unitPrice = service.basePrice ?? new Prisma.Decimal(0);

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
            totalPrice: unitPrice.mul(existing.quantity + quantity),
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId,
            serviceId: dto.serviceId,
            kind: ItemKind.SERVICE,
            quantity,
            unitPrice,
            totalPrice: unitPrice.mul(quantity),
          },
        });
      }
    }

    return this.findOne(cartId);
  }

  async updateItem(cartId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
      include: {
        product: true,
        service: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found in cart ${cartId}.`);
    }

    const unitPrice = item.product?.price ?? item.service?.basePrice ?? new Prisma.Decimal(0);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: dto.quantity,
        unitPrice,
        totalPrice: unitPrice.mul(dto.quantity),
      },
    });

    return this.findOne(cartId);
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found in cart ${cartId}.`);
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.findOne(cartId);
  }

  async remove(id: string) {
    await this.ensureCartExists(id);
    await this.prisma.cart.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureCartExists(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException(`Cart ${id} not found.`);
    }
  }

  private toCartResponse(cart: Prisma.CartGetPayload<{ include: typeof cartInclude }>) {
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice.toNumber(), 0);
    const discountTotal = this.getDiscountValue(subtotal, cart.appliedDiscount);

    return {
      ...cart,
      user: cart.user
        ? {
            ...cart.user,
            passwordHash: undefined,
          }
        : null,
      items: cart.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
      summary: {
        itemsCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        discountTotal,
        total: Math.max(subtotal - discountTotal, 0),
      },
    };
  }

  private getDiscountValue(
    subtotal: number,
    discount: Prisma.DiscountGetPayload<{}> | null,
  ) {
    if (!discount) {
      return 0;
    }

    if (discount.type === DiscountType.PERCENT) {
      return subtotal * (discount.value.toNumber() / 100);
    }

    return Math.min(discount.value.toNumber(), subtotal);
  }
}
