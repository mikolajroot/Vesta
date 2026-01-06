import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthController, AuthenticatedRequest } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
            signUp: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              return null;
            }),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call authService.signIn and return access token', async () => {
      const signInDto: SignInDto = {
        username: 'testuser',
        password: 'password123',
      };
      const mockResult = { access_token: 'jwt.token.here' };

      authService.signIn.mockResolvedValue(mockResult);

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(mockResult);
      expect(authService.signIn).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  describe('signUp', () => {
    it('should call authService.signUp and return access token', async () => {
      const signUpDto: SignUpDto = {
        username: 'newuser',
        password: 'password123',
        role: "Admin"
      };
      const mockResult = { access_token: 'jwt.token.here' };

      authService.signUp.mockResolvedValue(mockResult);

      const result = await controller.signUp(signUpDto);

      expect(result).toEqual(mockResult);
      expect(authService.signUp).toHaveBeenCalledWith('newuser', 'password123',"Admin");
    });
  });

  describe('getProfile', () => {
    it('should return user from request', () => {
      const mockRequest = {
        user: {
          sub: 1,
          username: 'testuser',
        },
      } as AuthenticatedRequest;

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockRequest.user);
    });
  });
});
