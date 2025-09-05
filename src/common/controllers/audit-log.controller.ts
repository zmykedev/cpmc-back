import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import {
  AuditLogService,
  QueryAuditLogDto,
} from '../services/audit-log.service';
import {
  AuditLogAction,
  AuditLogStatus,
  AuditLogLevel,
} from '../entities/audit-log.entity';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AuditLogController {
  private readonly logger = new Logger(AuditLogController.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all audit logs with filtering and pagination',
    description:
      'Retrieve audit logs with optional filtering by date, user, action, and pagination. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: { $ref: '#/components/schemas/AuditLog' },
            },
            total: { type: 'number', example: 104 },
            page: { type: 'string', example: '1' },
            limit: { type: 'string', example: '20' },
            totalPages: { type: 'number', example: 6 },
          },
        },
        message: {
          type: 'string',
          example: 'Audit logs retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records per page',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering logs',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description:
      'Filter by specific action (CREATE, READ, UPDATE, DELETE, etc.)',
  })
  @ApiQuery({
    name: 'entity_type',
    required: false,
    description: 'Filter by entity type (Book, User, etc.)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (SUCCESS, FAILURE, PENDING)',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'Filter by log level (INFO, WARNING, ERROR, DEBUG)',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Start date for date range filter (ISO format)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'End date for date range filter (ISO format)',
  })
  async findAll(@Query() queryDto: QueryAuditLogDto) {
    try {
      this.logger.log(
        `Fetching audit logs with query: ${JSON.stringify(queryDto)}`,
      );

      const result = await this.auditLogService.findAll(queryDto);

      return {
        status: 'success',
        data: result,
        message: 'Audit logs retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching audit logs: ${error.message}`);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get audit log statistics',
    description:
      'Retrieve comprehensive statistics about audit logs including counts by action, status, level, and recent activity. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            totalLogs: { type: 'number', example: 104 },
            logsByAction: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', example: 'READ' },
                  count: { type: 'number', example: 45 },
                },
              },
            },
            logsByStatus: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'SUCCESS' },
                  count: { type: 'number', example: 98 },
                },
              },
            },
            logsByLevel: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  level: { type: 'string', example: 'INFO' },
                  count: { type: 'number', example: 95 },
                },
              },
            },
            recentActivity: {
              type: 'array',
              items: { $ref: '#/components/schemas/AuditLog' },
            },
          },
        },
        message: {
          type: 'string',
          example: 'Audit log statistics retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getStats() {
    try {
      this.logger.log('Fetching audit log statistics');

      const stats = await this.auditLogService.getStats();

      return {
        status: 'success',
        data: stats,
        message: 'Audit log statistics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching audit log stats: ${error.message}`);
      throw error;
    }
  }

  @Get('actions')
  @ApiOperation({
    summary: 'Get available audit log actions, statuses, and levels',
    description:
      'Retrieve all available values for audit log actions, statuses, and levels. Useful for building filter interfaces. Requires ADMIN or LIBRARIAN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log actions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            actions: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'CREATE',
                'READ',
                'UPDATE',
                'DELETE',
                'LOGIN',
                'LOGOUT',
                'EXPORT',
              ],
            },
            statuses: {
              type: 'array',
              items: { type: 'string' },
              example: ['SUCCESS', 'FAILURE', 'PENDING'],
            },
            levels: {
              type: 'array',
              items: { type: 'string' },
              example: ['INFO', 'WARNING', 'ERROR', 'DEBUG'],
            },
          },
        },
        message: {
          type: 'string',
          example: 'Audit log actions retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getActions() {
    try {
      this.logger.log('Fetching available audit log actions');

      return {
        status: 'success',
        data: {
          actions: Object.values(AuditLogAction),
          statuses: Object.values(AuditLogStatus),
          levels: Object.values(AuditLogLevel),
        },
        message: 'Audit log actions retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching audit log actions: ${error.message}`);
      throw error;
    }
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export audit logs to CSV format',
    description:
      'Export filtered audit logs to CSV format for external analysis. Supports all query parameters for filtering. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file exported successfully',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': {
        description: 'attachment; filename="audit-logs-YYYY-MM-DD.csv"',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records per page',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering logs',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by specific action',
  })
  @ApiQuery({
    name: 'entity_type',
    required: false,
    description: 'Filter by entity type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'Filter by log level',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Start date for date range filter',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'End date for date range filter',
  })
  async exportToCSV(@Query() queryDto: QueryAuditLogDto, @Res() res: Response) {
    try {
      this.logger.log(
        `Exporting audit logs to CSV with query: ${JSON.stringify(queryDto)}`,
      );

      const csv = await this.auditLogService.exportToCSV(queryDto);

      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.status(HttpStatus.OK).send(csv);
    } catch (error) {
      this.logger.error(`Error exporting audit logs: ${error.message}`);
      throw error;
    }
  }

  @Get('cleanup')
  @ApiOperation({
    summary: 'Clean up old audit logs',
    description:
      'Remove audit logs older than specified number of days. This is a permanent deletion operation. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Old audit logs cleaned up successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            deletedCount: {
              type: 'number',
              example: 45,
              description: 'Number of logs deleted',
            },
          },
        },
        message: {
          type: 'string',
          example: 'Successfully cleaned up 45 old audit logs',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid days parameter',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to keep logs (default: 90)',
    example: 90,
  })
  async cleanupOldLogs(@Query('days') days: string = '90') {
    try {
      const daysToKeep = parseInt(days, 10);
      this.logger.log(`Cleaning up audit logs older than ${daysToKeep} days`);

      const deletedCount =
        await this.auditLogService.cleanupOldLogs(daysToKeep);

      return {
        status: 'success',
        data: { deletedCount },
        message: `Successfully cleaned up ${deletedCount} old audit logs`,
      };
    } catch (error) {
      this.logger.error(`Error cleaning up audit logs: ${error.message}`);
      throw error;
    }
  }
}
