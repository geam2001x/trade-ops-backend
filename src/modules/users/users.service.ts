import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

type UserCreateInput = {
  name: string;
  email: string;
  passwordHash: string;
  isActive?: boolean;
  roles?: Role[];
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const roleNames = createUserDto.roleNames ?? [];
    const roles = await Promise.all(
      roleNames.map((roleName) => this.rolesService.findByName(roleName)),
    );

    return this.createWithPassword({
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash: createUserDto.password,
      isActive: createUserDto.isActive,
      roles: roles.filter((role): role is Role => Boolean(role)),
    });
  }

  async createWithPassword(input: UserCreateInput): Promise<User> {
    const user = this.usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      isActive: input.isActive ?? true,
      roles: input.roles ?? [],
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :email', { email })
      .getOne();
  }

  async attachRole(user: User, roleName: string): Promise<User> {
    const role = await this.rolesService.findByName(roleName);
    if (!role) {
      return user;
    }

    const currentRoles = user.roles ?? [];
    const hasRole = currentRoles.some((currentRole) => currentRole.id === role.id);
    if (hasRole) {
      return user;
    }

    user.roles = [...currentRoles, role];
    return this.usersRepository.save(user);
  }
}
