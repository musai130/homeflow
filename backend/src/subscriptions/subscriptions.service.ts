import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CleaningOrder } from '../domain/entities/cleaning-order.entity';
import { OrderStatus, SubscriptionFrequency } from '../domain/entities/enums';
import { Schedule } from '../domain/entities/schedule.entity';
import { Subscription } from '../domain/entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(CleaningOrder)
    private readonly orderRepository: Repository<CleaningOrder>,
  ) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    const subscription = this.subscriptionRepository.create({
      userId,
      frequency: dto.frequency,
      startDate: dto.startDate,
      price: dto.price.toFixed(2),
      visitsPerMonth: dto.visitsPerMonth,
      housingType: dto.housingType,
      area: dto.area,
      preferredTime: dto.preferredTime,
      sameCleaner: dto.sameCleaner ?? false,
      priorityRooms: dto.priorityRooms,
      extraServices: dto.extraServices,
      wishes: dto.wishes,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    await this.generateScheduleAndOrders(saved.id, userId, dto.frequency, dto.startDate, dto.price, dto.visitsPerMonth);

    return this.findOneForUser(saved.id, userId);
  }

  async findMine(userId: string) {
    return this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, userId: string, dto: UpdateSubscriptionStatusDto) {
    const subscription = await this.subscriptionRepository.findOne({ where: { id, userId } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = dto.status;
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  private async findOneForUser(id: string, userId: string) {
    const subscription = await this.subscriptionRepository.findOne({ where: { id, userId } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  private intervalDaysByFrequency(frequency: SubscriptionFrequency): number {
    if (frequency === SubscriptionFrequency.WEEKLY) return 7;
    if (frequency === SubscriptionFrequency.BIWEEKLY) return 14;
    if (frequency === SubscriptionFrequency.MONTHLY) return 30;
    return 10;
  }

  private occurrencesByFrequency(frequency: SubscriptionFrequency, visitsPerMonth?: number): number {
    if (visitsPerMonth && visitsPerMonth > 0) return Math.min(visitsPerMonth, 8);
    if (frequency === SubscriptionFrequency.WEEKLY) return 4;
    if (frequency === SubscriptionFrequency.BIWEEKLY) return 2;
    if (frequency === SubscriptionFrequency.MONTHLY) return 1;
    return 3;
  }

  private async generateScheduleAndOrders(
    subscriptionId: string,
    userId: string,
    frequency: SubscriptionFrequency,
    startDate: string,
    price: number,
    visitsPerMonth?: number,
  ) {
    const baseDate = new Date(startDate);
    const intervalDays = this.intervalDaysByFrequency(frequency);
    const occurrences = this.occurrencesByFrequency(frequency, visitsPerMonth);

    for (let i = 0; i < occurrences; i += 1) {
      const visitDate = new Date(baseDate);
      visitDate.setUTCDate(baseDate.getUTCDate() + i * intervalDays);

      const schedule = this.scheduleRepository.create({
        userId,
        subscriptionId,
        recurrenceRule: `FREQ=${frequency.toUpperCase()}`,
        timezone: 'UTC',
      });
      const savedSchedule = await this.scheduleRepository.save(schedule);

      const order = this.orderRepository.create({
        userId,
        subscriptionId,
        scheduleId: savedSchedule.id,
        scheduledDate: visitDate,
        status: OrderStatus.SCHEDULED,
        totalPrice: price.toFixed(2),
      });
      await this.orderRepository.save(order);
    }
  }
}
