import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  CLIENT_LIST_EXCLUDED_ROLES,
  isAdminUserRole,
  isClientListExcludedRole,
} from '../auth/constants/auth.constants';
import { PasswordService } from '../auth/password.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userInclude = {
  clientProfile: true,
} satisfies Prisma.UserInclude;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const where: Prisma.UserWhereInput | undefined = query.search
      ? {
          AND: [
            { role: { notIn: [...CLIENT_LIST_EXCLUDED_ROLES] } },
            {
              OR: [
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search, mode: 'insensitive' } },
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          ],
        }
      : { role: { notIn: [...CLIENT_LIST_EXCLUDED_ROLES] } };

    const users = await this.prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!user || isClientListExcludedRole(user.role)) {
      throw new NotFoundException(`User ${id} not found.`);
    }

    return this.toUserResponse(user);
  }

  async create(dto: CreateUserDto) {
    if (dto.role && isAdminUserRole(dto.role)) {
      throw new BadRequestException('Use the admin-users endpoint for elevated roles.');
    }

    const passwordHash = await this.passwordService.preparePasswordHash(dto.passwordHash);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.clientProfile?.firstName,
        lastName: dto.clientProfile?.lastName,
        role: dto.role,
        status: dto.status,
        clientProfile: dto.clientProfile
          ? {
              create: dto.clientProfile,
            }
          : undefined,
      },
      include: userInclude,
    });

    return this.toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureRegularUserExists(id);

    if (dto.role && isAdminUserRole(dto.role)) {
      throw new BadRequestException('Use the admin-users endpoint for elevated roles.');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.clientProfile?.firstName,
        lastName: dto.clientProfile?.lastName,
        passwordHash: dto.passwordHash
          ? await this.passwordService.preparePasswordHash(dto.passwordHash)
          : undefined,
        role: dto.role,
        status: dto.status,
      },
      include: userInclude,
    });

    if (dto.clientProfile) {
      await this.upsertUserClientProfile(id, dto.clientProfile);
    }

    return this.findOne(user.id);
  }

  findCurrent(userId: string) {
    return this.findOne(userId);
  }

  async updateCurrent(userId: string, dto: UpdateUserDto) {
    await this.ensureUserExists(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.clientProfile?.firstName,
        lastName: dto.clientProfile?.lastName,
        passwordHash: dto.passwordHash
          ? await this.passwordService.preparePasswordHash(dto.passwordHash)
          : undefined,
      },
    });

    if (dto.clientProfile) {
      await this.upsertUserClientProfile(userId, dto.clientProfile);
    }

    return this.findOne(userId);
  }

  async remove(id: string) {
    await this.ensureRegularUserExists(id);

    const ordersCount = await this.prisma.order.count({
      where: { userId: id },
    });

    if (ordersCount > 0) {
      throw new BadRequestException(
        'Cannot delete a user with existing orders. Block the user instead to preserve order history.',
      );
    }

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findAllProfiles(query: PaginationQueryDto) {
    const profiles = await this.prisma.clientProfile.findMany({
      where: query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { companyName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return profiles.map((profile) => ({
      ...profile,
      user: profile.user ? this.toUserResponse(profile.user) : null,
    }));
  }

  async findProfile(id: string) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(`Client profile ${id} not found.`);
    }

    return {
      ...profile,
      user: this.toUserResponse(profile.user),
    };
  }

  async createProfile(dto: CreateClientProfileDto) {
    await this.ensureUserExists(dto.userId);

    const profile = await this.prisma.clientProfile.create({
      data: {
        userId: dto.userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        inn: dto.inn,
        contactPhone: dto.contactPhone,
        addressLine1: dto.addressLine1,
        city: dto.city,
        postalCode: dto.postalCode,
        comment: dto.comment,
        personalDiscountPercent: dto.personalDiscountPercent,
      },
      include: { user: true },
    });

    return {
      ...profile,
      user: this.toUserResponse(profile.user),
    };
  }

  async updateProfile(id: string, dto: UpdateClientProfileDto) {
    await this.ensureProfileExists(id);

    const profile = await this.prisma.clientProfile.update({
      where: { id },
      data: {
        userId: dto.userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        inn: dto.inn,
        contactPhone: dto.contactPhone,
        addressLine1: dto.addressLine1,
        city: dto.city,
        postalCode: dto.postalCode,
        comment: dto.comment,
        personalDiscountPercent: dto.personalDiscountPercent,
      },
      include: { user: true },
    });

    return {
      ...profile,
      user: this.toUserResponse(profile.user),
    };
  }

  async removeProfile(id: string) {
    await this.ensureProfileExists(id);
    await this.prisma.clientProfile.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureUserExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });

    if (!exists) {
      throw new NotFoundException(`User ${id} not found.`);
    }
  }

  private async ensureRegularUserExists(id: string) {
    const exists = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!exists || isClientListExcludedRole(exists.role)) {
      throw new NotFoundException(`User ${id} not found.`);
    }
  }

  private async ensureProfileExists(id: string) {
    const exists = await this.prisma.clientProfile.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Client profile ${id} not found.`);
    }
  }

  private async upsertUserClientProfile(
    userId: string,
    profileData: NonNullable<UpdateUserDto['clientProfile']>,
  ) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (profile) {
      await this.prisma.clientProfile.update({
        where: { id: profile.id },
        data: profileData,
      });
      return;
    }

    if (!profileData.firstName) {
      throw new BadRequestException('firstName is required when creating client profile.');
    }

    const { firstName, ...optionalProfileData } = profileData;

    await this.prisma.clientProfile.create({
      data: {
        userId,
        firstName,
        ...optionalProfileData,
      },
    });
  }

  private toUserResponse(
    user: Prisma.UserGetPayload<{ include: typeof userInclude }> | Prisma.UserGetPayload<{}>
  ) {
    const { passwordHash: _passwordHash, ...safeUser } = user as Prisma.UserGetPayload<{
      include: typeof userInclude;
    }>;
    return safeUser;
  }
}
