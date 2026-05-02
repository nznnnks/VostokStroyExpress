import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

import { PasswordService } from '../src/auth/password.service';

export type CreateManagerInput = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  status?: UserStatus;
};

const DEFAULT_MANAGER: Required<Omit<CreateManagerInput, 'phone'>> & { phone: null } = {
  email: 'manager@vostok.local',
  password: 'Manager12345!',
  firstName: 'Default',
  lastName: 'Manager',
  phone: null,
  status: UserStatus.ACTIVE,
};

function resolveInput(input: CreateManagerInput = {}): Required<CreateManagerInput> {
  return {
    email: input.email ?? process.env.MANAGER_EMAIL ?? DEFAULT_MANAGER.email,
    password: input.password ?? process.env.MANAGER_PASSWORD ?? DEFAULT_MANAGER.password,
    firstName: input.firstName ?? process.env.MANAGER_FIRST_NAME ?? DEFAULT_MANAGER.firstName,
    lastName: input.lastName ?? process.env.MANAGER_LAST_NAME ?? DEFAULT_MANAGER.lastName,
    phone: input.phone ?? process.env.MANAGER_PHONE ?? DEFAULT_MANAGER.phone,
    status: input.status ?? UserStatus.ACTIVE,
  };
}

export async function createManagerUser(input: CreateManagerInput = {}) {
  const prisma = new PrismaClient();
  const passwordService = new PasswordService();
  const payload = resolveInput(input);

  try {
    const passwordHash = await passwordService.preparePasswordHash(payload.password);

    const manager = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        phone: payload.phone,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: UserRole.MANAGER,
        status: payload.status,
        passwordHash,
      },
      create: {
        email: payload.email,
        phone: payload.phone,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: UserRole.MANAGER,
        status: payload.status,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    return {
      ...manager,
      password: payload.password,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const before = new PrismaClient();

  try {
    const payload = resolveInput();
    const existing = await before.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });

    const result = await createManagerUser(payload);
    console.log(`[manager:create] ${existing ? 'updated' : 'created'} manager user`);
    console.log(`email: ${result.email}`);
    console.log(`password: ${result.password}`);
    console.log(`role: ${result.role}`);
    console.log(`status: ${result.status}`);
  } finally {
    await before.$disconnect();
  }
}

void main().catch((error) => {
  console.error('[manager:create] failed', error);
  process.exitCode = 1;
});

