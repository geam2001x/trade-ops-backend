import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'customers' })
export class CustomerReference {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'customer_type', type: 'varchar', length: 32 })
  customerType!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;
}

