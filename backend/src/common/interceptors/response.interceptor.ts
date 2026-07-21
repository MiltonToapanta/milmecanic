import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

interface ResponsePayload<T> {
  message?: string;
  data?: T;
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T | null;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T | ResponsePayload<T>, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T | ResponsePayload<T>>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        const payload: ResponsePayload<T> = isResponsePayload(response) ? response : { data: response };

        return {
          success: true,
          message: payload.message ?? 'Operación realizada correctamente',
          data: payload.data ?? null,
          timestamp: new Date().toISOString()
        };
      })
    );
  }
}

function isResponsePayload<T>(response: T | ResponsePayload<T>): response is ResponsePayload<T> {
  return response !== null && typeof response === 'object' && ('data' in response || 'message' in response);
}
