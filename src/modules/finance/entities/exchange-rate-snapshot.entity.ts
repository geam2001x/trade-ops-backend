import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'exchange_rate_snapshots' })
export class ExchangeRateSnapshot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'base_currency_code', type: 'char', length: 3 })
  baseCurrencyCode!: string;

  @Column({ name: 'quote_currency_code', type: 'char', length: 3 })
  quoteCurrencyCode!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rate!: string;

  @Column({
    name: 'buy_rate',
    type: 'decimal',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  buyRate!: string | null;

  @Column({
    name: 'sell_rate',
    type: 'decimal',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  sellRate!: string | null;

  @Column({ name: 'rate_date', type: 'datetime' })
  rateDate!: Date;

  @Column({ name: 'source_name', type: 'varchar', length: 120 })
  sourceName!: string;

  @Column({ name: 'source_url', type: 'varchar', length: 255, nullable: true })
  sourceUrl!: string | null;

  @Column({
    name: 'buy_sell_source_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  buySellSourceName!: string | null;

  @Column({
    name: 'buy_sell_source_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  buySellSourceUrl!: string | null;

  @CreateDateColumn({ name: 'fetched_at', type: 'datetime' })
  fetchedAt!: Date;
}
