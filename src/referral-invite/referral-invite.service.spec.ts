import { Test, TestingModule } from '@nestjs/testing';
import { ReferralInviteService } from './referral-invite.service';

describe('ReferralInviteService', () => {
  let service: ReferralInviteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReferralInviteService],
    }).compile();

    service = module.get<ReferralInviteService>(ReferralInviteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
