import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { RoomService } from './room.service';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

describe('RoomService', () => {
  let service: RoomService;
  const prismaMock = {
    room: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<RoomService>(RoomService);
    jest.clearAllMocks();
  });

  it('creates a room with capitalized name', async () => {
    const dto: CreateRoomDto = { name: 'rOOM a' };
    prismaMock.room.findUnique.mockResolvedValue(null);
    prismaMock.room.create.mockResolvedValue({ id: 1, name: 'Room a' });

    const result = await service.create(dto);

    expect(prismaMock.room.findUnique).toHaveBeenCalledWith({ where: { name: 'Room a' } });
    expect(prismaMock.room.create).toHaveBeenCalledWith({ data: { ...dto, name: 'Room a' } });
    expect(result).toEqual({ id: 1, name: 'Room a' });
  });

  it('throws ConflictException when room name already exists', async () => {
    const dto: CreateRoomDto = { name: 'Room A' };
    prismaMock.room.findUnique.mockResolvedValue({ id: 1, name: 'Room a' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it('should return all rooms', async () => {
    const mockRooms = [
      { id: 1, name: 'Room a', created_at: new Date(), type: null, floor: 0, area: 0.0 },
      { id: 2, name: 'Room b', created_at: new Date(), type: null, floor: 0, area: 0.0 },
    ];
    prismaMock.room.findMany.mockResolvedValue(mockRooms);

    const result = await service.getAllRooms();

    expect(prismaMock.room.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockRooms);
  });

  it('should return empty array when no rooms exist', async () => {
    prismaMock.room.findMany.mockResolvedValue([]);

    const result = await service.getAllRooms();

    expect(prismaMock.room.findMany).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
