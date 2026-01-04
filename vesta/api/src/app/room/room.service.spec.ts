import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoomService } from './room.service';
import { PrismaService } from '../../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

describe('RoomService', () => {
  let service: RoomService;
  const prismaMock = {
    room: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
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

  it('updates room and capitalizes name', async () => {
    const dto: UpdateRoomDto = { name: 'kitchen', floor: 2 };
    prismaMock.room.findUnique
      .mockResolvedValueOnce({ id: 1, name: 'Living room' })
      .mockResolvedValueOnce(null);
    prismaMock.room.update.mockResolvedValue({ id: 1, name: 'Kitchen', floor: 2 });

    const result = await service.updateRoom(1, dto);

    expect(prismaMock.room.findUnique).toHaveBeenNthCalledWith(1, { where: { id: 1 } });
    expect(prismaMock.room.findUnique).toHaveBeenNthCalledWith(2, { where: { name: 'Kitchen' } });
    expect(prismaMock.room.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: 'Kitchen', floor: 2 } });
    expect(result).toEqual({ message: 'Room updated successfully' });
  });

  it('throws NotFoundException when updating missing room', async () => {
    prismaMock.room.findUnique.mockResolvedValueOnce(null);

    await expect(service.updateRoom(99, {})).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.room.update).not.toHaveBeenCalled();
  });

  it('throws ConflictException when updating to existing name', async () => {
    const dto: UpdateRoomDto = { name: 'Office' };
    prismaMock.room.findUnique
      .mockResolvedValueOnce({ id: 1, name: 'Living room' })
      .mockResolvedValueOnce({ id: 2, name: 'Office' });

    await expect(service.updateRoom(1, dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prismaMock.room.update).not.toHaveBeenCalled();
  });
});
