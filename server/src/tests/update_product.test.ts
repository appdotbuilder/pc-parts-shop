
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct, updateProductStock } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProductId: number;

  beforeEach(async () => {
    // Create a test product first
    const result = await db.insert(productsTable)
      .values({
        name: 'Test GPU',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'A test graphics card',
        price: '499.99',
        stock_quantity: 10,
        low_stock_threshold: 5,
        is_active: true,
        gpu_chipset: 'RTX 4060',
        gpu_memory: 8,
        gpu_memory_type: 'GDDR6'
      })
      .returning()
      .execute();
    
    testProductId = result[0].id;
  });

  it('should update basic product fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      name: 'Updated GPU',
      price: 599.99,
      stock_quantity: 15
    };

    const result = await updateProduct(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated GPU');
    expect(result!.price).toEqual(599.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.stock_quantity).toEqual(15);
    expect(result!.brand).toEqual('NVIDIA'); // Should preserve existing values
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update category-specific fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      gpu_chipset: 'RTX 4070',
      gpu_memory: 12,
      gpu_memory_type: 'GDDR6X'
    };

    const result = await updateProduct(updateInput);

    expect(result).not.toBeNull();
    expect(result!.gpu_chipset).toEqual('RTX 4070');
    expect(result!.gpu_memory).toEqual(12);
    expect(result!.gpu_memory_type).toEqual('GDDR6X');
    expect(result!.name).toEqual('Test GPU'); // Should preserve existing values
  });

  it('should update CPU fields with numeric conversions', async () => {
    // Create a CPU product
    const cpuResult = await db.insert(productsTable)
      .values({
        name: 'Test CPU',
        brand: 'AMD',
        category: 'cpu',
        description: 'A test processor',
        price: '299.99',
        stock_quantity: 5,
        cpu_socket: 'AM4',
        cpu_cores: 6,
        cpu_threads: 12,
        cpu_base_clock: '3.60',
        cpu_boost_clock: '4.20'
      })
      .returning()
      .execute();

    const updateInput: UpdateProductInput = {
      id: cpuResult[0].id,
      cpu_base_clock: 3.80,
      cpu_boost_clock: 4.40,
      cpu_cores: 8
    };

    const result = await updateProduct(updateInput);

    expect(result).not.toBeNull();
    expect(result!.cpu_base_clock).toEqual(3.80);
    expect(typeof result!.cpu_base_clock).toEqual('number');
    expect(result!.cpu_boost_clock).toEqual(4.40);
    expect(typeof result!.cpu_boost_clock).toEqual('number');
    expect(result!.cpu_cores).toEqual(8);
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      description: null,
      gpu_memory: null
    };

    const result = await updateProduct(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.gpu_memory).toBeNull();
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      name: 'Database Test GPU',
      price: 799.99
    };

    await updateProduct(updateInput);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProductId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Test GPU');
    expect(parseFloat(products[0].price)).toEqual(799.99);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    const result = await updateProduct(updateInput);

    expect(result).toBeNull();
  });

  it('should handle boolean updates', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      is_active: false
    };

    const result = await updateProduct(updateInput);

    expect(result).not.toBeNull();
    expect(result!.is_active).toEqual(false);
  });
});

describe('updateProductStock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProductId: number;

  beforeEach(async () => {
    // Create a test product
    const result = await db.insert(productsTable)
      .values({
        name: 'Stock Test Product',
        brand: 'TestBrand',
        category: 'gpu',
        description: 'For stock testing',
        price: '199.99',
        stock_quantity: 20,
        low_stock_threshold: 5
      })
      .returning()
      .execute();
    
    testProductId = result[0].id;
  });

  it('should update stock quantity', async () => {
    const result = await updateProductStock(testProductId, 50);

    expect(result).not.toBeNull();
    expect(result!.stock_quantity).toEqual(50);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.name).toEqual('Stock Test Product'); // Other fields preserved
  });

  it('should handle zero stock', async () => {
    const result = await updateProductStock(testProductId, 0);

    expect(result).not.toBeNull();
    expect(result!.stock_quantity).toEqual(0);
  });

  it('should save stock update to database', async () => {
    await updateProductStock(testProductId, 75);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProductId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].stock_quantity).toEqual(75);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent product', async () => {
    const result = await updateProductStock(99999, 100);

    expect(result).toBeNull();
  });

  it('should handle numeric conversions correctly', async () => {
    const result = await updateProductStock(testProductId, 25);

    expect(result).not.toBeNull();
    expect(result!.price).toEqual(199.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.stock_quantity).toEqual(25);
  });
});
