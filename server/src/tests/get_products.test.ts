
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type ProductFilters } from '../schema';
import { getProducts, getProductById, getLowStockProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all products when no filters applied', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      }
    ]).execute();

    const results = await getProducts();

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('RTX 4080');
    expect(results[1].name).toEqual('Intel i7-13700K');
    expect(typeof results[0].price).toBe('number');
    expect(results[0].price).toEqual(1199.99);
    expect(typeof results[1].cpu_base_clock).toBe('number');
    expect(results[1].cpu_base_clock).toEqual(3.4);
  });

  it('should filter by category', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      }
    ]).execute();

    const filters: ProductFilters = { category: 'gpu' };
    const results = await getProducts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].category).toEqual('gpu');
    expect(results[0].name).toEqual('RTX 4080');
  });

  it('should filter by brand', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      }
    ]).execute();

    const filters: ProductFilters = { brand: 'Intel' };
    const results = await getProducts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].brand).toEqual('Intel');
    expect(results[0].name).toEqual('Intel i7-13700K');
  });

  it('should filter by price range', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      }
    ]).execute();

    const filters: ProductFilters = { min_price: 400, max_price: 500 };
    const results = await getProducts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].price).toEqual(409.99);
    expect(results[0].price).toBeGreaterThanOrEqual(400);
    expect(results[0].price).toBeLessThanOrEqual(500);
  });

  it('should filter by category-specific attributes', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      },
      {
        name: 'Corsair Vengeance DDR5',
        brand: 'Corsair',
        category: 'ram',
        description: 'High-speed memory',
        price: '199.99',
        stock_quantity: 0,
        low_stock_threshold: 10,
        is_active: true,
        ram_capacity: 32,
        ram_speed: 5600,
        ram_type: 'DDR5'
      }
    ]).execute();

    const filters: ProductFilters = { ram_type: 'DDR5' };
    const results = await getProducts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].ram_type).toEqual('DDR5');
    expect(results[0].category).toEqual('ram');
  });

  it('should filter by in-stock only', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Corsair Vengeance DDR5',
        brand: 'Corsair',
        category: 'ram',
        description: 'High-speed memory',
        price: '199.99',
        stock_quantity: 0,
        low_stock_threshold: 10,
        is_active: true,
        ram_capacity: 32,
        ram_speed: 5600,
        ram_type: 'DDR5'
      }
    ]).execute();

    const filters: ProductFilters = { in_stock_only: true };
    const results = await getProducts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].stock_quantity).toBeGreaterThan(0);
    expect(results[0].name).toEqual('RTX 4080');
  });

  it('should combine multiple filters', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      }
    ]).execute();

    const filters: ProductFilters = { 
      category: 'gpu', 
      brand: 'NVIDIA',
      min_price: 1000 
    };
    const results = await getProducts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].category).toEqual('gpu');
    expect(results[0].brand).toEqual('NVIDIA');
    expect(results[0].price).toBeGreaterThanOrEqual(1000);
  });

  it('should return empty array when no products match filters', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      }
    ]).execute();

    const filters: ProductFilters = { category: 'motherboard' };
    const results = await getProducts(filters);

    expect(results).toHaveLength(0);
  });
});

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product by ID', async () => {
    // Insert test product
    const insertResult = await db.insert(productsTable).values({
      name: 'RTX 4080',
      brand: 'NVIDIA',
      category: 'gpu',
      description: 'High-performance graphics card',
      price: '1199.99',
      stock_quantity: 5,
      low_stock_threshold: 10,
      is_active: true,
      gpu_chipset: 'RTX 4080',
      gpu_memory: 16,
      gpu_memory_type: 'GDDR6X'
    }).returning().execute();

    const productId = insertResult[0].id;
    const result = await getProductById(productId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productId);
    expect(result!.name).toEqual('RTX 4080');
    expect(typeof result!.price).toBe('number');
    expect(result!.price).toEqual(1199.99);
    expect(result!.gpu_chipset).toEqual('RTX 4080');
  });

  it('should return null for non-existent product', async () => {
    const result = await getProductById(999);

    expect(result).toBeNull();
  });

  it('should convert numeric fields correctly', async () => {
    // Insert CPU product with numeric fields
    const insertResult = await db.insert(productsTable).values({
      name: 'Intel i7-13700K',
      brand: 'Intel',
      category: 'cpu',
      description: 'High-performance processor',
      price: '409.99',
      stock_quantity: 15,
      low_stock_threshold: 10,
      is_active: true,
      cpu_socket: 'LGA1700',
      cpu_cores: 16,
      cpu_threads: 24,
      cpu_base_clock: '3.4',
      cpu_boost_clock: '5.4'
    }).returning().execute();

    const result = await getProductById(insertResult[0].id);

    expect(result).not.toBeNull();
    expect(typeof result!.price).toBe('number');
    expect(typeof result!.cpu_base_clock).toBe('number');
    expect(typeof result!.cpu_boost_clock).toBe('number');
    expect(result!.cpu_base_clock).toEqual(3.4);
    expect(result!.cpu_boost_clock).toEqual(5.4);
  });
});

describe('getLowStockProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products with low stock', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'RTX 4080',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'High-performance graphics card',
        price: '1199.99',
        stock_quantity: 5,
        low_stock_threshold: 10,
        is_active: true,
        gpu_chipset: 'RTX 4080',
        gpu_memory: 16,
        gpu_memory_type: 'GDDR6X'
      },
      {
        name: 'Intel i7-13700K',
        brand: 'Intel',
        category: 'cpu',
        description: 'High-performance processor',
        price: '409.99',
        stock_quantity: 15,
        low_stock_threshold: 10,
        is_active: true,
        cpu_socket: 'LGA1700',
        cpu_cores: 16,
        cpu_threads: 24,
        cpu_base_clock: '3.4',
        cpu_boost_clock: '5.4'
      }
    ]).execute();

    const results = await getLowStockProducts();

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('RTX 4080');
    expect(results[0].stock_quantity).toBeLessThanOrEqual(results[0].low_stock_threshold);
    expect(results[0].stock_quantity).toEqual(5);
    expect(results[0].low_stock_threshold).toEqual(10);
  });

  it('should return products with zero stock', async () => {
    // Insert product with zero stock
    await db.insert(productsTable).values({
      name: 'Corsair Vengeance DDR5',
      brand: 'Corsair',
      category: 'ram',
      description: 'High-speed memory',
      price: '199.99',
      stock_quantity: 0,
      low_stock_threshold: 10,
      is_active: true,
      ram_capacity: 32,
      ram_speed: 5600,
      ram_type: 'DDR5'
    }).execute();

    const results = await getLowStockProducts();

    expect(results).toHaveLength(1);
    expect(results[0].stock_quantity).toEqual(0);
    expect(results[0].stock_quantity).toBeLessThanOrEqual(results[0].low_stock_threshold);
  });

  it('should return empty array when no low stock products', async () => {
    // Insert product with adequate stock
    await db.insert(productsTable).values({
      name: 'Intel i7-13700K',
      brand: 'Intel',
      category: 'cpu',
      description: 'High-performance processor',
      price: '409.99',
      stock_quantity: 15,
      low_stock_threshold: 10,
      is_active: true,
      cpu_socket: 'LGA1700',
      cpu_cores: 16,
      cpu_threads: 24,
      cpu_base_clock: '3.4',
      cpu_boost_clock: '5.4'
    }).execute();

    const results = await getLowStockProducts();

    expect(results).toHaveLength(0);
  });

  it('should convert numeric fields correctly', async () => {
    // Insert CPU product with numeric fields and low stock
    await db.insert(productsTable).values({
      name: 'Intel i7-13700K',
      brand: 'Intel',
      category: 'cpu',
      description: 'High-performance processor',
      price: '409.99',
      stock_quantity: 5, // Below threshold
      low_stock_threshold: 10,
      is_active: true,
      cpu_socket: 'LGA1700',
      cpu_cores: 16,
      cpu_threads: 24,
      cpu_base_clock: '3.4',
      cpu_boost_clock: '5.4'
    }).execute();

    const results = await getLowStockProducts();

    expect(results).toHaveLength(1);
    expect(typeof results[0].price).toBe('number');
    expect(typeof results[0].cpu_base_clock).toBe('number');
    expect(typeof results[0].cpu_boost_clock).toBe('number');
    expect(results[0].price).toEqual(409.99);
    expect(results[0].cpu_base_clock).toEqual(3.4);
    expect(results[0].cpu_boost_clock).toEqual(5.4);
  });
});
