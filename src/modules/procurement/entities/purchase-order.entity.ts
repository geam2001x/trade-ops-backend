import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderCheckpointStatus } from '../enums/order-checkpoint-status.enum';
import { PurchaseOrderCheckpointEvent } from './purchase-order-checkpoint-event.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity({ name: 'purchase_orders' })
export class PurchaseOrder {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'supplier_id', type: 'bigint', unsigned: true })
  supplierId!: number;

  @Column({
    name: 'purchase_quotation_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  purchaseQuotationId!: number | null;

  @Column({
    name: 'proforma_document_upload_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  proformaDocumentUploadId!: number | null;

  @Column({
    name: 'invoice_document_upload_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  invoiceDocumentUploadId!: number | null;

  @Column({ name: 'order_number', type: 'varchar', length: 100 })
  orderNumber!: string;

  @Column({ name: 'order_date', type: 'date' })
  orderDate!: string;

  @Column({
    name: 'supplier_invoice_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  supplierInvoiceNumber!: string | null;

  @Column({ name: 'supplier_invoice_date', type: 'date', nullable: true })
  supplierInvoiceDate!: string | null;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'payment_terms', type: 'varchar', length: 120, nullable: true })
  paymentTerms!: string | null;

  @Column({
    name: 'estimated_dispatch_date',
    type: 'date',
    nullable: true,
  })
  estimatedDispatchDate!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', length: 64 })
  status!: string;

  @Column({
    name: 'current_checkpoint_status',
    type: 'varchar',
    length: 64,
    default: OrderCheckpointStatus.QUOTATION,
  })
  currentCheckpointStatus!: OrderCheckpointStatus;

  @Column({
    name: 'current_checkpoint_updated_at',
    type: 'datetime',
    nullable: true,
  })
  currentCheckpointUpdatedAt!: Date | null;

  @Column({ name: 'created_by_user_id', type: 'bigint', unsigned: true })
  createdByUserId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: false,
  })
  items!: PurchaseOrderItem[];

  @OneToMany(
    () => PurchaseOrderCheckpointEvent,
    (event) => event.purchaseOrder,
    { cascade: false },
  )
  checkpointEvents!: PurchaseOrderCheckpointEvent[];
}
