import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/user/user.module';
//import { MailModule } from 'src/mail/mail.module';
import { RedisService } from 'src/redis/redis.service';
@Module({
    imports: [forwardRef(() => UsersModule), /*MailModule*/],
    providers: [AuthService, RedisService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }