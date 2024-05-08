import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
