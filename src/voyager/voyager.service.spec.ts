import { Test, TestingModule } from '@nestjs/testing';
import { VoyagerService } from './voyager.service';

describe('VoyagerService', () => {
  let service: VoyagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoyagerService],
    }).compile();

    service = module.get<VoyagerService>(VoyagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
