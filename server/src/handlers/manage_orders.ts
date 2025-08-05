
import { db } from '../db';
import { ordersTable, orderItemsTable, productsTable, usersTable } from '../db/schema';
import { type CreateOrderInput, type UpdateOrderStatusInput, type Order, type CreateOrderItemInput, type OrderItem } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    const result = await db.insert(ordersTable)
      .values({
        user_id: input.user_id,
        status: 'pending',
        total_amount: input.total_amount.toString(),
        shipping_address: input.shipping_address,
        billing_address: input.billing_address
      })
      .returning()
      .execute();

    const order = result[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};

export const createOrderItem = async (input: CreateOrderItemInput): Promise<OrderItem> => {
  try {
    const result = await db.insert(orderItemsTable)
      .values({
        order_id: input.order_id,
        product_id: input.product_id,
        quantity: input.quantity,
        price_at_time: input.price_at_time.toString()
      })
      .returning()
      .execute();

    const orderItem = result[0];
    return {
      ...orderItem,
      price_at_time: parseFloat(orderItem.price_at_time)
    };
  } catch (error) {
    console.error('Order item creation failed:', error);
    throw error;
  }
};

export const updateOrderStatus = async (input: UpdateOrderStatusInput): Promise<Order | null> => {
  try {
    const result = await db.update(ordersTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    const order = result[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order status update failed:', error);
    throw error;
  }
};

export const getOrdersByUser = async (userId: number): Promise<Order[]> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.user_id, userId))
      .orderBy(desc(ordersTable.created_at))
      .execute();

    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Fetching user orders failed:', error);
    throw error;
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.created_at))
      .execute();

    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Fetching all orders failed:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: number): Promise<Order | null> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const order = results[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Fetching order by ID failed:', error);
    throw error;
  }
};
