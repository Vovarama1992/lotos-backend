import { verify } from 'jsonwebtoken';
import { NestMiddleware, Injectable, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from 'src/user/user.service';
import { AccessTokenPayload } from '../type/jwtPayload';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: Request | any, res: Response, next: () => void) {
    const bearerHeader = req.headers.authorization;
    const accessToken = bearerHeader && bearerHeader.split(' ')[1];
    let user;

    if (!bearerHeader || !accessToken) {
      return next();
    }

    try {
      const { userId: id, role }: AccessTokenPayload = verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
      );
      user = await this.userService.findOneById(id);   
    } catch (error) {
      throw new ForbiddenException('Please register or sign in.');
    }

    if (user) {
      req.user = user;
    }
    next();
  }
}