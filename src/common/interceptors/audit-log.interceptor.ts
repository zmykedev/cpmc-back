import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import {
  AuditLogService,
  CreateAuditLogDto,
} from '../services/audit-log.service';
import {
  AuditLogAction,
  AuditLogStatus,
  AuditLogLevel,
} from '../entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Obtener información del usuario si está autenticado
    const user = (request as any).user;
    const userId = user?.id || user?.sub;
    const userEmail = user?.email;
    const userName = user?.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user?.username;

    // Determinar la acción basada en el método HTTP y la ruta
    const action = this.determineAction(request.method, request.route?.path);
    const entityType = this.determineEntityType(request.route?.path);
    const entityId = this.extractEntityId(request.params, request.body);

    // Crear DTO base para el log
    const auditLogDto: CreateAuditLogDto = {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description: this.generateDescription(
        request.method,
        request.route?.path,
        entityType,
      ),
      request_data: this.sanitizeRequestData(request),
      ip_address: this.getClientIp(request),
      user_agent: request.get('User-Agent'),
      endpoint: request.route?.path || request.url,
      http_method: request.method,
      level: AuditLogLevel.INFO,
      status: AuditLogStatus.PENDING,
    };

    return next.handle().pipe(
      tap((data) => {
        // Log exitoso
        const responseTime = Date.now() - startTime;
        this.auditLogService.create({
          ...auditLogDto,
          status: AuditLogStatus.SUCCESS,
          response_data: this.sanitizeResponseData(data),
          response_time_ms: responseTime,
        });
      }),
      catchError((error) => {
        // Log de error
        const responseTime = Date.now() - startTime;
        this.auditLogService.create({
          ...auditLogDto,
          status: AuditLogStatus.FAILURE,
          level: AuditLogLevel.ERROR,
          error_message: error.message,
          response_time_ms: responseTime,
        });
        throw error;
      }),
    );
  }

  private determineAction(method: string, path?: string): AuditLogAction {
    switch (method) {
      case 'GET':
        if (path?.includes('search') || path?.includes('filter')) {
          return AuditLogAction.SEARCH;
        }
        if (path?.includes('export')) {
          return AuditLogAction.EXPORT;
        }
        return AuditLogAction.READ;
      case 'POST':
        return AuditLogAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditLogAction.UPDATE;
      case 'DELETE':
        return AuditLogAction.DELETE;
      default:
        return AuditLogAction.READ;
    }
  }

  private determineEntityType(path?: string): string {
    if (!path) return 'unknown';

    if (path.includes('books')) return 'Book';
    if (path.includes('users')) return 'User';
    if (path.includes('auth')) return 'Auth';
    if (path.includes('dashboard')) return 'Dashboard';

    return 'unknown';
  }

  private extractEntityId(params: any, body: any): string | undefined {
    // Intentar obtener el ID de los parámetros de la URL
    if (params?.id) return params.id;
    if (params?.bookId) return params.bookId;
    if (params?.userId) return params.userId;

    // Intentar obtener el ID del cuerpo de la petición
    if (body?.id) return body.id;

    return undefined;
  }

  private generateDescription(
    method: string,
    path?: string,
    entityType?: string,
  ): string {
    const methodMap: { [key: string]: string } = {
      GET: 'Consultar',
      POST: 'Crear',
      PUT: 'Actualizar',
      PATCH: 'Actualizar parcialmente',
      DELETE: 'Eliminar',
    };

    const action = methodMap[method] || 'Acceder a';
    const entity = entityType || 'recurso';

    return `${action} ${entity}`;
  }

  private sanitizeRequestData(request: Request): any {
    const data: any = {
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
    };

    // Incluir parámetros de consulta si existen
    if (Object.keys(request.query).length > 0) {
      data.query = request.query;
    }

    // Incluir parámetros de ruta si existen
    if (Object.keys(request.params).length > 0) {
      data.params = request.params;
    }

    // Incluir cuerpo de la petición si existe (excluir contraseñas)
    if (request.body && Object.keys(request.body).length > 0) {
      data.body = this.sanitizeBody(request.body);
    }

    return data;
  }

  private sanitizeResponseData(data: any): any {
    if (!data) return null;

    // Si es una respuesta paginada, incluir solo metadatos
    if (data.books && Array.isArray(data.books)) {
      return {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        itemsCount: data.books.length,
      };
    }

    // Si es un array, incluir solo el conteo
    if (Array.isArray(data)) {
      return {
        itemsCount: data.length,
        type: 'array',
      };
    }

    // Si es un objeto simple, incluir solo las claves principales
    if (typeof data === 'object') {
      const sanitized: any = {};
      Object.keys(data).forEach((key) => {
        if (
          typeof data[key] !== 'function' &&
          key !== 'password' &&
          key !== 'token'
        ) {
          if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = 'object';
          } else {
            sanitized[key] = data[key];
          }
        }
      });
      return sanitized;
    }

    return data;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    Object.keys(headers).forEach((key) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = headers[key];
      } else {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized: any = {};
    const sensitiveFields = ['password', 'token', 'refreshToken', 'apiKey'];

    Object.keys(body).forEach((key) => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof body[key] === 'object' && body[key] !== null) {
        sanitized[key] = this.sanitizeBody(body[key]);
      } else {
        sanitized[key] = body[key];
      }
    });

    return sanitized;
  }

  private getClientIp(request: Request): string {
    return (request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown') as string;
  }
}
