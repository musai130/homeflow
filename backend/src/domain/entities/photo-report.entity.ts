import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CleaningOrder } from './cleaning-order.entity';

@Entity({ name: 'photo_reports' })
export class PhotoReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => CleaningOrder, (order) => order.photoReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: CleaningOrder;

  @Column()
  url!: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;
}
