import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningOrder } from '../domain/entities/cleaning-order.entity';
import { Schedule } from '../domain/entities/schedule.entity';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, CleaningOrder])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
