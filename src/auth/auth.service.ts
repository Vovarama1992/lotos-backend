import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { UserService } from '../user/user.service';
import { AccessTokenPayload, RefreshTokenPayload } from './type/jwtPayload';
import { UserRole } from 'src/constants';
import axios from 'axios';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService) { }

    createAccessToken({ userId, role }: AccessTokenPayload): string {
        return sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '7d',
        });
    }

    createRefreshToken({ userId }: RefreshTokenPayload): string {
        return sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '7d',
        });
    }

    assignTokens(userId: string, role: UserRole) {
        return {
            accessToken: this.createAccessToken({ userId, role }),
            refreshToken: this.createRefreshToken({ userId }),
        };
    }

    async refreshTokens(refreshToken: string) {
        const decodedRefreshToken = verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
        const user = await this.userService.findOneById(decodedRefreshToken.userId);
        if (!user) throw new Error('Please register or sign in.');
        const { id, role } = user;
        const tokens = await this.assignTokens(id, role);
        return {
            user,
            ...tokens,
        };
    }


    async sendCode(phone: string, code: number) {
        const url = 'https://api.iqsms.ru/messages/v2/send.json';
        const body = {
            "messages": [
                {
                    "phone": phone,
                    "clientId": "1",
                    "text": "Ваш код: " + code
                }
            ],
            "login": "esZekad0504",
            "password": "617404"
        }
        const response = await axios.post(url, body);
    }

}