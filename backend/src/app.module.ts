import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { Address } from './domain/entities/address.entity';
import { Cleaner } from './domain/entities/cleaner.entity';
import { CleaningOrder } from './domain/entities/cleaning-order.entity';
import { Complaint } from './domain/entities/complaint.entity';
import { HouseholdService } from './domain/entities/household-service.entity';
import { Notification } from './domain/entities/notification.entity';
import { PhotoReport } from './domain/entities/photo-report.entity';
import { PaymentMethod } from './domain/entities/payment-method.entity';
import { PaymentRecord } from './domain/entities/payment-record.entity';
import { Room } from './domain/entities/room.entity';
import { Schedule } from './domain/entities/schedule.entity';
import { Subscription } from './domain/entities/subscription.entity';
import { OrdersModule } from './orders/orders.module';
import { SchedulesModule } from './schedules/schedules.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FeedbackModule } from './feedback/feedback.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'app'),
        entities: [
          User,
          Address,
          Subscription,
          CleaningOrder,
          Schedule,
          Cleaner,
          Notification,
          Room,
          HouseholdService,
          PhotoReport,
          PaymentMethod,
          PaymentRecord,
          Complaint,
        ],
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNC', 'false') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    SubscriptionsModule,
    OrdersModule,
    SchedulesModule,
    BillingModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
