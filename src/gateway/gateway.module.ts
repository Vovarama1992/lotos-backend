import { Module } from '@nestjs/common';
import { SocketService } from './gateway.service';

@Module({
  imports: [],
  providers: [SocketService],
  exports: [SocketService],
})
export class GatewayModule {}
