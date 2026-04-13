import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CustomsEntry } from './customs-entry.entity';

@Entity({ name: 'import_expenses' })
export class ImportExpense {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'customs_entry_id', type: 'bigint', unsigned: true })
  customsEntryId!: number;

  @Column({ name: 'expense_type', type: 'varchar', length: 64 })
  expenseType!: string;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate!: string;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'amount_original', type: 'decimal', precision: 18, scale: 4 })
  amountOriginal!: string;

  @Column({
    name: 'exchange_rate_to_usd',
    type: 'decimal',
    precision: 18,
    scale: 6,
    default: 1,
  })
  exchangeRateToUsd!: string;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 18, scale: 4 })
  amountUsd!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => CustomsEntry, (customsEntry) => customsEntry.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customs_entry_id' })
  customsEntry!: CustomsEntry;
}

