/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const result = super.canActivate(context);
    
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true),
        catchError(() => from([true]))
      );
    }
    
    if (result instanceof Promise) {
      return result.catch(() => true);
    }
    
    return result;
  }

  handleRequest(err: any, user: any) {
    return user;
  }
} 