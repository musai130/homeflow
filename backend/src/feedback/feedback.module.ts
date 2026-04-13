import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from '../domain/entities/complaint.entity';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
