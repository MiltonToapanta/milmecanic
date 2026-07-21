import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RolesService } from '../services/roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles.read')
  async findAll() {
    return { data: await this.rolesService.findAll() };
  }
}
