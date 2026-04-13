import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from '../domain/entities/payment-method.entity';
import { PaymentRecord } from '../domain/entities/payment-record.entity';
import { User } from '../users/user.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod, PaymentRecord, User])],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
