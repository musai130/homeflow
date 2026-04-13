import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { CleaningOrder } from './cleaning-order.entity';
import { SubscriptionFrequency, SubscriptionStatus } from './enums';
import { HouseholdService } from './household-service.entity';
import { Schedule } from './schedule.entity';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid', { name: 'subscription_id' })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: SubscriptionFrequency, default: SubscriptionFrequency.WEEKLY })
  frequency!: SubscriptionFrequency;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'price' })
  price!: string;

  @Column({ name: 'visits_per_month', type: 'int', nullable: true })
  visitsPerMonth?: number;

  @Column({ name: 'housing_type', nullable: true })
  housingType?: string;

  @Column({ type: 'int', nullable: true })
  area?: number;

  @Column({ name: 'preferred_time', nullable: true })
  preferredTime?: string;

  @Column({ name: 'same_cleaner', default: false })
  sameCleaner!: boolean;

  @Column({ name: 'priority_rooms', type: 'simple-array', nullable: true })
  priorityRooms?: string[];

  @Column({ name: 'extra_services', type: 'simple-array', nullable: true })
  extraServices?: string[];

  @Column({ type: 'text', nullable: true })
  wishes?: string;

  @OneToMany(() => Schedule, (schedule) => schedule.subscription)
  schedules!: Schedule[];

  @OneToMany(() => CleaningOrder, (order) => order.subscription)
  orders!: CleaningOrder[];

  @ManyToMany(() => HouseholdService, (service) => service.subscriptions)
  @JoinTable({
    name: 'subscription_services',
    joinColumn: { name: 'subscription_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services!: HouseholdService[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
