import { Injectable } from '@nestjs/common';

import { UsersRepository } from '../repositories/users.repository';

import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  findById(sub: string) {
      throw new Error('Method not implemented.');
  }
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Find user by phone number.
   *
   * This method is used by Auth module.
   *
   * Flow:
   *
   * AuthService
   *      |
   *      v
   * UsersService.findByPhone()
   *      |
   *      v
   * UsersRepository.findByPhone()
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }
}
