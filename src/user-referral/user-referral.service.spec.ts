import { Test, TestingModule } from '@nestjs/testing';
import { UserReferralService } from './user-referral.service';

describe('UserReferralService', () => {
  let service: UserReferralService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserReferralService],
    }).compile();

    service = module.get<UserReferralService>(UserReferralService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
