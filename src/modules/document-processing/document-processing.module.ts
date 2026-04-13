import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProcurementModule } from '../procurement/procurement.module';
import { PurchaseOrder } from '../procurement/entities/purchase-order.entity';
import { User } from '../users/entities/user.entity';
import { DocumentProcessingController } from './document-processing.controller';
import { DocumentProcessingService } from './document-processing.service';
import { DocumentExtractionItem } from './entities/document-extraction-item.entity';
import { DocumentExtraction } from './entities/document-extraction.entity';
import { DocumentUpload } from './entities/document-upload.entity';
import { DocumentValidation } from './entities/document-validation.entity';
import { ProductReference } from './entities/product-reference.entity';
import { SupplierReference } from './entities/supplier-reference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentUpload,
      DocumentExtraction,
      DocumentExtractionItem,
      DocumentValidation,
      User,
      SupplierReference,
      ProductReference,
      PurchaseOrder,
    ]),
    ProcurementModule,
  ],
  controllers: [DocumentProcessingController],
  providers: [DocumentProcessingService],
  exports: [DocumentProcessingService],
})
export class DocumentProcessingModule {}
