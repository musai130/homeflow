import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Cleaner } from '../domain/entities/cleaner.entity';
import { CleaningOrder } from '../domain/entities/cleaning-order.entity';
import { OrderStatus } from '../domain/entities/enums';
import { QuickBookDto } from './dto/quick-book.dto';
import { RescheduleOrderDto } from './dto/reschedule-order.dto';
import { UpdateCleanerNotesDto } from './dto/update-cleaner-notes.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(CleaningOrder)
    private readonly orderRepository: Repository<CleaningOrder>,
    @InjectRepository(Cleaner)
    private readonly cleanerRepository: Repository<Cleaner>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private async findOrCreateCleaner(userId: string): Promise<Cleaner> {
    let cleaner = await this.cleanerRepository.findOne({ where: { userId } });
    if (!cleaner) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      cleaner = this.cleanerRepository.create({
        userId,
        name: user.name,
        phone: user.phone ?? 'not-specified',
      });
      cleaner = await this.cleanerRepository.save(cleaner);
    }

    return cleaner;
  }

  async findAvailable() {
    const orders = await this.orderRepository.find({
      where: [
        { cleanerId: IsNull(), status: OrderStatus.SCHEDULED },
        { cleanerId: IsNull(), status: OrderStatus.RESCHEDULED },
      ],
      order: { scheduledDate: 'ASC' },
      relations: { user: true, subscription: true },
    });

    return orders.map((order) => ({
      ...order,
      customerName: order.user?.name ?? 'Без имени',
      address: order.user?.address ?? 'Адрес не указан',
      cleanerReward: Math.max(700, Math.round(Number(order.totalPrice || 0) * 0.7)),
      subscriptionPreferences: order.subscription
        ? {
            frequency: order.subscription.frequency,
            visitsPerMonth: order.subscription.visitsPerMonth,
            housingType: order.subscription.housingType,
            area: order.subscription.area,
            preferredTime: order.subscription.preferredTime,
            sameCleaner: order.subscription.sameCleaner,
            priorityRooms: order.subscription.priorityRooms ?? [],
            extraServices: order.subscription.extraServices ?? [],
            wishes: order.subscription.wishes,
          }
        : null,
    }));
  }

  async claim(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.cleanerId) throw new BadRequestException('Order already has cleaner');

    const cleaner = await this.findOrCreateCleaner(userId);

    order.cleanerId = cleaner.id;
    return this.orderRepository.save(order);
  }

  async findMine(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      order: { scheduledDate: 'ASC' },
      relations: { cleaner: true },
    });
  }

  async quickBook(userId: string, dto: QuickBookDto) {
    const order = this.orderRepository.create({
      userId,
      scheduledDate: new Date(dto.scheduledDate),
      status: OrderStatus.SCHEDULED,
      totalPrice: '0.00',
    });

    return this.orderRepository.save(order);
  }

  async findCleanerOrders(userId: string) {
    const cleaner = await this.findOrCreateCleaner(userId);
    const orders = await this.orderRepository.find({
      where: { cleanerId: cleaner.id },
      order: { scheduledDate: 'ASC' },
      relations: { user: true, subscription: true },
    });

    return orders.map((order) => ({
      ...order,
      customerName: order.user?.name ?? 'Без имени',
      address: order.user?.address ?? 'Адрес не указан',
      cleanerReward: Math.max(700, Math.round(Number(order.totalPrice || 0) * 0.7)),
      subscriptionPreferences: order.subscription
        ? {
            frequency: order.subscription.frequency,
            visitsPerMonth: order.subscription.visitsPerMonth,
            housingType: order.subscription.housingType,
            area: order.subscription.area,
            preferredTime: order.subscription.preferredTime,
            sameCleaner: order.subscription.sameCleaner,
            priorityRooms: order.subscription.priorityRooms ?? [],
            extraServices: order.subscription.extraServices ?? [],
            wishes: order.subscription.wishes,
          }
        : null,
    }));
  }

  async cleanerUpdateNotes(userId: string, id: string, dto: UpdateCleanerNotesDto) {
    const cleaner = await this.findOrCreateCleaner(userId);
    const order = await this.orderRepository.findOne({ where: { id, cleanerId: cleaner.id } });
    if (!order) throw new NotFoundException('Order not found');

    if (dto.cleanerCommentForCustomer !== undefined) {
      order.cleanerCommentForCustomer = dto.cleanerCommentForCustomer.trim();
    }
    if (dto.cleanerWorkDetails !== undefined) {
      order.cleanerWorkDetails = dto.cleanerWorkDetails.trim();
    }
    if (dto.cleanerUsedMaterials !== undefined) {
      order.cleanerUsedMaterials = dto.cleanerUsedMaterials.trim();
    }
    if (dto.cleanerRecommendations !== undefined) {
      order.cleanerRecommendations = dto.cleanerRecommendations.trim();
    }

    return this.orderRepository.save(order);
  }

  async cleanerStart(userId: string, id: string) {
    const cleaner = await this.findOrCreateCleaner(userId);
    const order = await this.orderRepository.findOne({ where: { id, cleanerId: cleaner.id } });
    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.IN_PROGRESS;
    order.startedAt = new Date();
    await this.orderRepository.save(order);
    return order;
  }

  async cleanerComplete(userId: string, id: string) {
    const cleaner = await this.findOrCreateCleaner(userId);
    const order = await this.orderRepository.findOne({ where: { id, cleanerId: cleaner.id } });
    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.AWAITING_CONFIRMATION;
    order.completedAt = new Date();
    if (order.startedAt) {
      order.durationSeconds = Math.max(
        0,
        Math.floor((order.completedAt.getTime() - order.startedAt.getTime()) / 1000),
      );
    }
    await this.orderRepository.save(order);
    return order;
  }

  async confirmCompletion(userId: string, id: string) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException('Order is not awaiting confirmation');
    }

    order.status = OrderStatus.COMPLETED;
    await this.orderRepository.save(order);
    return order;
  }

  async reschedule(userId: string, id: string, dto: RescheduleOrderDto) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');

    order.scheduledDate = new Date(dto.scheduledDate);
    order.status = OrderStatus.RESCHEDULED;
    await this.orderRepository.save(order);
    return order;
  }

  async start(userId: string, id: string) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.cleanerId) {
      throw new BadRequestException('Cleaner is not assigned for this order');
    }

    order.status = OrderStatus.IN_PROGRESS;
    order.startedAt = new Date();
    await this.orderRepository.save(order);
    return order;
  }

  async complete(userId: string, id: string) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    if (order.startedAt) {
      order.durationSeconds = Math.max(
        0,
        Math.floor((order.completedAt.getTime() - order.startedAt.getTime()) / 1000),
      );
    }
    await this.orderRepository.save(order);
    return order;
  }

  async remove(userId: string, id: string) {
    const order = await this.orderRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');

    await this.orderRepository.delete({ id, userId });
    return { success: true };
  }
}
