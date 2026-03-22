import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto, UpdateUserDto, User } from '../entities/user.entity';

export interface UserSelectOption {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  isDeveloper: boolean;
  profilePictureUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async findAll(options?: {
    limit?: number;
    offset?: number;
    isDeveloper?: boolean;
  }): Promise<User[]> {
    const users = await this.userRepository.findAllUsers(options);
    return users as unknown as User[];
  }

  async findAllForContractSelect(options?: {
    limit?: number;
    offset?: number;
    isDeveloper?: boolean;
  }): Promise<UserSelectOption[]> {
    const users = await this.userRepository.findAllUsers(options);

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      isDeveloper: user.is_developer,
      profilePictureUrl: user.profile_picture_url,
    }));
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user as unknown as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log(email);
    const user = await this.userRepository.findByEmail(email);
    return user as unknown as User | null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.userRepository.findByUsername(username);
    return user as unknown as User | null;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.createUser(dto);
    return user as unknown as User;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const user = await this.userRepository.updateUser(id, dto);
    return user as unknown as User;
  }

  async delete(id: string): Promise<void> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepository.deleteUser(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }
}
