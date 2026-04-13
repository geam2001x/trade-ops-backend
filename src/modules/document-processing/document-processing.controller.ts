import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CreateDocumentExtractionDto } from './dto/create-document-extraction.dto';
import { CreateDocumentUploadDto } from './dto/create-document-upload.dto';
import { CreatePurchaseOrderFromDocumentExtractionDto } from './dto/create-purchase-order-from-document-extraction.dto';
import { ValidateDocumentExtractionDto } from './dto/validate-document-extraction.dto';
import { DocumentProcessingService } from './document-processing.service';
import { DocumentExtraction } from './entities/document-extraction.entity';
import { DocumentUpload } from './entities/document-upload.entity';

@Controller('document-processing')
export class DocumentProcessingController {
  constructor(
    private readonly documentProcessingService: DocumentProcessingService,
  ) {}

  @Post('uploads')
  createDocumentUpload(
    @Body() createDocumentUploadDto: CreateDocumentUploadDto,
  ): Promise<DocumentUpload> {
    return this.documentProcessingService.createDocumentUpload(
      createDocumentUploadDto,
    );
  }

  @Get('uploads')
  findAllDocumentUploads(): Promise<DocumentUpload[]> {
    return this.documentProcessingService.findAllDocumentUploads();
  }

  @Get('uploads/:id')
  findDocumentUploadById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DocumentUpload> {
    return this.documentProcessingService.findDocumentUploadById(id);
  }

  @Post('uploads/:id/extractions')
  createDocumentExtraction(
    @Param('id', ParseIntPipe) id: number,
    @Body() createDocumentExtractionDto: CreateDocumentExtractionDto,
  ): Promise<DocumentExtraction> {
    return this.documentProcessingService.createDocumentExtraction(
      id,
      createDocumentExtractionDto,
    );
  }

  @Get('extractions/:id')
  findDocumentExtractionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DocumentExtraction> {
    return this.documentProcessingService.findDocumentExtractionById(id);
  }

  @Post('extractions/:id/validate')
  validateDocumentExtraction(
    @Param('id', ParseIntPipe) id: number,
    @Body() validateDocumentExtractionDto: ValidateDocumentExtractionDto,
  ): Promise<DocumentExtraction> {
    return this.documentProcessingService.validateDocumentExtraction(
      id,
      validateDocumentExtractionDto,
    );
  }

  @Post('extractions/:id/create-purchase-order')
  createPurchaseOrderFromValidatedExtraction(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    createPurchaseOrderFromDocumentExtractionDto: CreatePurchaseOrderFromDocumentExtractionDto,
  ) {
    return this.documentProcessingService.createPurchaseOrderFromValidatedExtraction(
      id,
      createPurchaseOrderFromDocumentExtractionDto,
    );
  }
}
