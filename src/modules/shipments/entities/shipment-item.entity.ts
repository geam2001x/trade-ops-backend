import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Shipment } from './shipment.entity';

@Entity({ name: 'shipment_items' })
export class ShipmentItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'shipment_id', type: 'bigint', unsigned: true })
  shipmentId!: number;

  @Column({ name: 'purchase_order_item_id', type: 'bigint', unsigned: true })
  purchaseOrderItemId!: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId!: number;

  @Column({
    name: 'quantity_shipped',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  quantityShipped!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Shipment, (shipment) => shipment.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;
}

