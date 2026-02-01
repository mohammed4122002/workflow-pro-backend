import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { method, originalUrl, url } = request;

    return next.handle().pipe(
      tap(() => {
        const response = http.getResponse();
        const statusCode = response?.statusCode;
        const durationMs = Date.now() - now;
        const path = originalUrl || url;
        this.logger.log(`${method} ${path} ${statusCode} - ${durationMs}ms`);
      }),
    );
  }
}
