import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthenticationService } from './authentication.service';
import { LoginDto, SignupDto } from './dto/authentication.dto';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userRepository: any;
  let jwtService: any;
  let mailService: any;

  const loginDto: LoginDto = {
    email: 'user@example.com',
    password: 'PlainPassword123!',
  };

  beforeEach(() => {
    userRepository = {
      createOne: jest.fn(async () => ({
        email: 'user@example.com',
        role: 'USER',
        toJSON: () => ({
          email: 'user@example.com',
          role: 'USER',
        }),
      })) as jest.Mock,
      findOne: jest.fn(async () => ({
        email: 'user@example.com',
        role: 'USER',
        toJSON: () => ({
          email: 'user@example.com',
          role: 'USER',
        }),
      })) as jest.Mock,
      updateOne: jest.fn(async () => ({})) as jest.Mock,
    };

    jwtService = {
      sign: jest.fn(() => 'signed-token') as jest.Mock,
      verify: jest.fn(() => ({
        sub: 'user@example.com',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      })) as jest.Mock,
    };

    mailService = {
      sendConfirmEmail: jest.fn(async () => undefined) as jest.Mock,
      sendForgotPassword: jest.fn(async () => undefined) as jest.Mock,
    };

    service = new AuthenticationService(
      userRepository as any,
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string | number> = {
            ACCESS_EXPIRES_IN: 1800,
            REFRESH_EXPIRES_IN: 31536000,
            User_TOKEN_SECRET_KEY: 'user-token-secret-key',
            User_REFRESH_TOKEN_SECRET_KEY: 'user-refresh-secret-key',
          };

          return values[key];
        }),
      } as any,
      {
        createToken: jest.fn(({ tokenType }: { tokenType: string }) => {
          return `${tokenType}-token`;
        }),
      } as any,
      jwtService,
      mailService,
    );
  });

  it('signup should pass a plain password to the repository and let the schema hook hash it once', async () => {
    const dto: SignupDto = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'John Doe',
      email: 'user@example.com',
      password: 'PlainPassword123!',
      confirmPassword: 'PlainPassword123!',
      phone: '1234567890',
    };

    await service.signup(dto);

    expect(userRepository.createOne).toHaveBeenCalledWith({
      data: expect.objectContaining({
        password: dto.password,
      }),
    });
  });

  it('login should return signed access and refresh tokens when credentials are valid', async () => {
    const hashedPassword = await bcrypt.hash(loginDto.password, 10);

    userRepository.findOne.mockResolvedValue({
      email: loginDto.email,
      role: 'USER',
      password: hashedPassword,
      toJSON: () => ({
        email: loginDto.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      }),
    });

    const result = await service.login(loginDto);

    expect(result).toEqual(
      expect.objectContaining({
        message: 'Login successful',
        data: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      }),
    );
  });

  it('login should throw UnauthorizedException when the user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.login(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login should throw UnauthorizedException when the password does not match', async () => {
    userRepository.findOne.mockResolvedValue({
      password: await bcrypt.hash('wrong-password', 10),
      toJSON: () => ({
        email: loginDto.email,
        firstName: 'John',
        lastName: 'Doe',
      }),
    });

    await expect(service.login(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
