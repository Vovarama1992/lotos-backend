import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawHistoryService } from './withdraw-history.service';

describe('WithdrawHistoryService', () => {
  let service: WithdrawHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithdrawHistoryService],
    }).compile();

    service = module.get<WithdrawHistoryService>(WithdrawHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
