import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            users: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
      };

      prismaService.users.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('testuser');

      expect(result).toEqual(mockUser);
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user not found', async () => {
      prismaService.users.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        password: 'hashedPassword',
      };

      prismaService.users.create.mockResolvedValue(mockUser);

      const result = await service.create('newuser', 'hashedPassword');

      expect(result).toEqual(mockUser);
      expect(prismaService.users.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          password: 'hashedPassword',
        },
      });
    });
  });
});
