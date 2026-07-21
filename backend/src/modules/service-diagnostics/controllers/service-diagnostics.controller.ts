import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../../common/interfaces/authenticated-user.interface";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Permissions } from "../../permissions/decorators/permissions.decorator";
import { PermissionsGuard } from "../../permissions/guards/permissions.guard";
import { CreateServiceDiagnosticDto } from "../dto/create-service-diagnostic.dto";
import {
  DiagnosticItemDto,
  UpdateDiagnosticItemDto,
} from "../dto/diagnostic-item.dto";
import { UpdateServiceDiagnosticDto } from "../dto/update-service-diagnostic.dto";
import { ServiceDiagnosticsService } from "../services/service-diagnostics.service";

@ApiTags("Service diagnostics")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceDiagnosticsController {
  constructor(
    private readonly serviceDiagnosticsService: ServiceDiagnosticsService,
  ) {}

  @Post("service-diagnostics")
  @Permissions("service-diagnostics.create")
  async create(
    @Body() dto: CreateServiceDiagnosticDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Diagnóstico técnico creado correctamente",
      data: await this.serviceDiagnosticsService.create(dto, user.id),
    };
  }

  @Get("service-diagnostics/:id")
  @Permissions("service-diagnostics.read")
  async findById(@Param("id") id: string) {
    return { data: await this.serviceDiagnosticsService.findById(id) };
  }

  @Get("service-orders/:serviceOrderId/diagnostic")
  @Permissions("service-diagnostics.read")
  async findByServiceOrderId(@Param("serviceOrderId") serviceOrderId: string) {
    return {
      data: await this.serviceDiagnosticsService.findByServiceOrderId(
        serviceOrderId,
      ),
    };
  }

  @Patch("service-diagnostics/:id")
  @Permissions("service-diagnostics.update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateServiceDiagnosticDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Diagnóstico técnico actualizado correctamente",
      data: await this.serviceDiagnosticsService.update(id, dto, user.id),
    };
  }

  @Patch("service-diagnostics/:id/complete")
  @Permissions("service-diagnostics.complete")
  async complete(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Diagnóstico técnico completado correctamente",
      data: await this.serviceDiagnosticsService.complete(id, user.id),
    };
  }

  @Delete("service-diagnostics/:id")
  @Permissions("service-diagnostics.delete")
  async softDelete(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Diagnóstico técnico eliminado correctamente",
      data: await this.serviceDiagnosticsService.softDelete(id, user.id),
    };
  }

  @Post("service-diagnostics/:id/items")
  @Permissions("service-diagnostics.update")
  async addItem(
    @Param("id") id: string,
    @Body() dto: DiagnosticItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Ítem agregado correctamente",
      data: await this.serviceDiagnosticsService.addItem(id, dto, user.id),
    };
  }

  @Patch("service-diagnostics/:id/items/:itemId")
  @Permissions("service-diagnostics.update")
  async updateItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateDiagnosticItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Ítem actualizado correctamente",
      data: await this.serviceDiagnosticsService.updateItem(
        id,
        itemId,
        dto,
        user.id,
      ),
    };
  }

  @Delete("service-diagnostics/:id/items/:itemId")
  @Permissions("service-diagnostics.update")
  async softDeleteItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: "Ítem eliminado correctamente",
      data: await this.serviceDiagnosticsService.softDeleteItem(
        id,
        itemId,
        user.id,
      ),
    };
  }
}
