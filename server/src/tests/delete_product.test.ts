
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, usersTable, ordersTable, orderItemsTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer' as const
};

const testProduct = {
  name: 'Test GPU',
  brand: 'NVIDIA',
  category: 'gpu' as const,
  description: 'A test graphics card',
  price: '599.99',
  stock_quantity: 50,
  low_stock_threshold: 5,
  is_active: true,
  gpu_chipset: 'RTX 4060',
  gpu_memory: 8,
  gpu_memory_type: 'GDDR6'
};

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return false for non-existent product', async () => {
    const result = await deleteProduct(999);
    expect(result).toBe(false);
  });

  it('should hard delete product with no order references', async () => {
    // Create product
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete product
    const deleteResult = await deleteProduct(productId);
    expect(deleteResult).toBe(true);

    // Verify product is completely removed
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should soft delete product with order references', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create product
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '599.99',
        shipping_address: '123 Test St',
        billing_address: '123 Test St'
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    // Create order item referencing the product
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        price_at_time: '599.99'
      })
      .execute();

    // Delete product
    const deleteResult = await deleteProduct(productId);
    expect(deleteResult).toBe(true);

    // Verify product still exists but is inactive
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].is_active).toBe(false);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should soft delete active product that becomes inactive', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        ...testProduct,
        is_active: true
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '599.99',
        shipping_address: '123 Test St',
        billing_address: '123 Test St'
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    // Create order item
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        price_at_time: '599.99'
      })
      .execute();

    // Verify product is initially active
    const initialProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(initialProducts[0].is_active).toBe(true);

    // Delete product
    const deleteResult = await deleteProduct(productId);
    expect(deleteResult).toBe(true);

    // Verify product is now inactive
    const finalProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(finalProducts).toHaveLength(1);
    expect(finalProducts[0].is_active).toBe(false);
    expect(finalProducts[0].name).toEqual('Test GPU');
    expect(finalProducts[0].brand).toEqual('NVIDIA');
  });

  it('should hard delete product with no dependencies', async () => {
    // Create multiple products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'CPU Test',
        brand: 'AMD',
        category: 'cpu' as const,
        description: 'Test processor',
        price: '299.99',
        stock_quantity: 25,
        low_stock_threshold: 5,
        is_active: true,
        cpu_socket: 'AM4',
        cpu_cores: 6,
        cpu_threads: 12,
        cpu_base_clock: '3.60', // Convert to string for numeric column
        cpu_boost_clock: '4.20'  // Convert to string for numeric column
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Delete first product (no dependencies)
    const deleteResult = await deleteProduct(product1Id);
    expect(deleteResult).toBe(true);

    // Verify only first product is deleted
    const remainingProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(remainingProducts).toHaveLength(1);
    expect(remainingProducts[0].id).toEqual(product2Id);
    expect(remainingProducts[0].name).toEqual('Test GPU');

    // Verify first product is completely removed
    const deletedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product1Id))
      .execute();

    expect(deletedProducts).toHaveLength(0);
  });
});
