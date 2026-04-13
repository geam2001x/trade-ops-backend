import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'suppliers' })
export class SupplierReference {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 180 })
  name!: string;
}
