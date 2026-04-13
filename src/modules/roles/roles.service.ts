import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.rolesRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description ?? null,
    });

    return this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({
      where: {
        name,
      },
    });
  }
}
