import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../domain/entities/address.entity';
import { UserRole, UserType } from '../domain/entities/enums';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async getAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    if (dto.isPrimary) {
      await this.addressRepository.update({ userId }, { isPrimary: false });
    }

    const address = this.addressRepository.create({
      userId,
      value: dto.value,
      isPrimary: dto.isPrimary ?? false,
    });

    return this.addressRepository.save(address);
  }

  async removeAddress(userId: string, addressId: string): Promise<{ success: true }> {
    await this.addressRepository.delete({ id: addressId, userId });
    return { success: true };
  }

  async createUser(input: {
    name: string;
    email: string;
    phone?: string;
    userType: UserType;
    role: UserRole;
    passwordHash: string;
  }): Promise<User> {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }
}
