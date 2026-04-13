import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DocumentExtraction } from './document-extraction.entity';

@Entity({ name: 'document_uploads' })
export class DocumentUpload {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'document_type', type: 'varchar', length: 64 })
  documentType!: string;

  @Column({ name: 'original_file_name', type: 'varchar', length: 255 })
  originalFileName!: string;

  @Column({ name: 'storage_path', type: 'varchar', length: 255 })
  storagePath!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'uploaded_by_user_id', type: 'bigint', unsigned: true })
  uploadedByUserId!: number;

  @Column({ type: 'varchar', length: 64 })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => DocumentExtraction, (extraction) => extraction.documentUpload, {
    cascade: false,
  })
  extractions!: DocumentExtraction[];
}
