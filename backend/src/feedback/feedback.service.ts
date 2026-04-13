import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../domain/entities/complaint.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
  ) {}

  async createComplaint(userId: string, dto: CreateComplaintDto) {
    const complaint = this.complaintRepository.create({
      userId,
      stars: dto.stars,
      comment: dto.comment,
      status: dto.stars <= 2 ? 'new' : 'resolved',
    });

    return this.complaintRepository.save(complaint);
  }

  async myComplaints(userId: string) {
    return this.complaintRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async operatorComplaints() {
    return this.complaintRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async resolveComplaint(id: string, dto: ResolveComplaintDto) {
    const complaint = await this.complaintRepository.findOne({ where: { id } });
    if (!complaint) return { success: false };

    complaint.status = 'resolved';
    complaint.operatorComment = dto.comment?.trim() || complaint.operatorComment;
    await this.complaintRepository.save(complaint);
    return complaint;
  }
}
