import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLog,
  AuditLogAction,
  AuditLogStatus,
  AuditLogLevel,
} from '../entities/audit-log.entity';

export interface CreateAuditLogDto {
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: AuditLogAction;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  request_data?: any;
  response_data?: any;
  status?: AuditLogStatus;
  level?: AuditLogLevel;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  http_method?: string;
  response_time_ms?: number;
  error_message?: string;
  metadata?: any;
}

export interface QueryAuditLogDto {
  page?: number;
  limit?: number;
  user_id?: string;
  action?: AuditLogAction;
  entity_type?: string;
  entity_id?: string;
  status?: AuditLogStatus;
  level?: AuditLogLevel;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'ASC' | 'DESC';
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create(createAuditLogDto);
      const savedLog = await this.auditLogRepository.save(auditLog);

      this.logger.debug(
        `Audit log created: ${savedLog.id} - ${savedLog.action}`,
      );
      return savedLog;
    } catch (error) {
      this.logger.error(`Error creating audit log: ${error.message}`);
      throw error;
    }
  }

  async findAll(queryDto: QueryAuditLogDto): Promise<AuditLogListResponse> {
    try {
      const {
        page = 1,
        limit = 50,
        user_id,
        action,
        entity_type,
        entity_id,
        status,
        level,
        start_date,
        end_date,
        search,
        sort_by = 'created_at',
        sort_dir = 'DESC',
      } = queryDto;

      const queryBuilder = this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.deleted_at IS NULL');

      // Aplicar filtros
      if (user_id) {
        queryBuilder.andWhere('log.user_id = :user_id', { user_id });
      }

      if (action) {
        queryBuilder.andWhere('log.action = :action', { action });
      }

      if (entity_type) {
        queryBuilder.andWhere('log.entity_type = :entity_type', {
          entity_type,
        });
      }

      if (entity_id) {
        queryBuilder.andWhere('log.entity_id = :entity_id', { entity_id });
      }

      if (status) {
        queryBuilder.andWhere('log.status = :status', { status });
      }

      if (level) {
        queryBuilder.andWhere('log.level = :level', { level });
      }

      if (start_date) {
        queryBuilder.andWhere('log.created_at >= :start_date', { start_date });
      }

      if (end_date) {
        queryBuilder.andWhere('log.created_at <= :end_date', { end_date });
      }

      if (search) {
        queryBuilder.andWhere(
          '(log.description ILIKE :search OR log.user_name ILIKE :search OR log.user_email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Aplicar ordenamiento
      const orderBy = `log.${sort_by}`;
      queryBuilder.orderBy(orderBy, sort_dir.toUpperCase() as 'ASC' | 'DESC');

      // Aplicar paginación
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Ejecutar consulta
      const [logs, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Error finding audit logs: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number): Promise<AuditLog> {
    try {
      const log = await this.auditLogRepository.findOne({
        where: { id, deleted_at: null },
      });

      if (!log) {
        throw new Error(`Audit log with ID ${id} not found`);
      }

      return log;
    } catch (error) {
      this.logger.error(`Error finding audit log: ${error.message}`);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const totalLogs = await this.auditLogRepository.count({
        where: { deleted_at: null },
      });

      const logsByAction = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('log.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('log.deleted_at IS NULL')
        .groupBy('log.action')
        .getRawMany();

      const logsByStatus = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('log.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('log.deleted_at IS NULL')
        .groupBy('log.status')
        .getRawMany();

      const logsByLevel = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('log.level', 'level')
        .addSelect('COUNT(*)', 'count')
        .where('log.deleted_at IS NULL')
        .groupBy('log.level')
        .getRawMany();

      const recentActivity = await this.auditLogRepository
        .createQueryBuilder('log')
        .select([
          'log.action',
          'log.entity_type',
          'log.user_name',
          'log.created_at',
          'log.status',
        ])
        .where('log.deleted_at IS NULL')
        .orderBy('log.created_at', 'DESC')
        .limit(10)
        .getMany();

      return {
        totalLogs,
        logsByAction,
        logsByStatus,
        logsByLevel,
        recentActivity,
      };
    } catch (error) {
      this.logger.error(`Error getting audit log stats: ${error.message}`);
      throw error;
    }
  }

  async exportToCSV(queryDto: QueryAuditLogDto): Promise<string> {
    try {
      const { logs } = await this.findAll({ ...queryDto, limit: 10000 });

      const csvHeaders =
        'ID,Usuario,Acción,Entidad,Descripción,Estado,Nivel,IP,Endpoint,Método HTTP,Tiempo Respuesta,Fecha Creación\n';
      const csvRows = logs
        .map(
          (log) =>
            `${log.id},"${log.user_name || 'N/A'}","${log.action}","${log.entity_type || 'N/A'}","${log.description || 'N/A'}","${log.status}","${log.level}","${log.ip_address || 'N/A'}","${log.endpoint || 'N/A'}","${log.http_method || 'N/A'}","${log.response_time_ms || 'N/A'}","${log.created_at.toISOString()}"`,
        )
        .join('\n');

      return csvHeaders + csvRows;
    } catch (error) {
      this.logger.error(`Error exporting audit logs to CSV: ${error.message}`);
      throw error;
    }
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .from(AuditLog)
        .where('created_at < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `Cleaned up ${result.affected} old audit logs older than ${daysToKeep} days`,
      );
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Error cleaning up old audit logs: ${error.message}`);
      throw error;
    }
  }
}
