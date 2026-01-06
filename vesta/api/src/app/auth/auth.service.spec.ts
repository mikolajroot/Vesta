import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Roles } from '../../generated/prisma/enums';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token for valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'Admin' as Roles,
      };
      const mockToken = 'jwt.token.here';

      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signIn('testuser', 'password123');

      expect(result).toEqual({ access_token: mockToken });
      expect(usersService.findOne).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
        role: 'Admin',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(service.signIn('nonexistent', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith('nonexistent');
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: "Admin" as Roles
      };

      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn('testuser', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });
  });

  describe('signUp', () => {
    it('should create user and return access token', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        password: 'hashedPassword',
        role: "Admin" as Roles
      };
      const mockToken = 'jwt.token.here';

      usersService.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      usersService.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signUp('newuser', 'password123',"Admin");

      expect(result).toEqual({ access_token: mockToken });
      expect(usersService.findOne).toHaveBeenCalledWith('newuser');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith('newuser', 'hashedPassword',"Admin");
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'newuser',
        role: 'Admin',
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      const mockUser = {
        id: 1,
        username: 'existinguser',
        password: 'hashedPassword',
        role: "Admin" as Roles
      };

      usersService.findOne.mockResolvedValue(mockUser);

      await expect(service.signUp('existinguser', 'password123',"Admin")).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith('existinguser');
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });
});
