import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { createHash, randomInt } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { buildAuthCodeEmailTemplate } from '../mail/templates/auth-code-email.template';
import { isAdminUserRole } from './constants/auth.constants';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  AuthPrincipal,
  AuthTokenPayload,
  AuthenticatedAdmin,
  AuthenticatedUser,
} from './interfaces/auth-principal.interface';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
  ) {}

  private get brandName() {
    return process.env.MAIL_BRAND_NAME ?? 'Climatrade';
  }

  private get publicUrl() {
    return process.env.MAIL_PUBLIC_URL;
  }

  async loginUser(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { clientProfile: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid user credentials.');
    }

    const isValidPassword = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid user credentials.');
    }

    if (isAdminUserRole(user.role)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const principal: AuthenticatedAdmin = this.toAuthPrincipal(user) as AuthenticatedAdmin;

      return {
        accessToken: this.signAccessToken(principal),
        tokenType: 'Bearer',
        expiresIn: this.getJwtExpiresIn(),
        admin: this.toSafeAdmin(user),
      };
    }

    if (!user.emailVerifiedAt) {
      await this.ensureUserEmailVerification(user.id);
      return {
        requiresEmailVerification: true,
        email: user.email,
      };
    }

    await this.ensureUserLoginCode(user.id);

    return {
      requiresLoginCode: true,
      email: user.email,
    };
  }

  async loginAdmin(dto: LoginAdminDto) {
    const admin = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { clientProfile: true },
    });

    if (!admin || admin.status !== UserStatus.ACTIVE || !isAdminUserRole(admin.role)) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    const isValidPassword = await this.passwordService.verifyPassword(
      dto.password,
      admin.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    await this.prisma.user.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const principal: AuthenticatedAdmin = this.toAuthPrincipal(admin) as AuthenticatedAdmin;

    return {
      accessToken: this.signAccessToken(principal),
      tokenType: 'Bearer',
      expiresIn: this.getJwtExpiresIn(),
      admin: this.toSafeAdmin(admin),
    };
  }

  async getCurrentAdmin(adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.status !== UserStatus.ACTIVE || !isAdminUserRole(admin.role)) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    return this.toSafeAdmin(admin);
  }

  async registerUser(dto: RegisterUserDto) {
    const email = dto.email.trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (isAdminUserRole(existingUser.role)) {
        throw new BadRequestException(
          'User with this email already exists (admin account). Use another email.',
        );
      }

      if (existingUser.status !== UserStatus.ACTIVE) {
        throw new BadRequestException(
          'User with this email already exists (account is blocked). Contact support.',
        );
      }

      if (!existingUser.emailVerifiedAt) {
        const isValidPassword = await this.passwordService.verifyPassword(
          dto.password,
          existingUser.passwordHash,
        );

        if (!isValidPassword) {
          throw new BadRequestException('User with this email already exists.');
        }

        await this.ensureUserEmailVerification(existingUser.id);

        return {
          requiresEmailVerification: true,
          email,
        };
      }

      throw new BadRequestException('User with this email already exists.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const nameParts = dto.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() ?? dto.fullName.trim();
    const lastName = nameParts.length > 0 ? nameParts.join(' ') : undefined;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone: dto.phone ?? null,
        passwordHash,
        firstName,
        lastName,
        status: UserStatus.ACTIVE,
        role: UserRole.CLIENT,
        clientProfile: {
          create: {
            firstName,
            lastName,
            contactPhone: dto.phone ?? null,
          },
        },
      },
      include: { clientProfile: true },
    });

    await this.issueUserEmailVerification(user.id);

    return {
      requiresEmailVerification: true,
      email: user.email,
    };
  }

  async verifyUserEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { clientProfile: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid verification request.');
    }

    if (user.emailVerifiedAt) {
      const principal: AuthenticatedUser = this.toAuthPrincipal(user) as AuthenticatedUser;
      return {
        accessToken: this.signAccessToken(principal),
        tokenType: 'Bearer',
        expiresIn: this.getJwtExpiresIn(),
        user: this.toSafeUser(user),
      };
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
      throw new UnauthorizedException('Verification code is not requested.');
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Verification code has expired.');
    }

    const expected = user.emailVerificationCodeHash;
    const actual = this.hashVerificationCode(dto.email, dto.code);

    if (actual !== expected) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
      },
      include: { clientProfile: true },
    });

    const principal: AuthenticatedUser = this.toAuthPrincipal(verifiedUser) as AuthenticatedUser;

    return {
      accessToken: this.signAccessToken(principal),
      tokenType: 'Bearer',
      expiresIn: this.getJwtExpiresIn(),
      user: this.toSafeUser(verifiedUser),
    };
  }

  async resendUserEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      // Do not leak whether the email exists.
      return { ok: true };
    }

    if (user.emailVerifiedAt) {
      return { ok: true };
    }

    if (user.emailVerificationSentAt) {
      const elapsed = Date.now() - user.emailVerificationSentAt.getTime();
      if (elapsed < 60_000) {
        throw new BadRequestException('Verification code was sent recently. Please wait a bit.');
      }
    }

    await this.issueUserEmailVerification(user.id);
    return { ok: true };
  }

  async verifyUserLoginCode(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { clientProfile: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid verification request.');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email is not confirmed.');
    }

    if (!user.loginCodeHash || !user.loginCodeExpiresAt) {
      throw new UnauthorizedException('Login code is not requested.');
    }

    if (user.loginCodeExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Login code has expired.');
    }

    const expected = user.loginCodeHash;
    const actual = this.hashLoginCode(dto.email, dto.code);

    if (actual !== expected) {
      throw new UnauthorizedException('Invalid login code.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginCodeHash: null,
        loginCodeExpiresAt: null,
        lastLoginAt: new Date(),
      },
      include: { clientProfile: true },
    });

    const principal: AuthenticatedUser = this.toAuthPrincipal(updatedUser) as AuthenticatedUser;

    return {
      accessToken: this.signAccessToken(principal),
      tokenType: 'Bearer',
      expiresIn: this.getJwtExpiresIn(),
      user: this.toSafeUser(updatedUser),
    };
  }

  async resendUserLoginCode(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { ok: true };
    }

    if (!user.emailVerifiedAt) {
      return { ok: true };
    }

    if (user.loginCodeSentAt) {
      const elapsed = Date.now() - user.loginCodeSentAt.getTime();
      if (elapsed < 60_000) {
        throw new BadRequestException('Login code was sent recently. Please wait a bit.');
      }
    }

    await this.issueUserLoginCode(user.id);
    return { ok: true };
  }

  verifyAccessToken(token: string): AuthPrincipal {
    try {
      const payload = jwt.verify(token, this.getJwtSecret()) as AuthTokenPayload;

      if (!payload?.sub || !payload?.type || !payload?.role || !payload?.email) {
        throw new UnauthorizedException('Invalid access token.');
      }

      if (payload.type === 'user') {
        return {
          type: 'user',
          userId: payload.sub,
          role: payload.role as UserRole,
          email: payload.email,
        };
      }

        return {
          type: 'admin',
          adminId: payload.sub,
          role: payload.role as UserRole,
          email: payload.email,
        };
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  private signAccessToken(principal: AuthPrincipal) {
    const payload: AuthTokenPayload =
      principal.type === 'user'
        ? {
            sub: principal.userId,
            type: principal.type,
            role: principal.role,
            email: principal.email,
          }
        : {
            sub: principal.adminId,
            type: principal.type,
            role: principal.role,
            email: principal.email,
          };

    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: this.getJwtExpiresIn(),
    } as SignOptions);
  }

  private getJwtSecret() {
    return process.env.JWT_SECRET ?? 'vostokstroyexpert-dev-secret';
  }

  private getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN ?? '12h';
  }

  private get verificationSecret() {
    return process.env.EMAIL_VERIFICATION_SECRET ?? this.getJwtSecret();
  }

  private hashVerificationCode(email: string, code: string) {
    return createHash('sha256')
      .update(`${email.toLowerCase()}|${code}|${this.verificationSecret}`)
      .digest('hex');
  }

  private get loginCodeSecret() {
    return process.env.LOGIN_CODE_SECRET ?? this.getJwtSecret();
  }

  private hashLoginCode(email: string, code: string) {
    return createHash('sha256')
      .update(`${email.toLowerCase()}|${code}|${this.loginCodeSecret}`)
      .digest('hex');
  }

  private async ensureUserEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        emailVerificationCodeHash: true,
        emailVerificationExpiresAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.emailVerifiedAt) {
      return;
    }

    if (user.emailVerificationCodeHash && user.emailVerificationExpiresAt) {
      if (user.emailVerificationExpiresAt.getTime() > Date.now()) {
        return;
      }
    }

    await this.issueUserEmailVerification(userId);
  }

  private async ensureUserLoginCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        loginCodeHash: true,
        loginCodeExpiresAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!user.emailVerifiedAt) {
      return;
    }

    if (user.loginCodeHash && user.loginCodeExpiresAt) {
      if (user.loginCodeExpiresAt.getTime() > Date.now()) {
        return;
      }
    }

    await this.issueUserLoginCode(userId);
  }

  private async issueUserEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.emailVerifiedAt) {
      return;
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    const sentAt = new Date();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCodeHash: this.hashVerificationCode(user.email, code),
        emailVerificationExpiresAt: expiresAt,
        emailVerificationSentAt: sentAt,
      },
    });

    try {
      const template = buildAuthCodeEmailTemplate({
        purpose: 'email_verification',
        code,
        expiresMinutes: 10,
        brandName: this.brandName,
        publicUrl: this.publicUrl,
      });

      await this.mailService.sendMail({
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch {
      throw new ServiceUnavailableException('Failed to send verification email.');
    }
  }

  private async issueUserLoginCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!user.emailVerifiedAt) {
      return;
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    const sentAt = new Date();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        loginCodeHash: this.hashLoginCode(user.email, code),
        loginCodeExpiresAt: expiresAt,
        loginCodeSentAt: sentAt,
      },
    });

    try {
      const template = buildAuthCodeEmailTemplate({
        purpose: 'login_code',
        code,
        expiresMinutes: 10,
        brandName: this.brandName,
        publicUrl: this.publicUrl,
      });

      await this.mailService.sendMail({
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch {
      throw new ServiceUnavailableException('Failed to send login code email.');
    }
  }

  private toAuthPrincipal(user: {
    id: string;
    email: string;
    role: UserRole;
  }): AuthPrincipal {
    if (isAdminUserRole(user.role)) {
      return {
        type: 'admin',
        adminId: user.id,
        role: user.role,
        email: user.email,
      };
    }

    return {
      type: 'user',
      userId: user.id,
      role: user.role,
      email: user.email,
    };
  }

  private toSafeUser<T extends { passwordHash: string }>(user: T) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private toSafeAdmin<T extends { passwordHash: string }>(admin: T) {
    const { passwordHash: _passwordHash, ...safeAdmin } = admin;
    return safeAdmin;
  }
}
