import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../domain/entities/enums';
import { RescheduleScheduleDto } from './dto/reschedule-schedule.dto';
import { SchedulesService } from './schedules.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('me')
  findMine(@Req() req: RequestWithUser) {
    return this.schedulesService.findMine(req.user.sub);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RescheduleScheduleDto,
  ) {
    return this.schedulesService.reschedule(req.user.sub, id, dto);
  }
}
