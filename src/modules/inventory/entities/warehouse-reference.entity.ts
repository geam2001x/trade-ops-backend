import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'warehouses' })
export class WarehouseReference {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}

