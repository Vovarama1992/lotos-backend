import { Global, Module } from '@nestjs/common';
import { SocketService } from './gateway.service';

@Global()
@Module({
  imports: [],
  providers: [SocketService],
  exports: [SocketService],
})
export class GatewayModule {}
