import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { CleaningOrder } from './cleaning-order.entity';
import { Subscription } from './subscription.entity';

@Entity({ name: 'schedules' })
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'subscription_id' })
  subscriptionId!: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @Column({ name: 'day_of_week', type: 'smallint', nullable: true })
  dayOfWeek?: number;

  @Column({ name: 'start_time', length: 5, nullable: true })
  startTime?: string;

  @Column({ default: 'UTC' })
  timezone!: string;

  @Column({ name: 'recurrence_rule', nullable: true })
  recurrenceRule?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToOne(() => CleaningOrder, (order) => order.schedule)
  order?: CleaningOrder;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
