import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBooksDto } from './dto/search-books.dto';
import { Book } from './entities/book.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/services/storage.service';

import { Public } from '../auth/decorators/public.decorator';

@ApiTags('books')
@Controller('books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly storageService: StorageService,
  ) {}

  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Test endpoint - no authentication required' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  testEndpoint() {
    return {
      message: 'Test endpoint working - no auth required',
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully',
    type: Book,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  create(@Body() createBookDto: CreateBookDto): Promise<Book> {
    console.log('📚 === CREATE BOOK CONTROLLER ===');
    console.log('📝 DTO recibido:', createBookDto);
    console.log('📚 === FIN CREATE BOOK CONTROLLER ===');
    return this.booksService.create(createBookDto);
  }

  @Post('search')
  @ApiOperation({
    summary: 'Search books with advanced filtering, sorting and pagination',
    description:
      'Search books using multiple criteria including title, author, genre, price range, availability, and more. Supports sorting and pagination for large result sets.',
  })
  @ApiResponse({
    status: 200,
    description: 'Books retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            books: {
              type: 'array',
              items: { $ref: '#/components/schemas/Book' },
            },
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 8 },
          },
        },
        message: { type: 'string', example: 'Books retrieved successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid search parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  searchBooks(@Body() searchDto: SearchBooksDto) {
    return this.booksService.findAll(searchDto.query);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all books (simple list without filters)',
    description:
      'Retrieve a simple list of all books in the system without advanced filtering. Useful for basic browsing and simple applications.',
  })
  @ApiResponse({
    status: 200,
    description: 'Books retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Book' },
        },
        message: { type: 'string', example: 'Books retrieved successfully' },
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
  findAll() {
    return this.booksService.findAll({});
  }

  @Get('genres')
  @ApiOperation({ summary: 'Get all available genres' })
  @ApiResponse({
    status: 200,
    description: 'Genres retrieved successfully',
    type: [String],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getGenres(): Promise<string[]> {
    return this.booksService.getGenres();
  }

  @Get('publishers')
  @ApiOperation({ summary: 'Get all available publishers' })
  @ApiResponse({
    status: 200,
    description: 'Publishers retrieved successfully',
    type: [String],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPublishers(): Promise<string[]> {
    return this.booksService.getPublishers();
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload an image for a book' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string', example: 'https://storage.googleapis.com/bucket-name/images/uuid.jpg' },
            originalName: { type: 'string', example: 'book-cover.jpg' },
            size: { type: 'number', example: 1024000 },
            mimeType: { type: 'string', example: 'image/jpeg' },
          },
        },
        message: { type: 'string', example: 'Image uploaded successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadBookImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Save file temporarily and upload to GCS
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.originalname);
    
    try {
      // Write file to temp location
      fs.writeFileSync(tempFilePath, file.buffer);
      
      // Upload to GCS
      const result = await this.storageService.uploadFileGcp(tempFilePath);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      // Extract URL from result
      const url = result[0].metadata.mediaLink || result[0].metadata.selfLink;
      
      return {
        url,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export all books to CSV format' })
  @ApiResponse({ status: 200, description: 'CSV exported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async exportToCSV(@Res() res: Response): Promise<void> {
    try {
      const csv = await this.booksService.exportToCSV();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=books.csv');
      res.status(HttpStatus.OK).send(csv);
    } catch {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Error exporting to CSV' });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiResponse({
    status: 200,
    description: 'Book retrieved successfully',
    type: Book,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
    type: Book,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a book' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.booksService.remove(id);
  }
}
