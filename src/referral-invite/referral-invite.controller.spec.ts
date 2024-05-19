import { Test, TestingModule } from '@nestjs/testing';
import { ReferralInviteController } from './referral-invite.controller';
import { ReferralInviteService } from './referral-invite.service';

describe('ReferralInviteController', () => {
  let controller: ReferralInviteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralInviteController],
      providers: [ReferralInviteService],
    }).compile();

    controller = module.get<ReferralInviteController>(ReferralInviteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
