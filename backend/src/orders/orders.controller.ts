import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../domain/entities/enums';
import { OrdersService } from './orders.service';
import { QuickBookDto } from './dto/quick-book.dto';
import { RescheduleOrderDto } from './dto/reschedule-order.dto';
import { UpdateCleanerNotesDto } from './dto/update-cleaner-notes.dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('available')
  @Roles(UserRole.CLEANER, UserRole.ADMIN)
  findAvailable() {
    return this.ordersService.findAvailable();
  }

  @Patch(':id/claim')
  @Roles(UserRole.CLEANER, UserRole.ADMIN)
  claim(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.claim(req.user.sub, id);
  }

  @Get('cleaner/me')
  @Roles(UserRole.CLEANER, UserRole.ADMIN)
  findCleanerMine(@Req() req: RequestWithUser) {
    return this.ordersService.findCleanerOrders(req.user.sub);
  }

  @Patch(':id/cleaner/start')
  @Roles(UserRole.CLEANER, UserRole.ADMIN)
  cleanerStart(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.cleanerStart(req.user.sub, id);
  }

  @Patch(':id/cleaner/complete')
  @Roles(UserRole.CLEANER, UserRole.ADMIN)
  cleanerComplete(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.cleanerComplete(req.user.sub, id);
  }

  @Patch(':id/cleaner/notes')
  @Roles(UserRole.CLEANER, UserRole.ADMIN)
  cleanerUpdateNotes(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCleanerNotesDto,
  ) {
    return this.ordersService.cleanerUpdateNotes(req.user.sub, id, dto);
  }

  @Patch('quick-book')
  @Roles(UserRole.USER, UserRole.ADMIN)
  quickBook(@Req() req: RequestWithUser, @Body() dto: QuickBookDto) {
    return this.ordersService.quickBook(req.user.sub, dto);
  }

  @Get('me')
  @Roles(UserRole.USER, UserRole.ADMIN)
  findMine(@Req() req: RequestWithUser) {
    return this.ordersService.findMine(req.user.sub);
  }

  @Patch(':id/reschedule')
  @Roles(UserRole.USER, UserRole.ADMIN)
  reschedule(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RescheduleOrderDto,
  ) {
    return this.ordersService.reschedule(req.user.sub, id, dto);
  }

  @Patch(':id/start')
  @Roles(UserRole.USER, UserRole.ADMIN)
  start(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.start(req.user.sub, id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.USER, UserRole.ADMIN)
  complete(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.complete(req.user.sub, id);
  }

  @Patch(':id/confirm-completion')
  @Roles(UserRole.USER, UserRole.ADMIN)
  confirmCompletion(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.confirmCompletion(req.user.sub, id);
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.remove(req.user.sub, id);
  }
}
