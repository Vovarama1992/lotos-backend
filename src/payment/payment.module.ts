import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CryptocloudService } from 'src/cryptocloud/cryptocloud.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, CryptocloudService],
})
export class PaymentModule {}
