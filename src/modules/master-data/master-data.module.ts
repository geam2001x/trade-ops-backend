import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductReference } from '../document-processing/entities/product-reference.entity';
import { SupplierReference } from '../document-processing/entities/supplier-reference.entity';
import { WarehouseReference } from '../inventory/entities/warehouse-reference.entity';
import { CustomerReference } from '../sales/entities/customer-reference.entity';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierReference,
      CustomerReference,
      ProductReference,
      WarehouseReference,
    ]),
  ],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
