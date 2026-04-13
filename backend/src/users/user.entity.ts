import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Address } from '../domain/entities/address.entity';
import { CleaningOrder } from '../domain/entities/cleaning-order.entity';
import { UserRole, UserType } from '../domain/entities/enums';
import { Notification } from '../domain/entities/notification.entity';
import { Room } from '../domain/entities/room.entity';
import { Schedule } from '../domain/entities/schedule.entity';
import { Subscription } from '../domain/entities/subscription.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id!: string;

  @Column({ default: 'User' })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ name: 'housing_type', nullable: true })
  housingType?: string;

  @Column({ nullable: true })
  tariff?: string;

  @Column({
    type: 'enum',
    enum: UserType,
    name: 'user_type',
    default: UserType.YOUNG_PROFESSIONAL,
  })
  userType!: UserType;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ name: 'notifications_enabled', default: true })
  notificationsEnabled!: boolean;

  @Column({ name: 'push_reminders', default: true })
  pushReminders!: boolean;

  @Column({ name: 'push_payments', default: true })
  pushPayments!: boolean;

  @Column({ name: 'push_incidents', default: true })
  pushIncidents!: boolean;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];

  @OneToMany(() => CleaningOrder, (order) => order.user)
  orders!: CleaningOrder[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => Room, (room) => room.user)
  rooms!: Room[];

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules!: Schedule[];

  @OneToMany(() => Address, (address) => address.user)
  addresses!: Address[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
