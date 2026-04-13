import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ShipmentStatus } from '../enums/shipment-status.enum';
import { TransportMode } from '../enums/transport-mode.enum';
import { ShipmentEvent } from './shipment-event.entity';
import { ShipmentItem } from './shipment-item.entity';

@Entity({ name: 'shipments' })
export class Shipment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'purchase_order_id', type: 'bigint', unsigned: true })
  purchaseOrderId!: number;

  @Column({ name: 'shipment_number', type: 'varchar', length: 100 })
  shipmentNumber!: string;

  @Column({ name: 'transport_mode', type: 'varchar', length: 32 })
  transportMode!: TransportMode;

  @Column({ name: 'carrier_name', type: 'varchar', length: 150, nullable: true })
  carrierName!: string | null;

  @Column({ name: 'origin_location', type: 'varchar', length: 150, nullable: true })
  originLocation!: string | null;

  @Column({
    name: 'destination_location',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  destinationLocation!: string | null;

  @Column({
    name: 'tracking_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  trackingReference!: string | null;

  @Column({ type: 'date', nullable: true })
  etd!: string | null;

  @Column({ type: 'date', nullable: true })
  eta!: string | null;

  @Column({ name: 'actual_departure_at', type: 'datetime', nullable: true })
  actualDepartureAt!: Date | null;

  @Column({ name: 'actual_arrival_at', type: 'datetime', nullable: true })
  actualArrivalAt!: Date | null;

  @Column({ type: 'varchar', length: 64, default: ShipmentStatus.PLANNED })
  status!: ShipmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => ShipmentItem, (item) => item.shipment, { cascade: false })
  items!: ShipmentItem[];

  @OneToMany(() => ShipmentEvent, (event) => event.shipment, { cascade: false })
  events!: ShipmentEvent[];
}

