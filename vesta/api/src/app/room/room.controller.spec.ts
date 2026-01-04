import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';

describe('RoomController', () => {
  let controller: RoomController;
  const roomServiceMock = {
    create: jest.fn(),
    getAllRooms: jest.fn(),
  } as unknown as RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [{ provide: RoomService, useValue: roomServiceMock }],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    jest.clearAllMocks();
  });

  it('delegates creation to service', async () => {
    const dto: CreateRoomDto = { name: 'Room B' };
    (roomServiceMock.create as jest.Mock).mockResolvedValue({ id: 2, ...dto });

    const result = await controller.create(dto);

    expect(result).toEqual({ id: 2, ...dto });
    expect(roomServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('should return all rooms', async () => {
    const mockRooms = [
      { id: 1, name: 'Room a', created_at: new Date(), type: null, floor: 0, area: 0.0 },
      { id: 2, name: 'Room b', created_at: new Date(), type: null, floor: 0, area: 0.0 },
    ];
    (roomServiceMock.getAllRooms as jest.Mock).mockResolvedValue(mockRooms);

    const result = await controller.getAllRooms();

    expect(result).toEqual(mockRooms);
    expect(roomServiceMock.getAllRooms).toHaveBeenCalled();
  });
});
