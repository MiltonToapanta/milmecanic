import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    return { message: 'Inicio de sesión correcto', data: await this.authService.login(dto, request.ip, request.get('user-agent')) };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return { message: 'Token renovado correctamente', data: await this.authService.refresh(dto.refreshToken, request.ip, request.get('user-agent')) };
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: Partial<RefreshTokenDto>, @CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    await this.authService.logout(user.id, dto.refreshToken, request.ip, request.get('user-agent'));
    return { message: 'Sesión cerrada correctamente' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.authService.me(user.id) };
  }
}
