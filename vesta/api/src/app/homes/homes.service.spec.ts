import { Test, TestingModule } from '@nestjs/testing';
import { HomesService } from './homes.service';

describe('HomesService', () => {
  let service: HomesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomesService],
    }).compile();

    service = module.get<HomesService>(HomesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
