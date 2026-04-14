import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'customers' })
export class CustomerReference {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'customer_type', type: 'varchar', length: 32 })
  customerType!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 64, nullable: true })
  taxId!: string | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
