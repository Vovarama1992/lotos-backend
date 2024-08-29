import { Test, TestingModule } from '@nestjs/testing';
import { VoyagerController } from './voyager.controller';
import { VoyagerService } from './voyager.service';

describe('VoyagerController', () => {
  let controller: VoyagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoyagerController],
      providers: [VoyagerService],
    }).compile();

    controller = module.get<VoyagerController>(VoyagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
