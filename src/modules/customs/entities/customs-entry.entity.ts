import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CustomsEntryStatus } from '../enums/customs-entry-status.enum';
import { ImportExpense } from './import-expense.entity';

@Entity({ name: 'customs_entries' })
export class CustomsEntry {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'shipment_id', type: 'bigint', unsigned: true })
  shipmentId!: number;

  @Column({ name: 'entry_number', type: 'varchar', length: 100 })
  entryNumber!: string;

  @Column({ name: 'arrival_date_chile', type: 'date', nullable: true })
  arrivalDateChile!: string | null;

  @Column({ name: 'clearance_date', type: 'date', nullable: true })
  clearanceDate!: string | null;

  @Column({ type: 'varchar', length: 64, default: CustomsEntryStatus.PENDING })
  status!: CustomsEntryStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => ImportExpense, (expense) => expense.customsEntry, {
    cascade: false,
  })
  expenses!: ImportExpense[];
}

