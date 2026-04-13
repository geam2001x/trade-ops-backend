import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProcurementService } from '../procurement/procurement.service';
import { PurchaseOrder } from '../procurement/entities/purchase-order.entity';
import { User } from '../users/entities/user.entity';
import { CreateDocumentExtractionDto } from './dto/create-document-extraction.dto';
import { CreateDocumentUploadDto } from './dto/create-document-upload.dto';
import { CreatePurchaseOrderFromDocumentExtractionDto } from './dto/create-purchase-order-from-document-extraction.dto';
import { ValidateDocumentExtractionDto } from './dto/validate-document-extraction.dto';
import { DocumentExtractionItem } from './entities/document-extraction-item.entity';
import { DocumentExtraction } from './entities/document-extraction.entity';
import { DocumentUpload } from './entities/document-upload.entity';
import { DocumentValidation } from './entities/document-validation.entity';
import { ProductReference } from './entities/product-reference.entity';
import { SupplierReference } from './entities/supplier-reference.entity';

@Injectable()
export class DocumentProcessingService {
  constructor(
    @InjectRepository(DocumentUpload)
    private readonly documentUploadsRepository: Repository<DocumentUpload>,
    @InjectRepository(DocumentExtraction)
    private readonly documentExtractionsRepository: Repository<DocumentExtraction>,
    @InjectRepository(DocumentExtractionItem)
    private readonly documentExtractionItemsRepository: Repository<DocumentExtractionItem>,
    @InjectRepository(DocumentValidation)
    private readonly documentValidationsRepository: Repository<DocumentValidation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SupplierReference)
    private readonly suppliersRepository: Repository<SupplierReference>,
    @InjectRepository(ProductReference)
    private readonly productsRepository: Repository<ProductReference>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrdersRepository: Repository<PurchaseOrder>,
    private readonly procurementService: ProcurementService,
  ) {}

  async createDocumentUpload(
    createDocumentUploadDto: CreateDocumentUploadDto,
  ): Promise<DocumentUpload> {
    await this.ensureUserExists(createDocumentUploadDto.uploadedByUserId);

    const documentUpload = this.documentUploadsRepository.create({
      documentType: createDocumentUploadDto.documentType,
      originalFileName: createDocumentUploadDto.originalFileName,
      storagePath: createDocumentUploadDto.storagePath,
      mimeType: createDocumentUploadDto.mimeType,
      uploadedByUserId: createDocumentUploadDto.uploadedByUserId,
      status: createDocumentUploadDto.status ?? 'uploaded',
    });

    const savedDocumentUpload =
      await this.documentUploadsRepository.save(documentUpload);

    return this.findDocumentUploadById(Number(savedDocumentUpload.id));
  }

  async findAllDocumentUploads(): Promise<DocumentUpload[]> {
    return this.documentUploadsRepository.find({
      relations: {
        extractions: {
          items: true,
          validation: true,
        },
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findDocumentUploadById(id: number): Promise<DocumentUpload> {
    const documentUpload = await this.documentUploadsRepository.findOne({
      where: {
        id,
      },
      relations: {
        extractions: {
          items: true,
          validation: true,
        },
      },
    });

    if (!documentUpload) {
      throw new NotFoundException('Document upload not found');
    }

    return documentUpload;
  }

  async createDocumentExtraction(
    documentUploadId: number,
    createDocumentExtractionDto: CreateDocumentExtractionDto,
  ): Promise<DocumentExtraction> {
    const documentUpload = await this.findDocumentUploadById(documentUploadId);

    const documentExtraction = this.documentExtractionsRepository.create({
      documentUploadId: Number(documentUpload.id),
      detectedDocumentType: createDocumentExtractionDto.detectedDocumentType,
      rawText: createDocumentExtractionDto.rawText ?? null,
      structuredPayloadJson:
        createDocumentExtractionDto.structuredPayloadJson ?? null,
      confidenceScore:
        createDocumentExtractionDto.confidenceScore?.toFixed(4) ?? null,
      status: createDocumentExtractionDto.status ?? 'pending_validation',
    });

    const savedExtraction =
      await this.documentExtractionsRepository.save(documentExtraction);

    if (createDocumentExtractionDto.items.length > 0) {
      const items = createDocumentExtractionDto.items.map((item) =>
        this.documentExtractionItemsRepository.create({
          documentExtractionId: Number(savedExtraction.id),
          lineIndex: item.lineIndex,
          productDescription: item.productDescription,
          skuDetected: item.skuDetected ?? null,
          quantity: item.quantity.toFixed(4),
          unitMeasure: item.unitMeasure ?? null,
          unitPrice: item.unitPrice?.toFixed(4) ?? null,
          lineTotal: item.lineTotal?.toFixed(4) ?? null,
          confidenceScore: item.confidenceScore?.toFixed(4) ?? null,
        }),
      );

      await this.documentExtractionItemsRepository.save(items);
    }

    await this.documentUploadsRepository.update(
      { id: Number(documentUpload.id) },
      { status: 'pending_validation' },
    );

    return this.findDocumentExtractionById(Number(savedExtraction.id));
  }

  async findDocumentExtractionById(id: number): Promise<DocumentExtraction> {
    const documentExtraction = await this.documentExtractionsRepository.findOne({
      where: {
        id,
      },
      relations: {
        documentUpload: true,
        items: true,
        validation: true,
      },
    });

    if (!documentExtraction) {
      throw new NotFoundException('Document extraction not found');
    }

    return documentExtraction;
  }

  async validateDocumentExtraction(
    id: number,
    validateDocumentExtractionDto: ValidateDocumentExtractionDto,
  ): Promise<DocumentExtraction> {
    const documentExtraction = await this.findDocumentExtractionById(id);

    await this.ensureUserExists(validateDocumentExtractionDto.validatedByUserId);
    await this.ensureSupplierExists(validateDocumentExtractionDto.supplierId);
    await this.ensureProductsExist(
      validateDocumentExtractionDto.items.map((item) => item.productId),
    );

    const existingValidation = await this.documentValidationsRepository.findOne({
      where: {
        documentExtractionId: Number(documentExtraction.id),
      },
    });

    const validationPayload: Record<string, unknown> = {
      supplierId: validateDocumentExtractionDto.supplierId,
      orderNumber: validateDocumentExtractionDto.orderNumber,
      orderDate: validateDocumentExtractionDto.orderDate,
      supplierInvoiceNumber:
        validateDocumentExtractionDto.supplierInvoiceNumber ?? null,
      supplierInvoiceDate:
        validateDocumentExtractionDto.supplierInvoiceDate ?? null,
      currencyCode: validateDocumentExtractionDto.currencyCode,
      paymentTerms: validateDocumentExtractionDto.paymentTerms ?? null,
      estimatedDispatchDate:
        validateDocumentExtractionDto.estimatedDispatchDate ?? null,
      notes: validateDocumentExtractionDto.notes ?? null,
      items: validateDocumentExtractionDto.items,
    };

    if (existingValidation) {
      existingValidation.validatedByUserId =
        validateDocumentExtractionDto.validatedByUserId;
      existingValidation.validatedPayloadJson = validationPayload;
      existingValidation.validationNotes =
        validateDocumentExtractionDto.notes ?? null;
      existingValidation.validatedAt = new Date();
      await this.documentValidationsRepository.save(existingValidation);
    } else {
      await this.documentValidationsRepository.save(
        this.documentValidationsRepository.create({
          documentExtractionId: Number(documentExtraction.id),
          validatedByUserId: validateDocumentExtractionDto.validatedByUserId,
          validatedPayloadJson: validationPayload,
          validationNotes: validateDocumentExtractionDto.notes ?? null,
          validatedAt: new Date(),
        }),
      );
    }

    await this.documentExtractionsRepository.update(
      { id: Number(documentExtraction.id) },
      { status: 'validated' },
    );

    await this.documentUploadsRepository.update(
      { id: Number(documentExtraction.documentUploadId) },
      { status: 'validated' },
    );

    return this.findDocumentExtractionById(Number(documentExtraction.id));
  }

  async createPurchaseOrderFromValidatedExtraction(
    id: number,
    createPurchaseOrderFromDocumentExtractionDto: CreatePurchaseOrderFromDocumentExtractionDto,
  ): Promise<PurchaseOrder> {
    const documentExtraction = await this.findDocumentExtractionById(id);

    if (!documentExtraction.validation) {
      throw new BadRequestException(
        'Document extraction must be validated before creating a purchase order',
      );
    }

    await this.ensureUserExists(
      createPurchaseOrderFromDocumentExtractionDto.createdByUserId,
    );

    const existingPurchaseOrder = await this.purchaseOrdersRepository.findOne({
      where: {
        proformaDocumentUploadId: Number(documentExtraction.documentUploadId),
      },
    });

    if (existingPurchaseOrder) {
      throw new BadRequestException(
        'A purchase order already exists for this proforma document',
      );
    }

    const payload = this.parseJsonValue<{
      supplierId: number;
      orderNumber: string;
      orderDate: string;
      supplierInvoiceNumber: string | null;
      supplierInvoiceDate: string | null;
      currencyCode: string;
      paymentTerms: string | null;
      estimatedDispatchDate: string | null;
      notes: string | null;
      items: Array<{
        productId: number;
        productDescriptionSnapshot: string;
        quantityOrdered: number;
        unitMeasure: string;
        unitPriceOriginal: number;
        exchangeRateToUsd: number;
        unitPriceUsd: number;
        lineTotalOriginal: number;
        lineTotalUsd: number;
      }>;
    }>(documentExtraction.validation.validatedPayloadJson as unknown);

    const purchaseOrder = await this.procurementService.createOrder({
      supplierId: payload.supplierId,
      proformaDocumentUploadId: Number(documentExtraction.documentUploadId),
      orderNumber: payload.orderNumber,
      orderDate: payload.orderDate,
      supplierInvoiceNumber: payload.supplierInvoiceNumber ?? undefined,
      supplierInvoiceDate: payload.supplierInvoiceDate ?? undefined,
      currencyCode: payload.currencyCode,
      paymentTerms: payload.paymentTerms ?? undefined,
      estimatedDispatchDate: payload.estimatedDispatchDate ?? undefined,
      notes:
        createPurchaseOrderFromDocumentExtractionDto.notes ??
        payload.notes ??
        undefined,
      status: createPurchaseOrderFromDocumentExtractionDto.status ?? 'draft',
      createdByUserId:
        createPurchaseOrderFromDocumentExtractionDto.createdByUserId,
      items: payload.items,
    });

    await this.documentExtractionsRepository.update(
      { id: Number(documentExtraction.id) },
      { status: 'converted' },
    );

    await this.documentUploadsRepository.update(
      { id: Number(documentExtraction.documentUploadId) },
      { status: 'converted' },
    );

    return purchaseOrder;
  }

  private async ensureUserExists(userId: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async ensureSupplierExists(supplierId: number): Promise<void> {
    const supplier = await this.suppliersRepository.findOne({
      where: {
        id: supplierId,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
  }

  private async ensureProductsExist(productIds: number[]): Promise<void> {
    const uniqueProductIds = [...new Set(productIds)];
    const products = await this.productsRepository.findBy(
      uniqueProductIds.map((id) => ({ id })),
    );

    if (products.length !== uniqueProductIds.length) {
      throw new NotFoundException('One or more products were not found');
    }
  }

  private parseJsonValue<T>(value: unknown): T {
    return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
  }
}
