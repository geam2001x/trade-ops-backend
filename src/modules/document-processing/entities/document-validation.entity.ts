import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DocumentExtraction } from './document-extraction.entity';

@Entity({ name: 'document_validations' })
export class DocumentValidation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'document_extraction_id', type: 'bigint', unsigned: true })
  documentExtractionId!: number;

  @Column({ name: 'validated_by_user_id', type: 'bigint', unsigned: true })
  validatedByUserId!: number;

  @Column({ name: 'validated_payload_json', type: 'json' })
  validatedPayloadJson!: Record<string, unknown>;

  @Column({ name: 'validation_notes', type: 'text', nullable: true })
  validationNotes!: string | null;

  @Column({ name: 'validated_at', type: 'datetime' })
  validatedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToOne(
    () => DocumentExtraction,
    (documentExtraction) => documentExtraction.validation,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'document_extraction_id' })
  documentExtraction!: DocumentExtraction;
}
