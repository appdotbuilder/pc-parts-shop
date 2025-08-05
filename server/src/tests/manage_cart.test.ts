
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput, type UpdateCartItemInput } from '../schema';
import { addToCart, updateCartItem, getCartItems, removeFromCart, clearCart } from '../handlers/manage_cart';
import { eq } from 'drizzle-orm';

describe('Cart Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
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
        brand: 'TestBrand',
        category: 'gpu',
        description: 'A test GPU',
        price: '299.99',
        stock_quantity: 10,
        low_stock_threshold: 2,
        is_active: true
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;
  });

  describe('addToCart', () => {
    const testInput: AddToCartInput = {
      user_id: 0, // Will be set in tests
      product_id: 0, // Will be set in tests
      quantity: 2
    };

    it('should add new item to cart', async () => {
      const input = { ...testInput, user_id: testUserId, product_id: testProductId };
      const result = await addToCart(input);

      expect(result.user_id).toEqual(testUserId);
      expect(result.product_id).toEqual(testProductId);
      expect(result.quantity).toEqual(2);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should update existing cart item quantity', async () => {
      const input = { ...testInput, user_id: testUserId, product_id: testProductId };
      
      // Add item first time
      await addToCart(input);
      
      // Add same item again
      const result = await addToCart({ ...input, quantity: 3 });

      expect(result.quantity).toEqual(5); // 2 + 3
      expect(result.user_id).toEqual(testUserId);
      expect(result.product_id).toEqual(testProductId);

      // Verify only one cart item exists
      const cartItems = await getCartItems(testUserId);
      expect(cartItems).toHaveLength(1);
    });

    it('should throw error for non-existent product', async () => {
      const input = { ...testInput, user_id: testUserId, product_id: 999 };

      await expect(addToCart(input)).rejects.toThrow(/product not found/i);
    });

    it('should throw error for insufficient stock', async () => {
      const input = { ...testInput, user_id: testUserId, product_id: testProductId, quantity: 15 };

      await expect(addToCart(input)).rejects.toThrow(/insufficient stock/i);
    });

    it('should throw error when updating existing item exceeds stock', async () => {
      const input = { ...testInput, user_id: testUserId, product_id: testProductId, quantity: 8 };
      
      // Add 8 items first
      await addToCart(input);
      
      // Try to add 5 more (would total 13, but stock is only 10)
      const secondInput = { ...input, quantity: 5 };
      await expect(addToCart(secondInput)).rejects.toThrow(/insufficient stock/i);
    });
  });

  describe('updateCartItem', () => {
    let cartItemId: number;

    beforeEach(async () => {
      const cartItem = await addToCart({
        user_id: testUserId,
        product_id: testProductId,
        quantity: 3
      });
      cartItemId = cartItem.id;
    });

    it('should update cart item quantity', async () => {
      const input: UpdateCartItemInput = {
        id: cartItemId,
        quantity: 5
      };

      const result = await updateCartItem(input);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(cartItemId);
      expect(result!.quantity).toEqual(5);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent cart item', async () => {
      const input: UpdateCartItemInput = {
        id: 999,
        quantity: 2
      };

      const result = await updateCartItem(input);
      expect(result).toBeNull();
    });

    it('should throw error for insufficient stock', async () => {
      const input: UpdateCartItemInput = {
        id: cartItemId,
        quantity: 15
      };

      await expect(updateCartItem(input)).rejects.toThrow(/insufficient stock/i);
    });
  });

  describe('getCartItems', () => {
    it('should return empty array for user with no cart items', async () => {
      const result = await getCartItems(testUserId);
      expect(result).toEqual([]);
    });

    it('should return user cart items', async () => {
      // Add items to cart
      await addToCart({
        user_id: testUserId,
        product_id: testProductId,
        quantity: 2
      });

      const result = await getCartItems(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toEqual(testUserId);
      expect(result[0].product_id).toEqual(testProductId);
      expect(result[0].quantity).toEqual(2);
    });

    it('should return only items for specified user', async () => {
      // Create second user
      const user2Result = await db.insert(usersTable)
        .values({
          email: 'user2@example.com',
          password_hash: 'hash456',
          first_name: 'User',
          last_name: 'Two',
          role: 'customer'
        })
        .returning()
        .execute();
      const user2Id = user2Result[0].id;

      // Add items for both users
      await addToCart({ user_id: testUserId, product_id: testProductId, quantity: 1 });
      await addToCart({ user_id: user2Id, product_id: testProductId, quantity: 2 });

      const user1Items = await getCartItems(testUserId);
      const user2Items = await getCartItems(user2Id);

      expect(user1Items).toHaveLength(1);
      expect(user1Items[0].quantity).toEqual(1);
      expect(user2Items).toHaveLength(1);
      expect(user2Items[0].quantity).toEqual(2);
    });
  });

  describe('removeFromCart', () => {
    let cartItemId: number;

    beforeEach(async () => {
      const cartItem = await addToCart({
        user_id: testUserId,
        product_id: testProductId,
        quantity: 2
      });
      cartItemId = cartItem.id;
    });

    it('should remove cart item and return true', async () => {
      const result = await removeFromCart(cartItemId);

      expect(result).toBe(true);

      // Verify item was removed
      const cartItems = await getCartItems(testUserId);
      expect(cartItems).toHaveLength(0);
    });

    it('should return false for non-existent cart item', async () => {
      const result = await removeFromCart(999);
      expect(result).toBe(false);
    });

    it('should remove correct item when multiple exist', async () => {
      // Create second product and cart item
      const product2Result = await db.insert(productsTable)
        .values({
          name: 'Test CPU',
          brand: 'TestBrand',
          category: 'cpu',
          description: 'A test CPU',
          price: '199.99',
          stock_quantity: 5,
          low_stock_threshold: 1,
          is_active: true
        })
        .returning()
        .execute();

      const cartItem2 = await addToCart({
        user_id: testUserId,
        product_id: product2Result[0].id,
        quantity: 1
      });

      // Remove first item
      const result = await removeFromCart(cartItemId);
      expect(result).toBe(true);

      // Verify only second item remains
      const remainingItems = await getCartItems(testUserId);
      expect(remainingItems).toHaveLength(1);
      expect(remainingItems[0].id).toEqual(cartItem2.id);
    });
  });

  describe('clearCart', () => {
    it('should return false for user with no cart items', async () => {
      const result = await clearCart(testUserId);
      expect(result).toBe(false);
    });

    it('should clear all cart items for user and return true', async () => {
      // Add multiple items
      await addToCart({ user_id: testUserId, product_id: testProductId, quantity: 2 });
      
      // Create second product and add to cart
      const product2Result = await db.insert(productsTable)
        .values({
          name: 'Test CPU',  
          brand: 'TestBrand',
          category: 'cpu',
          description: 'A test CPU',
          price: '199.99',
          stock_quantity: 5,
          low_stock_threshold: 1,
          is_active: true
        })
        .returning()
        .execute();

      await addToCart({ user_id: testUserId, product_id: product2Result[0].id, quantity: 1 });

      // Clear cart
      const result = await clearCart(testUserId);
      expect(result).toBe(true);

      // Verify cart is empty
      const cartItems = await getCartItems(testUserId);
      expect(cartItems).toHaveLength(0);
    });

    it('should only clear items for specified user', async () => {
      // Create second user
      const user2Result = await db.insert(usersTable)
        .values({
          email: 'user2@example.com',
          password_hash: 'hash456',
          first_name: 'User',
          last_name: 'Two',
          role: 'customer'
        })
        .returning()
        .execute();
      const user2Id = user2Result[0].id;

      // Add items for both users
      await addToCart({ user_id: testUserId, product_id: testProductId, quantity: 1 });
      await addToCart({ user_id: user2Id, product_id: testProductId, quantity: 2 });

      // Clear cart for first user only
      const result = await clearCart(testUserId);
      expect(result).toBe(true);

      // Verify first user's cart is empty, second user's cart remains
      const user1Items = await getCartItems(testUserId);
      const user2Items = await getCartItems(user2Id);

      expect(user1Items).toHaveLength(0);
      expect(user2Items).toHaveLength(1);
    });
  });
});
