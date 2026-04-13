import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../domain/entities/enums';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { FeedbackService } from './feedback.service';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('complaints')
  @Roles(UserRole.USER, UserRole.CLEANER, UserRole.ADMIN)
  createComplaint(@Req() req: RequestWithUser, @Body() dto: CreateComplaintDto) {
    return this.feedbackService.createComplaint(req.user.sub, dto);
  }

  @Get('complaints/me')
  @Roles(UserRole.USER, UserRole.CLEANER, UserRole.ADMIN)
  myComplaints(@Req() req: RequestWithUser) {
    return this.feedbackService.myComplaints(req.user.sub);
  }

  @Get('operator/complaints')
  @Roles(UserRole.ADMIN)
  operatorComplaints() {
    return this.feedbackService.operatorComplaints();
  }

  @Patch('operator/complaints/:id/resolve')
  @Roles(UserRole.ADMIN)
  resolveComplaint(@Param('id') id: string, @Body() dto: ResolveComplaintDto) {
    return this.feedbackService.resolveComplaint(id, dto);
  }
}
