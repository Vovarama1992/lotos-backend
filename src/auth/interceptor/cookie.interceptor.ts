import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  @Injectable()
  export class CookieInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const url = context.switchToHttp().getRequest().url as string
      if(url.includes('auth/telegram')) return next.handle()
        
      return next.handle().pipe(
        map(data => {
          const res = context.switchToHttp().getResponse();
          const { tokens } = data;
  
          //console.log("cookie")
          res.cookie('refreshToken', tokens?.refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, 
            path: '/api/auth/refresh-token', 
          });
  
          return data;
        }),
      );
    }
  }