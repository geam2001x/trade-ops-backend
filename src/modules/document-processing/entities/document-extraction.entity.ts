import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DocumentExtractionItem } from './document-extraction-item.entity';
import { DocumentUpload } from './document-upload.entity';
import { DocumentValidation } from './document-validation.entity';

@Entity({ name: 'document_extractions' })
export class DocumentExtraction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'document_upload_id', type: 'bigint', unsigned: true })
  documentUploadId!: number;

  @Column({ name: 'detected_document_type', type: 'varchar', length: 64 })
  detectedDocumentType!: string;

  @Column({ name: 'raw_text', type: 'longtext', nullable: true })
  rawText!: string | null;

  @Column({ name: 'structured_payload_json', type: 'json', nullable: true })
  structuredPayloadJson!: Record<string, unknown> | null;

  @Column({
    name: 'confidence_score',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
  })
  confidenceScore!: string | null;

  @Column({ type: 'varchar', length: 64 })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => DocumentUpload, (documentUpload) => documentUpload.extractions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_upload_id' })
  documentUpload!: DocumentUpload;

  @OneToMany(() => DocumentExtractionItem, (item) => item.documentExtraction, {
    cascade: false,
  })
  items!: DocumentExtractionItem[];

  @OneToOne(() => DocumentValidation, (validation) => validation.documentExtraction)
  validation!: DocumentValidation | null;
}
