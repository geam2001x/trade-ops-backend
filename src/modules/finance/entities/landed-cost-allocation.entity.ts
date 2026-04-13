import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'landed_cost_allocations' })
export class LandedCostAllocation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'inventory_lot_id', type: 'bigint', unsigned: true })
  inventoryLotId!: number;

  @Column({ name: 'import_expense_id', type: 'bigint', unsigned: true })
  importExpenseId!: number;

  @Column({
    name: 'allocated_amount_usd',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  allocatedAmountUsd!: string;

  @Column({ name: 'allocation_method', type: 'varchar', length: 32 })
  allocationMethod!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
