import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SaleType } from '../enums/sale-type.enum';
import { SalesOrderStatus } from '../enums/sales-order-status.enum';
import { SalesOrderItem } from './sales-order-item.entity';

@Entity({ name: 'sales_orders' })
export class SalesOrder {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true, nullable: true })
  customerId!: number | null;

  @Column({ name: 'sale_type', type: 'varchar', length: 32 })
  saleType!: SaleType;

  @Column({ name: 'order_number', type: 'varchar', length: 100 })
  orderNumber!: string;

  @Column({ name: 'order_date', type: 'date' })
  orderDate!: string;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({
    name: 'exchange_rate_to_usd',
    type: 'decimal',
    precision: 18,
    scale: 6,
    default: 1,
  })
  exchangeRateToUsd!: string;

  @Column({ name: 'total_original', type: 'decimal', precision: 18, scale: 4 })
  totalOriginal!: string;

  @Column({ name: 'total_usd', type: 'decimal', precision: 18, scale: 4 })
  totalUsd!: string;

  @Column({ type: 'varchar', length: 64 })
  status!: SalesOrderStatus;

  @Column({
    name: 'customer_name_snapshot',
    type: 'varchar',
    length: 180,
    nullable: true,
  })
  customerNameSnapshot!: string | null;

  @Column({
    name: 'customer_tax_id_snapshot',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  customerTaxIdSnapshot!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by_user_id', type: 'bigint', unsigned: true })
  createdByUserId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => SalesOrderItem, (item) => item.salesOrder, {
    cascade: false,
  })
  items!: SalesOrderItem[];
}

