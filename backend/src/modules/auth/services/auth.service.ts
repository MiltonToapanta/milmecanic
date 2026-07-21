import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { TokenPayload } from '../interfaces/token-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const isValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !isValid || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.createTokens({ sub: user.id, email: user.email, roleId: user.roleId }, ipAddress, userAgent);
    await this.auditService.log({ userId: user.id, action: 'login', module: 'auth', entity: 'User', entityId: user.id, ipAddress, userAgent });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: { id: user.role.id, name: user.role.name },
        permissions: user.role.rolePermissions.map((rolePermission) => rolePermission.permission.code)
      },
      ...tokens
    };
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    const payload = await this.jwtService.verifyAsync<TokenPayload & { jti: string }>(refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
    });
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, deletedAt: null, expiresAt: { gt: new Date() } }
    });
    const storedToken = await this.findMatchingRefreshToken(storedTokens, refreshToken);
    if (!storedToken) throw new UnauthorizedException('Sesión expirada');

    const tokens = await this.createTokens({ sub: payload.sub, email: payload.email, roleId: payload.roleId }, ipAddress, userAgent);
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date(), replacedBy: tokens.refreshTokenId }
    });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(userId: string, refreshToken?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    if (refreshToken) {
      const storedTokens = await this.prisma.refreshToken.findMany({ where: { userId, revokedAt: null, deletedAt: null } });
      const storedToken = await this.findMatchingRefreshToken(storedTokens, refreshToken);
      if (storedToken) {
        await this.prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });
      }
    } else {
      await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await this.auditService.log({ userId, action: 'logout', module: 'auth', entity: 'User', entityId: userId, ipAddress, userAgent });
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    return {
      ...user,
      permissions: user.role.rolePermissions.map((rolePermission) => rolePermission.permission.code)
    };
  }

  private async createTokens(payload: TokenPayload, ipAddress?: string, userAgent?: string): Promise<AuthTokens & { refreshTokenId: string }> {
    const refreshJti = randomUUID();
    const accessExpiresIn = this.configService.getOrThrow<JwtSignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN');
    const refreshExpiresIn = this.configService.getOrThrow<JwtSignOptions['expiresIn']>('JWT_REFRESH_EXPIRES_IN');
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn
    });
    const refreshToken = await this.jwtService.signAsync({ ...payload, jti: refreshJti }, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn
    });
    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: await bcrypt.hash(refreshToken, 12),
        expiresAt: new Date(Date.now() + parseExpirationMs(refreshExpiresIn)),
        ipAddress,
        userAgent
      }
    });
    return { accessToken, refreshToken, refreshTokenId: refreshTokenRecord.id };
  }

  private async findMatchingRefreshToken(tokens: Prisma.RefreshTokenGetPayload<object>[], refreshToken: string) {
    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) return token;
    }
    return null;
  }
}

function parseExpirationMs(value: JwtSignOptions['expiresIn']): number {
  if (!value) return 7 * 24 * 60 * 60 * 1000;
  if (typeof value === 'number') return value * 1000;
  const match = /^(\d+)(ms|s|m|h|d)$/u.exec(value);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return amount * multipliers[unit];
}
