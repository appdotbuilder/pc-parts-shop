
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input for GPU product
const testGpuInput: CreateProductInput = {
  name: 'NVIDIA RTX 4080',
  brand: 'NVIDIA',
  category: 'gpu',
  description: 'High-end graphics card',
  price: 1199.99,
  stock_quantity: 50,
  low_stock_threshold: 5,
  is_active: true,
  gpu_chipset: 'AD103',
  gpu_memory: 16,
  gpu_memory_type: 'GDDR6X'
};

// Test input for CPU product
const testCpuInput: CreateProductInput = {
  name: 'Intel Core i7-13700K',
  brand: 'Intel',
  category: 'cpu',
  description: 'High-performance processor',
  price: 399.99,
  stock_quantity: 25,
  low_stock_threshold: 10,
  is_active: true,
  cpu_socket: 'LGA1700',
  cpu_cores: 16,
  cpu_threads: 24,
  cpu_base_clock: 3.4,
  cpu_boost_clock: 5.4
};

// Test input for RAM product
const testRamInput: CreateProductInput = {
  name: 'Corsair Vengeance DDR5',
  brand: 'Corsair',
  category: 'ram',
  description: 'High-speed memory',
  price: 199.99,
  stock_quantity: 100,
  low_stock_threshold: 15,
  is_active: true,
  ram_capacity: 32,
  ram_speed: 5600,
  ram_type: 'DDR5'
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a GPU product with specific fields', async () => {
    const result = await createProduct(testGpuInput);

    // Basic field validation
    expect(result.name).toEqual('NVIDIA RTX 4080');
    expect(result.brand).toEqual('NVIDIA');
    expect(result.category).toEqual('gpu');
    expect(result.description).toEqual('High-end graphics card');
    expect(result.price).toEqual(1199.99);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.low_stock_threshold).toEqual(5);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // GPU-specific fields
    expect(result.gpu_chipset).toEqual('AD103');
    expect(result.gpu_memory).toEqual(16);
    expect(result.gpu_memory_type).toEqual('GDDR6X');

    // Other category fields should be null
    expect(result.cpu_socket).toBeNull();
    expect(result.ram_capacity).toBeNull();
    expect(result.ssd_capacity).toBeNull();
  });

  it('should create a CPU product with numeric clock speeds', async () => {
    const result = await createProduct(testCpuInput);

    expect(result.name).toEqual('Intel Core i7-13700K');
    expect(result.category).toEqual('cpu');
    expect(result.price).toEqual(399.99);
    expect(typeof result.price).toBe('number');

    // CPU-specific fields
    expect(result.cpu_socket).toEqual('LGA1700');
    expect(result.cpu_cores).toEqual(16);
    expect(result.cpu_threads).toEqual(24);
    expect(result.cpu_base_clock).toEqual(3.4);
    expect(typeof result.cpu_base_clock).toBe('number');
    expect(result.cpu_boost_clock).toEqual(5.4);
    expect(typeof result.cpu_boost_clock).toBe('number');

    // Other category fields should be null
    expect(result.gpu_chipset).toBeNull();
    expect(result.ram_capacity).toBeNull();
  });

  it('should create a RAM product with enum type', async () => {
    const result = await createProduct(testRamInput);

    expect(result.name).toEqual('Corsair Vengeance DDR5');
    expect(result.category).toEqual('ram');
    expect(result.price).toEqual(199.99);

    // RAM-specific fields
    expect(result.ram_capacity).toEqual(32);
    expect(result.ram_speed).toEqual(5600);
    expect(result.ram_type).toEqual('DDR5');

    // Other category fields should be null
    expect(result.gpu_chipset).toBeNull();
    expect(result.cpu_socket).toBeNull();
    expect(result.ssd_capacity).toBeNull();
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testGpuInput);

    // Query database to verify data was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    
    expect(savedProduct.name).toEqual('NVIDIA RTX 4080');
    expect(savedProduct.brand).toEqual('NVIDIA');
    expect(savedProduct.category).toEqual('gpu');
    expect(parseFloat(savedProduct.price)).toEqual(1199.99);
    expect(savedProduct.stock_quantity).toEqual(50);
    expect(savedProduct.gpu_chipset).toEqual('AD103');
    expect(savedProduct.gpu_memory).toEqual(16);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
  });

  it('should apply default values correctly', async () => {
    const minimalInput: CreateProductInput = {
      name: 'Basic Product',
      brand: 'Generic',
      category: 'ssd',
      description: null,
      price: 99.99,
      stock_quantity: 10,
      low_stock_threshold: 10, // Include required field
      is_active: true // Include required field
    };

    const result = await createProduct(minimalInput);

    expect(result.low_stock_threshold).toEqual(10);
    expect(result.is_active).toBe(true);
    expect(result.description).toBeNull();
  });

  it('should handle nullable description field', async () => {
    const inputWithNullDescription: CreateProductInput = {
      ...testGpuInput,
      description: null
    };

    const result = await createProduct(inputWithNullDescription);

    expect(result.description).toBeNull();
  });
});
