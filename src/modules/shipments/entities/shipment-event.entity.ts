import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Shipment } from './shipment.entity';

@Entity({ name: 'shipment_events' })
export class ShipmentEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'shipment_id', type: 'bigint', unsigned: true })
  shipmentId!: number;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType!: string;

  @Column({ name: 'event_date', type: 'datetime' })
  eventDate!: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Shipment, (shipment) => shipment.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;
}

