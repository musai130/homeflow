import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cleaner } from '../domain/entities/cleaner.entity';
import { CleaningOrder } from '../domain/entities/cleaning-order.entity';
import { User } from '../users/user.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([CleaningOrder, Cleaner, User])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
