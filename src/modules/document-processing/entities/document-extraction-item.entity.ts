import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DocumentExtraction } from './document-extraction.entity';

@Entity({ name: 'document_extraction_items' })
export class DocumentExtractionItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'document_extraction_id', type: 'bigint', unsigned: true })
  documentExtractionId!: number;

  @Column({ name: 'line_index', type: 'int', unsigned: true })
  lineIndex!: number;

  @Column({ name: 'product_description', type: 'varchar', length: 255 })
  productDescription!: string;

  @Column({ name: 'sku_detected', type: 'varchar', length: 80, nullable: true })
  skuDetected!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity!: string;

  @Column({ name: 'unit_measure', type: 'varchar', length: 32, nullable: true })
  unitMeasure!: string | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 4, nullable: true })
  unitPrice!: string | null;

  @Column({ name: 'line_total', type: 'decimal', precision: 18, scale: 4, nullable: true })
  lineTotal!: string | null;

  @Column({
    name: 'confidence_score',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
  })
  confidenceScore!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(
    () => DocumentExtraction,
    (documentExtraction) => documentExtraction.items,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'document_extraction_id' })
  documentExtraction!: DocumentExtraction;
}
