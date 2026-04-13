import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../domain/entities/enums';
import { AddCardDto } from './dto/add-card.dto';
import { UpdateBillingSettingsDto } from './dto/update-billing-settings.dto';
import { BillingService } from './billing.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('methods')
  methods(@Req() req: RequestWithUser) {
    return this.billingService.getMethods(req.user.sub);
  }

  @Post('methods')
  addCard(@Req() req: RequestWithUser, @Body() dto: AddCardDto) {
    return this.billingService.addCard(req.user.sub, dto);
  }

  @Get('records')
  records(@Req() req: RequestWithUser) {
    return this.billingService.getRecords(req.user.sub);
  }

  @Get('settings')
  settings(@Req() req: RequestWithUser) {
    return this.billingService.getSettings(req.user.sub);
  }

  @Patch('settings')
  updateSettings(@Req() req: RequestWithUser, @Body() dto: UpdateBillingSettingsDto) {
    return this.billingService.updateSettings(req.user.sub, dto);
  }
}
