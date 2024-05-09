import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawHistoryController } from './withdraw-history.controller';
import { WithdrawHistoryService } from './withdraw-history.service';

describe('WithdrawHistoryController', () => {
  let controller: WithdrawHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawHistoryController],
      providers: [WithdrawHistoryService],
    }).compile();

    controller = module.get<WithdrawHistoryController>(WithdrawHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
