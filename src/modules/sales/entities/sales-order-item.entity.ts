import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SalesOrder } from './sales-order.entity';
import { SalesOrderItemLot } from './sales-order-item-lot.entity';

@Entity({ name: 'sales_order_items' })
export class SalesOrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'sales_order_id', type: 'bigint', unsigned: true })
  salesOrderId!: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId!: number;

  @Column({
    name: 'product_description_snapshot',
    type: 'varchar',
    length: 255,
  })
  productDescriptionSnapshot!: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity!: string;

  @Column({
    name: 'unit_price_original',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  unitPriceOriginal!: string;

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

  @ManyToOne(() => SalesOrder, (salesOrder) => salesOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder!: SalesOrder;

  @OneToMany(() => SalesOrderItemLot, (lot) => lot.salesOrderItem, {
    cascade: false,
  })
  lots!: SalesOrderItemLot[];
}

