import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../../audit/services/audit.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService
  ) {}

  findAll() {
    return this.usersRepository.findAll();
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  findByEmailWithPassword(email: string) {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const existing = await this.usersRepository.findByEmailWithPassword(dto.email);
    if (existing) throw new ConflictException('Ya existe un usuario con este correo');

    const user = await this.usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 12),
      phone: dto.phone,
      role: { connect: { id: dto.roleId } },
      createdBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({ userId: actorId, action: 'create', module: 'users', entity: 'User', entityId: user.id, newValues: user });
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const oldUser = await this.findById(id);
    const user = await this.usersRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email?.toLowerCase(),
      phone: dto.phone,
      role: dto.roleId ? { connect: { id: dto.roleId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({ userId: actorId, action: 'update', module: 'users', entity: 'User', entityId: id, oldValues: oldUser, newValues: user });
    return user;
  }

  async changeStatus(id: string, isActive: boolean, actorId?: string) {
    const oldUser = await this.findById(id);
    const user = await this.usersRepository.update(id, { isActive, updatedBy: actorId ? { connect: { id: actorId } } : undefined });
    await this.auditService.log({ userId: actorId, action: 'change-status', module: 'users', entity: 'User', entityId: id, oldValues: oldUser, newValues: user });
    return user;
  }

  async changePassword(id: string, password: string, actorId?: string) {
    await this.findById(id);
    const user = await this.usersRepository.update(id, {
      passwordHash: await bcrypt.hash(password, 12),
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({ userId: actorId, action: 'change-password', module: 'users', entity: 'User', entityId: id });
    return user;
  }
}
