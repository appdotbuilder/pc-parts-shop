
import { db } from '../db';
import { cartItemsTable, productsTable } from '../db/schema';
import { type AddToCartInput, type UpdateCartItemInput, type CartItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addToCart = async (input: AddToCartInput): Promise<CartItem> => {
  try {
    // Check if product exists and has sufficient stock
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    if (product[0].stock_quantity < input.quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already exists in cart
    const existingCartItem = await db.select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.user_id, input.user_id),
          eq(cartItemsTable.product_id, input.product_id)
        )
      )
      .execute();

    if (existingCartItem.length > 0) {
      // Update existing cart item quantity
      const newQuantity = existingCartItem[0].quantity + input.quantity;
      
      // Check if new total quantity exceeds stock
      if (newQuantity > product[0].stock_quantity) {
        throw new Error('Insufficient stock');
      }

      const result = await db.update(cartItemsTable)
        .set({
          quantity: newQuantity,
          updated_at: new Date()
        })
        .where(eq(cartItemsTable.id, existingCartItem[0].id))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new cart item
      const result = await db.insert(cartItemsTable)
        .values({
          user_id: input.user_id,
          product_id: input.product_id,
          quantity: input.quantity
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Add to cart failed:', error);
    throw error;
  }
};

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartItem | null> => {
  try {
    // Get cart item and verify it exists
    const cartItem = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, input.id))
      .execute();

    if (cartItem.length === 0) {
      return null;
    }

    // Check product stock availability
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, cartItem[0].product_id))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    if (product[0].stock_quantity < input.quantity) {
      throw new Error('Insufficient stock');
    }

    // Update cart item
    const result = await db.update(cartItemsTable)
      .set({
        quantity: input.quantity,
        updated_at: new Date()
      })
      .where(eq(cartItemsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Update cart item failed:', error);
    throw error;
  }
};

export const getCartItems = async (userId: number): Promise<CartItem[]> => {
  try {
    const result = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId))
      .execute();

    return result;
  } catch (error) {
    console.error('Get cart items failed:', error);
    throw error;
  }
};

export const removeFromCart = async (cartItemId: number): Promise<boolean> => {
  try {
    const result = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Remove from cart failed:', error);
    throw error;
  }
};

export const clearCart = async (userId: number): Promise<boolean> => {
  try {
    const result = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Clear cart failed:', error);
    throw error;
  }
};
