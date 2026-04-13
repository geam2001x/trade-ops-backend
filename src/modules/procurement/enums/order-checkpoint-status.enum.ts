export enum OrderCheckpointStatus {
  QUOTATION = 'quotation',
  PURCHASED = 'purchased',
  INTERNATIONAL_TRANSPORT = 'international_transport',
  CUSTOMS_CHILE = 'customs_chile',
  LOCAL_TRANSPORT_TO_WAREHOUSE = 'local_transport_to_warehouse',
  IN_WAREHOUSE = 'in_warehouse',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  SOLD_OR_PAID = 'sold_or_paid',
}

export const ORDER_CHECKPOINT_FLOW: OrderCheckpointStatus[] = [
  OrderCheckpointStatus.QUOTATION,
  OrderCheckpointStatus.PURCHASED,
  OrderCheckpointStatus.INTERNATIONAL_TRANSPORT,
  OrderCheckpointStatus.CUSTOMS_CHILE,
  OrderCheckpointStatus.LOCAL_TRANSPORT_TO_WAREHOUSE,
  OrderCheckpointStatus.IN_WAREHOUSE,
  OrderCheckpointStatus.OUT_FOR_DELIVERY,
  OrderCheckpointStatus.SOLD_OR_PAID,
];
