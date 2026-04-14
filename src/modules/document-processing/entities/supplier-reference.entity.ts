import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'suppliers' })
export class SupplierReference {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 64, nullable: true })
  taxId!: string | null;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 150, nullable: true })
  contactName!: string | null;

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
