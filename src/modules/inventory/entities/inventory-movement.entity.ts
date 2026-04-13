import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { InventoryLot } from './inventory-lot.entity';

@Entity({ name: 'inventory_movements' })
export class InventoryMovement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'inventory_lot_id', type: 'bigint', unsigned: true })
  inventoryLotId!: number;

  @Column({ name: 'movement_type', type: 'varchar', length: 64 })
  movementType!: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity!: string;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  referenceType!: string | null;

  @Column({
    name: 'reference_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  referenceId!: number | null;

  @Column({ name: 'movement_date', type: 'datetime' })
  movementDate!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => InventoryLot, (inventoryLot) => inventoryLot.movements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_lot_id' })
  inventoryLot!: InventoryLot;
}

