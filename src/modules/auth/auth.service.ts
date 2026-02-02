import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive.');
    }

    let passwordValid = false;
    try {
      passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    } catch {
      passwordValid = false;
    }
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive.');
    }

    let validOldPassword = false;
    try {
      validOldPassword = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    } catch {
      validOldPassword = false;
    }

    if (!validOldPassword) {
      throw new BadRequestException('Old password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
      },
    });

    return { message: 'Password updated successfully' };
  }

  toSafeUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string | null;
    isActive: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };
  }
}
