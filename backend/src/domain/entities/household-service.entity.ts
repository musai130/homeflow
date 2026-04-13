import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CleaningOrder } from './cleaning-order.entity';
import { ServiceCategory } from './enums';
import { Subscription } from './subscription.entity';

@Entity({ name: 'household_services' })
export class HouseholdService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'base_price', default: 0 })
  basePrice!: string;

  @Column({ type: 'enum', enum: ServiceCategory, default: ServiceCategory.BASIC_CLEANING })
  category!: ServiceCategory;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @ManyToMany(() => Subscription, (subscription) => subscription.services)
  subscriptions!: Subscription[];

  @ManyToMany(() => CleaningOrder, (order) => order.services)
  orders!: CleaningOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
