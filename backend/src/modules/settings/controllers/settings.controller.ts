import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { UpdateWorkshopSettingDto } from '../dto/update-workshop-setting.dto';
import { SettingsService } from '../services/settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('settings.read')
  async getCurrent() {
    return { data: await this.settingsService.getCurrent() };
  }

  @Patch()
  @Permissions('settings.update')
  async update(@Body() dto: UpdateWorkshopSettingDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Configuración actualizada correctamente', data: await this.settingsService.update(dto, user.id) };
  }
}
