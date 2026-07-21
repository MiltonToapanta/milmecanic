import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

const userSafeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  isActive: true,
  roleId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      rolePermissions: {
        where: { deletedAt: null },
        select: { permission: { select: { code: true } } }
      }
    }
  }
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: userSafeSelect,
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSafeSelect });
  }

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { deletedAt: null },
              include: { permission: true }
            }
          }
        }
      }
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, select: userSafeSelect });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, select: userSafeSelect });
  }
}
