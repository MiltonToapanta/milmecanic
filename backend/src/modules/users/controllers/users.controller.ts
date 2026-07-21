import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.read')
  async findAll() {
    return { data: await this.usersService.findAll() };
  }

  @Get(':id')
  @Permissions('users.read')
  async findById(@Param('id') id: string) {
    return { data: await this.usersService.findById(id) };
  }

  @Post()
  @Permissions('users.create')
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Usuario creado correctamente', data: await this.usersService.create(dto, user.id) };
  }

  @Patch(':id')
  @Permissions('users.update')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Usuario actualizado correctamente', data: await this.usersService.update(id, dto, user.id) };
  }

  @Patch(':id/status')
  @Permissions('users.change-status')
  async changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Estado actualizado correctamente', data: await this.usersService.changeStatus(id, dto.isActive, user.id) };
  }

  @Patch(':id/password')
  @Permissions('users.change-password')
  async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Contraseña actualizada correctamente', data: await this.usersService.changePassword(id, dto.password, user.id) };
  }
}
