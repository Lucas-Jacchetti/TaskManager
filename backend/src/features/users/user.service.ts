import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();
  }

  create(data: Pick<User, 'name' | 'email' | 'password'>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }
  
  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}