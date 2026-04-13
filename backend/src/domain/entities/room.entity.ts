import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { CleaningOrder } from './cleaning-order.entity';
import { RoomType } from './enums';

@Entity({ name: 'rooms' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.OTHER })
  type!: RoomType;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'area_sq_m', nullable: true })
  areaSqM?: string;

  @Column({ nullable: true })
  notes?: string;

  @ManyToMany(() => CleaningOrder, (order) => order.rooms)
  orders!: CleaningOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
