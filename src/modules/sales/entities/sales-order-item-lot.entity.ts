import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { SalesOrderItem } from './sales-order-item.entity';

@Entity({ name: 'sales_order_item_lots' })
export class SalesOrderItemLot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'sales_order_item_id', type: 'bigint', unsigned: true })
  salesOrderItemId!: number;

  @Column({ name: 'inventory_lot_id', type: 'bigint', unsigned: true })
  inventoryLotId!: number;

  @Column({
    name: 'quantity_consumed',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  quantityConsumed!: string;

  @Column({
    name: 'unit_landed_cost_usd_snapshot',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  unitLandedCostUsdSnapshot!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => SalesOrderItem, (salesOrderItem) => salesOrderItem.lots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sales_order_item_id' })
  salesOrderItem!: SalesOrderItem;
}

