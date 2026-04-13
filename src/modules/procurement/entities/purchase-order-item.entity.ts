import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'purchase_order_items' })
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'purchase_order_id', type: 'bigint', unsigned: true })
  purchaseOrderId!: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId!: number;

  @Column({
    name: 'product_description_snapshot',
    type: 'varchar',
    length: 255,
  })
  productDescriptionSnapshot!: string;

  @Column({ name: 'quantity_ordered', type: 'decimal', precision: 18, scale: 4 })
  quantityOrdered!: string;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 18,
    scale: 4,
    default: 0,
  })
  quantityReceived!: string;

  @Column({ name: 'unit_measure', type: 'varchar', length: 32 })
  unitMeasure!: string;

  @Column({
    name: 'unit_price_original',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  unitPriceOriginal!: string;

  @Column({
    name: 'exchange_rate_to_usd',
    type: 'decimal',
    precision: 18,
    scale: 6,
    default: 1,
  })
  exchangeRateToUsd!: string;

  @Column({ name: 'unit_price_usd', type: 'decimal', precision: 18, scale: 4 })
  unitPriceUsd!: string;

  @Column({
    name: 'line_total_original',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  lineTotalOriginal!: string;

  @Column({ name: 'line_total_usd', type: 'decimal', precision: 18, scale: 4 })
  lineTotalUsd!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrder;
}
