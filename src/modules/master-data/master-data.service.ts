import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductReference } from '../document-processing/entities/product-reference.entity';
import { SupplierReference } from '../document-processing/entities/supplier-reference.entity';
import { WarehouseReference } from '../inventory/entities/warehouse-reference.entity';
import { CustomerReference } from '../sales/entities/customer-reference.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateMasterDataStatusDto } from './dto/update-master-data-status.dto';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(SupplierReference)
    private readonly suppliersRepository: Repository<SupplierReference>,
    @InjectRepository(CustomerReference)
    private readonly customersRepository: Repository<CustomerReference>,
    @InjectRepository(ProductReference)
    private readonly productsRepository: Repository<ProductReference>,
    @InjectRepository(WarehouseReference)
    private readonly warehousesRepository: Repository<WarehouseReference>,
  ) {}

  findAllSuppliers(includeInactive = false): Promise<SupplierReference[]> {
    return this.suppliersRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createSupplier(createSupplierDto: CreateSupplierDto): Promise<SupplierReference> {
    const taxId = this.normalizeNullable(createSupplierDto.taxId);

    if (taxId) {
      const existingSupplier = await this.suppliersRepository.findOne({
        where: { taxId },
      });

      if (existingSupplier) {
        throw new BadRequestException('Supplier tax ID already exists');
      }
    }

    const supplier = this.suppliersRepository.create({
      name: createSupplierDto.name.trim(),
      taxId,
      countryCode: createSupplierDto.countryCode.trim().toUpperCase(),
      contactName: this.normalizeNullable(createSupplierDto.contactName),
      email: this.normalizeNullable(createSupplierDto.email)?.toLowerCase() ?? null,
      phone: this.normalizeNullable(createSupplierDto.phone),
      address: this.normalizeNullable(createSupplierDto.address),
      isActive: true,
    });

    return this.suppliersRepository.save(supplier);
  }

  async updateSupplierStatus(
    id: number,
    updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<SupplierReference> {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    supplier.isActive = updateStatusDto.isActive;

    return this.suppliersRepository.save(supplier);
  }

  findAllCustomers(includeInactive = false): Promise<CustomerReference[]> {
    return this.customersRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerReference> {
    const taxId = this.normalizeNullable(createCustomerDto.taxId);

    if (taxId) {
      const existingCustomer = await this.customersRepository.findOne({
        where: { taxId },
      });

      if (existingCustomer) {
        throw new BadRequestException('Customer tax ID already exists');
      }
    }

    const customer = this.customersRepository.create({
      customerType: createCustomerDto.customerType.trim().toLowerCase(),
      name: createCustomerDto.name.trim(),
      taxId,
      email: this.normalizeNullable(createCustomerDto.email)?.toLowerCase() ?? null,
      phone: this.normalizeNullable(createCustomerDto.phone),
      address: this.normalizeNullable(createCustomerDto.address),
      isActive: true,
    });

    return this.customersRepository.save(customer);
  }

  async updateCustomerStatus(
    id: number,
    updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<CustomerReference> {
    const customer = await this.customersRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    customer.isActive = updateStatusDto.isActive;

    return this.customersRepository.save(customer);
  }

  findAllProducts(includeInactive = false): Promise<ProductReference[]> {
    return this.productsRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createProduct(createProductDto: CreateProductDto): Promise<ProductReference> {
    const sku = createProductDto.sku.trim().toUpperCase();
    const existingProduct = await this.productsRepository.findOne({ where: { sku } });

    if (existingProduct) {
      throw new BadRequestException('Product SKU already exists');
    }

    const product = this.productsRepository.create({
      sku,
      name: createProductDto.name.trim(),
      description: this.normalizeNullable(createProductDto.description),
      unitMeasure: createProductDto.unitMeasure.trim(),
      defaultSalePriceUsd:
        typeof createProductDto.defaultSalePriceUsd === 'number'
          ? createProductDto.defaultSalePriceUsd.toFixed(4)
          : null,
      isActive: true,
    });

    return this.productsRepository.save(product);
  }

  async updateProductStatus(
    id: number,
    updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<ProductReference> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isActive = updateStatusDto.isActive;

    return this.productsRepository.save(product);
  }

  findAllWarehouses(includeInactive = false): Promise<WarehouseReference[]> {
    return this.warehousesRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createWarehouse(
    createWarehouseDto: CreateWarehouseDto,
  ): Promise<WarehouseReference> {
    const name = createWarehouseDto.name.trim();
    const existingWarehouse = await this.warehousesRepository.findOne({
      where: { name },
    });

    if (existingWarehouse) {
      throw new BadRequestException('Warehouse name already exists');
    }

    const warehouse = this.warehousesRepository.create({
      name,
      location: this.normalizeNullable(createWarehouseDto.location),
      isActive: true,
    });

    return this.warehousesRepository.save(warehouse);
  }

  async updateWarehouseStatus(
    id: number,
    updateStatusDto: UpdateMasterDataStatusDto,
  ): Promise<WarehouseReference> {
    const warehouse = await this.warehousesRepository.findOne({ where: { id } });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    warehouse.isActive = updateStatusDto.isActive;

    return this.warehousesRepository.save(warehouse);
  }

  private normalizeNullable(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
