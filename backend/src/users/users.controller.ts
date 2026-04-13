import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../domain/entities/enums';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.CLEANER, UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: RequestWithUser) {
    return this.usersService.findById(req.user.sub);
  }

  @Patch('me')
  updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @Get('me/addresses')
  addresses(@Req() req: RequestWithUser) {
    return this.usersService.getAddresses(req.user.sub);
  }

  @Post('me/addresses')
  addAddress(@Req() req: RequestWithUser, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(req.user.sub, dto);
  }

  @Delete('me/addresses/:id')
  removeAddress(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.removeAddress(req.user.sub, id);
  }
}
