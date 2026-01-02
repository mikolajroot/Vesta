import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

describe('RoomService', () => {
  let service: RoomService;
  const prismaMock = {
    rOOM: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<RoomService>(RoomService);
    jest.clearAllMocks();
  });

  it('creates a room with provided data', async () => {
    const dto: CreateRoomDto = { name: 'Room A' };
    prismaMock.rOOM.create.mockResolvedValue({ id: 1, ...dto });

    const result = await service.create(dto);

    expect(result).toEqual({ id: 1, ...dto });
    expect(prismaMock.rOOM.create).toHaveBeenCalledWith({ data: dto });
  });
});
