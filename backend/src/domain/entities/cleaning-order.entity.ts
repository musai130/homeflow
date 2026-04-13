import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Cleaner } from './cleaner.entity';
import { OrderStatus } from './enums';
import { HouseholdService } from './household-service.entity';
import { PhotoReport } from './photo-report.entity';
import { Room } from './room.entity';
import { Schedule } from './schedule.entity';
import { Subscription } from './subscription.entity';

@Entity({ name: 'cleaning_orders' })
export class CleaningOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: Subscription;

  @Column({ name: 'cleaner_id', nullable: true })
  cleanerId?: string;

  @ManyToOne(() => Cleaner, (cleaner) => cleaner.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cleaner_id' })
  cleaner?: Cleaner;

  @Column({ name: 'schedule_id', nullable: true, unique: true })
  scheduleId?: string;

  @OneToOne(() => Schedule, (schedule) => schedule.order, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule?: Schedule;

  @Column({ name: 'scheduled_date', type: 'timestamptz' })
  scheduledDate!: Date;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.SCHEDULED })
  status!: OrderStatus;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'cleaner_comment_for_customer', type: 'text', nullable: true })
  cleanerCommentForCustomer?: string;

  @Column({ name: 'cleaner_work_details', type: 'text', nullable: true })
  cleanerWorkDetails?: string;

  @Column({ name: 'cleaner_used_materials', type: 'text', nullable: true })
  cleanerUsedMaterials?: string;

  @Column({ name: 'cleaner_recommendations', type: 'text', nullable: true })
  cleanerRecommendations?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'total_price', default: 0 })
  totalPrice!: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds?: number;

  @ManyToMany(() => HouseholdService, (service) => service.orders)
  @JoinTable({
    name: 'order_services',
    joinColumn: { name: 'order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services!: HouseholdService[];

  @ManyToMany(() => Room, (room) => room.orders)
  @JoinTable({
    name: 'order_rooms',
    joinColumn: { name: 'order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'room_id', referencedColumnName: 'id' },
  })
  rooms!: Room[];

  @OneToMany(() => PhotoReport, (photoReport) => photoReport.order)
  photoReports!: PhotoReport[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
