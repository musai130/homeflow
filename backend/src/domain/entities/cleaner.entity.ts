import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CleaningOrder } from './cleaning-order.entity';
import { CleanerStatus } from './enums';

@Entity({ name: 'cleaners' })
export class Cleaner {
  @PrimaryGeneratedColumn('uuid', { name: 'cleaner_id' })
  id!: string;

  @Column({ name: 'user_id', unique: true, nullable: true })
  userId?: string;

  @Column({ name: 'name' })
  name!: string;

  @Column()
  phone!: string;

  @Column({ type: 'numeric', precision: 2, scale: 1, nullable: true })
  rating?: string;

  @Column({ type: 'enum', enum: CleanerStatus, default: CleanerStatus.AVAILABLE })
  status!: CleanerStatus;

  @OneToMany(() => CleaningOrder, (order) => order.cleaner)
  orders!: CleaningOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
