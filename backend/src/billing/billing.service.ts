import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../domain/entities/payment-method.entity';
import { PaymentRecord } from '../domain/entities/payment-record.entity';
import { User } from '../users/user.entity';
import { AddCardDto } from './dto/add-card.dto';
import { UpdateBillingSettingsDto } from './dto/update-billing-settings.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getMethods(userId: string) {
    return this.paymentMethodRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async addCard(userId: string, dto: AddCardDto) {
    const normalized = dto.number.replace(/\s+/g, '');
    const masked = `•••• ${normalized.slice(-4)}`;

    const method = this.paymentMethodRepository.create({
      userId,
      maskedNumber: masked,
      holder: dto.holder,
      expire: dto.expire,
    });

    return this.paymentMethodRepository.save(method);
  }

  async getRecords(userId: string) {
    const records = await this.paymentRecordRepository.find({
      where: { userId },
      order: { chargedAt: 'DESC' },
    });

    if (records.length > 0) return records;

    const seed = this.paymentRecordRepository.create([
      { userId, month: 'Апрель', amount: '13900.00', chargedAt: new Date('2026-04-01T09:00:00Z') },
      { userId, month: 'Март', amount: '13900.00', chargedAt: new Date('2026-03-01T09:00:00Z') },
      { userId, month: 'Февраль', amount: '13900.00', chargedAt: new Date('2026-02-01T09:00:00Z') },
    ]);

    return this.paymentRecordRepository.save(seed);
  }

  async getSettings(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return {
      autoPay: user?.notificationsEnabled ?? true,
      emailReceipts: user?.pushPayments ?? true,
      nextPaymentDate: '2026-05-01',
    };
  }

  async updateSettings(userId: string, dto: UpdateBillingSettingsDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return this.getSettings(userId);

    if (dto.autoPay !== undefined) user.notificationsEnabled = dto.autoPay;
    if (dto.emailReceipts !== undefined) user.pushPayments = dto.emailReceipts;
    await this.usersRepository.save(user);

    return this.getSettings(userId);
  }
}
