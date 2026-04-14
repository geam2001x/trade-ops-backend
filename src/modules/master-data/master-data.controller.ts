import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ProductReference } from '../document-processing/entities/product-reference.entity';
import { SupplierReference } from '../document-processing/entities/supplier-reference.entity';
import { WarehouseReference } from '../inventory/entities/warehouse-reference.entity';
import { CustomerReference } from '../sales/entities/customer-reference.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateMasterDataStatusDto } from './dto/update-master-data-status.dto';
import { MasterDataService } from './master-data.service';

function parseIncludeInactive(value?: string) {
  return value === 'true' || value === '1';
}

@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('suppliers')
  findAllSuppliers(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<SupplierReference[]> {
    return this.masterDataService.findAllSuppliers(
      parseIncludeInactive(includeInactive),
    );
  }

  @Post('suppliers')
  createSupplier(
    @Body() createSupplierDto: CreateSupplierDto,
  ): Promise<SupplierReference> {
    return this.masterDataService.createSupplier(createSupplierDto);
  }

  @Patch('suppliers/:id/status')
  updateSupplierStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<SupplierReference> {
    return this.masterDataService.updateSupplierStatus(id, updateStatusDto);
  }

  @Get('customers')
  findAllCustomers(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<CustomerReference[]> {
    return this.masterDataService.findAllCustomers(
      parseIncludeInactive(includeInactive),
    );
  }

  @Post('customers')
  createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerReference> {
    return this.masterDataService.createCustomer(createCustomerDto);
  }

  @Patch('customers/:id/status')
  updateCustomerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<CustomerReference> {
    return this.masterDataService.updateCustomerStatus(id, updateStatusDto);
  }

  @Get('products')
  findAllProducts(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProductReference[]> {
    return this.masterDataService.findAllProducts(
      parseIncludeInactive(includeInactive),
    );
  }

  @Post('products')
  createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductReference> {
    return this.masterDataService.createProduct(createProductDto);
  }

  @Patch('products/:id/status')
  updateProductStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<ProductReference> {
    return this.masterDataService.updateProductStatus(id, updateStatusDto);
  }

  @Get('warehouses')
  findAllWarehouses(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<WarehouseReference[]> {
    return this.masterDataService.findAllWarehouses(
      parseIncludeInactive(includeInactive),
    );
  }

  @Post('warehouses')
  createWarehouse(
    @Body() createWarehouseDto: CreateWarehouseDto,
  ): Promise<WarehouseReference> {
    return this.masterDataService.createWarehouse(createWarehouseDto);
  }

  @Patch('warehouses/:id/status')
  updateWarehouseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<WarehouseReference> {
    return this.masterDataService.updateWarehouseStatus(id, updateStatusDto);
  }
}
