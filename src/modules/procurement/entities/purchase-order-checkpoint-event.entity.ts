import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'purchase_order_checkpoint_events' })
export class PurchaseOrderCheckpointEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'purchase_order_id', type: 'bigint', unsigned: true })
  purchaseOrderId!: number;

  @Column({ name: 'from_checkpoint', type: 'varchar', length: 64, nullable: true })
  fromCheckpoint!: string | null;

  @Column({ name: 'to_checkpoint', type: 'varchar', length: 64 })
  toCheckpoint!: string;

  @Column({ name: 'changed_by_user_id', type: 'bigint', unsigned: true })
  changedByUserId!: number;

  @Column({ name: 'changed_at', type: 'datetime' })
  changedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.checkpointEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrder;
}
