import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Record<string, unknown>> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    let user = await this.usersService.createWithPassword({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash,
      roles: [],
    });

    const requestedRoleNames = [
      ...(registerDto.roleNames ?? []),
      ...(registerDto.roleName ? [registerDto.roleName] : []),
    ];

    for (const roleName of requestedRoleNames) {
      user = await this.usersService.attachRole(user, roleName);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles?.map((role) => role.name) ?? [],
      },
      accessToken: await this.signToken(user.id, user.email),
      tokenType: 'Bearer',
    };
  }

  async login(loginDto: LoginDto): Promise<Record<string, string>> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: await this.signToken(user.id, user.email),
      tokenType: 'Bearer',
    };
  }

  private async signToken(userId: number, email: string): Promise<string> {
    const expiresIn = this.configService.get<string>('auth.jwtExpiresIn', '1d');

    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        expiresIn: expiresIn as any,
      },
    );
  }
}
