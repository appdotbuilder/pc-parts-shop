
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput, type CreateOrderItemInput, type UpdateOrderStatusInput } from '../schema';
import { createOrder, createOrderItem, updateOrderStatus, getOrdersByUser, getAllOrders, getOrderById } from '../handlers/manage_orders';
import { eq } from 'drizzle-orm';

describe('Order Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test GPU',
        brand: 'NVIDIA',
        category: 'gpu',
        description: 'Test graphics card',
        price: '599.99',
        stock_quantity: 50,
        low_stock_threshold: 5,
        is_active: true
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;
  });

  describe('createOrder', () => {
    const testOrderInput: CreateOrderInput = {
      user_id: 0, // Will be set in beforeEach
      total_amount: 1199.98,
      shipping_address: '123 Main St, City, State 12345',
      billing_address: '456 Oak Ave, City, State 12345'
    };

    beforeEach(() => {
      testOrderInput.user_id = testUserId;
    });

    it('should create an order', async () => {
      const result = await createOrder(testOrderInput);

      expect(result.user_id).toEqual(testUserId);
      expect(result.status).toEqual('pending');
      expect(result.total_amount).toEqual(1199.98);
      expect(result.shipping_address).toEqual(testOrderInput.shipping_address);
      expect(result.billing_address).toEqual(testOrderInput.billing_address);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save order to database', async () => {
      const result = await createOrder(testOrderInput);

      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, result.id))
        .execute();

      expect(orders).toHaveLength(1);
      expect(orders[0].user_id).toEqual(testUserId);
      expect(orders[0].status).toEqual('pending');
      expect(parseFloat(orders[0].total_amount)).toEqual(1199.98);
    });

    it('should handle numeric conversion correctly', async () => {
      const result = await createOrder(testOrderInput);

      expect(typeof result.total_amount).toEqual('number');
      expect(result.total_amount).toEqual(1199.98);
    });
  });

  describe('createOrderItem', () => {
    let testOrderId: number;

    beforeEach(async () => {
      const order = await createOrder({
        user_id: testUserId,
        total_amount: 599.99,
        shipping_address: '123 Main St',
        billing_address: '123 Main St'
      });
      testOrderId = order.id;
    });

    const testOrderItemInput: CreateOrderItemInput = {
      order_id: 0, // Will be set in beforeEach
      product_id: 0, // Will be set in beforeEach
      quantity: 2,
      price_at_time: 599.99
    };

    beforeEach(() => {
      testOrderItemInput.order_id = testOrderId;
      testOrderItemInput.product_id = testProductId;
    });

    it('should create an order item', async () => {
      const result = await createOrderItem(testOrderItemInput);

      expect(result.order_id).toEqual(testOrderId);
      expect(result.product_id).toEqual(testProductId);
      expect(result.quantity).toEqual(2);
      expect(result.price_at_time).toEqual(599.99);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save order item to database', async () => {
      const result = await createOrderItem(testOrderItemInput);

      const orderItems = await db.select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.id, result.id))
        .execute();

      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].order_id).toEqual(testOrderId);
      expect(orderItems[0].product_id).toEqual(testProductId);
      expect(orderItems[0].quantity).toEqual(2);
      expect(parseFloat(orderItems[0].price_at_time)).toEqual(599.99);
    });

    it('should handle numeric conversion correctly', async () => {
      const result = await createOrderItem(testOrderItemInput);

      expect(typeof result.price_at_time).toEqual('number');
      expect(result.price_at_time).toEqual(599.99);
    });
  });

  describe('updateOrderStatus', () => {
    let testOrderId: number;

    beforeEach(async () => {
      const order = await createOrder({
        user_id: testUserId,
        total_amount: 599.99,
        shipping_address: '123 Main St',
        billing_address: '123 Main St'
      });
      testOrderId = order.id;
    });

    it('should update order status', async () => {
      const updateInput: UpdateOrderStatusInput = {
        id: testOrderId,
        status: 'processing'
      };

      const result = await updateOrderStatus(updateInput);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(testOrderId);
      expect(result!.status).toEqual('processing');
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent order', async () => {
      const updateInput: UpdateOrderStatusInput = {
        id: 99999,
        status: 'processing'
      };

      const result = await updateOrderStatus(updateInput);

      expect(result).toBeNull();
    });

    it('should update status in database', async () => {
      const updateInput: UpdateOrderStatusInput = {
        id: testOrderId,
        status: 'shipped'
      };

      await updateOrderStatus(updateInput);

      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, testOrderId))
        .execute();

      expect(orders[0].status).toEqual('shipped');
    });
  });

  describe('getOrdersByUser', () => {
    beforeEach(async () => {
      // Create multiple orders for the test user
      await createOrder({
        user_id: testUserId,
        total_amount: 599.99,
        shipping_address: '123 Main St',
        billing_address: '123 Main St'
      });

      await createOrder({
        user_id: testUserId,
        total_amount: 299.99,
        shipping_address: '456 Oak Ave',
        billing_address: '456 Oak Ave'
      });

      // Create order for different user
      const otherUserResult = await db.insert(usersTable)
        .values({
          email: 'other@example.com',
          password_hash: 'hashed_password',
          first_name: 'Other',
          last_name: 'User',
          role: 'customer'
        })
        .returning()
        .execute();

      await createOrder({
        user_id: otherUserResult[0].id,
        total_amount: 199.99,
        shipping_address: '789 Pine St',
        billing_address: '789 Pine St'
      });
    });

    it('should return orders for specific user', async () => {
      const result = await getOrdersByUser(testUserId);

      expect(result).toHaveLength(2);
      result.forEach(order => {
        expect(order.user_id).toEqual(testUserId);
        expect(typeof order.total_amount).toEqual('number');
      });
    });

    it('should return orders in descending order by created_at', async () => {
      const result = await getOrdersByUser(testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].created_at >= result[1].created_at).toBe(true);
    });

    it('should return empty array for user with no orders', async () => {
      const result = await getOrdersByUser(99999);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAllOrders', () => {
    beforeEach(async () => {
      // Create multiple orders
      await createOrder({
        user_id: testUserId,
        total_amount: 599.99,
        shipping_address: '123 Main St',
        billing_address: '123 Main St'
      });

      await createOrder({
        user_id: testUserId,
        total_amount: 299.99,
        shipping_address: '456 Oak Ave',
        billing_address: '456 Oak Ave'
      });
    });

    it('should return all orders', async () => {
      const result = await getAllOrders();

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(order => {
        expect(typeof order.total_amount).toEqual('number');
        expect(order.created_at).toBeInstanceOf(Date);
      });
    });

    it('should return orders in descending order by created_at', async () => {
      const result = await getAllOrders();

      if (result.length > 1) {
        expect(result[0].created_at >= result[1].created_at).toBe(true);
      }
    });
  });

  describe('getOrderById', () => {
    let testOrderId: number;

    beforeEach(async () => {
      const order = await createOrder({
        user_id: testUserId,
        total_amount: 599.99,
        shipping_address: '123 Main St',
        billing_address: '123 Main St'
      });
      testOrderId = order.id;
    });

    it('should return order by ID', async () => {
      const result = await getOrderById(testOrderId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(testOrderId);
      expect(result!.user_id).toEqual(testUserId);
      expect(typeof result!.total_amount).toEqual('number');
      expect(result!.total_amount).toEqual(599.99);
    });

    it('should return null for non-existent order', async () => {
      const result = await getOrderById(99999);

      expect(result).toBeNull();
    });
  });
});
