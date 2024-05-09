import { Controller } from '@nestjs/common';
import { WithdrawHistoryService } from './withdraw-history.service';

@Controller('withdraw-history')
export class WithdrawHistoryController {
  constructor(private readonly withdrawHistoryService: WithdrawHistoryService) {}
}
