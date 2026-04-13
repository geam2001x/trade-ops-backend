import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { InventoryLotStatus } from '../enums/inventory-lot-status.enum';
import { InventoryMovement } from './inventory-movement.entity';

@Entity({ name: 'inventory_lots' })
export class InventoryLot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId!: number;

  @Column({ name: 'purchase_order_item_id', type: 'bigint', unsigned: true })
  purchaseOrderItemId!: number;

  @Column({
    name: 'shipment_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  shipmentItemId!: number | null;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  warehouseId!: number;

  @Column({ name: 'lot_code', type: 'varchar', length: 100 })
  lotCode!: string;

  @Column({
    name: 'received_quantity',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  receivedQuantity!: string;

  @Column({
    name: 'available_quantity',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  availableQuantity!: string;

  @Column({
    name: 'reserved_quantity',
    type: 'decimal',
    precision: 18,
    scale: 4,
    default: 0,
  })
  reservedQuantity!: string;

  @Column({ type: 'varchar', length: 64 })
  status!: InventoryLotStatus;

  @Column({ name: 'received_at', type: 'datetime' })
  receivedAt!: Date;

  @Column({
    name: 'purchase_unit_cost_usd',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  purchaseUnitCostUsd!: string;

  @Column({
    name: 'allocated_import_cost_usd',
    type: 'decimal',
    precision: 18,
    scale: 4,
    default: 0,
  })
  allocatedImportCostUsd!: string;

  @Column({
    name: 'unit_landed_cost_usd',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  unitLandedCostUsd!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => InventoryMovement, (movement) => movement.inventoryLot, {
    cascade: false,
  })
  movements!: InventoryMovement[];
}

