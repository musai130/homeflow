import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CleaningOrder } from '../domain/entities/cleaning-order.entity';
import { Schedule } from '../domain/entities/schedule.entity';
import { RescheduleScheduleDto } from './dto/reschedule-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(CleaningOrder)
    private readonly orderRepository: Repository<CleaningOrder>,
  ) {}

  async findMine(userId: string) {
    return this.scheduleRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async reschedule(userId: string, id: string, dto: RescheduleScheduleDto) {
    const schedule = await this.scheduleRepository.findOne({ where: { id, userId } });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const order = await this.orderRepository.findOne({ where: { scheduleId: id, userId } });
    if (order) {
      order.scheduledDate = new Date(dto.scheduledDate);
      await this.orderRepository.save(order);
    }

    return {
      scheduleId: schedule.id,
      scheduledDate: dto.scheduledDate,
      orderUpdated: Boolean(order),
    };
  }
}
