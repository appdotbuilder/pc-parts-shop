
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, wishlistItemsTable } from '../db/schema';
import { type AddToWishlistInput, type CreateUserInput, type CreateProductInput } from '../schema';
import { addToWishlist, getWishlistItems, removeFromWishlist } from '../handlers/manage_wishlist';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer'
};

const testProduct: CreateProductInput = {
  name: 'Test GPU',
  brand: 'NVIDIA',
  category: 'gpu',
  description: 'A test graphics card',
  price: 599.99,
  stock_quantity: 10,
  low_stock_threshold: 5,
  is_active: true
};

const inactiveProduct: CreateProductInput = {
  name: 'Inactive GPU',
  brand: 'AMD',
  category: 'gpu',
  description: 'An inactive graphics card',
  price: 499.99,
  stock_quantity: 5,
  low_stock_threshold: 2,
  is_active: false
};

describe('manage_wishlist', () => {
  let userId: number;
  let productId: number;
  let inactiveProductId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: testUser.role
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test products
    const productResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        brand: testProduct.brand,
        category: testProduct.category,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock_quantity: testProduct.stock_quantity,
        low_stock_threshold: testProduct.low_stock_threshold,
        is_active: testProduct.is_active
      })
      .returning()
      .execute();
    productId = productResult[0].id;

    const inactiveProductResult = await db.insert(productsTable)
      .values({
        name: inactiveProduct.name,
        brand: inactiveProduct.brand,
        category: inactiveProduct.category,
        description: inactiveProduct.description,
        price: inactiveProduct.price.toString(),
        stock_quantity: inactiveProduct.stock_quantity,
        low_stock_threshold: inactiveProduct.low_stock_threshold,
        is_active: inactiveProduct.is_active
      })
      .returning()
      .execute();
    inactiveProductId = inactiveProductResult[0].id;
  });

  afterEach(resetDB);

  describe('addToWishlist', () => {
    it('should add product to wishlist', async () => {
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: productId
      };

      const result = await addToWishlist(input);

      expect(result.user_id).toEqual(userId);
      expect(result.product_id).toEqual(productId);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save wishlist item to database', async () => {
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: productId
      };

      const result = await addToWishlist(input);

      const savedItems = await db.select()
        .from(wishlistItemsTable)
        .where(eq(wishlistItemsTable.id, result.id))
        .execute();

      expect(savedItems).toHaveLength(1);
      expect(savedItems[0].user_id).toEqual(userId);
      expect(savedItems[0].product_id).toEqual(productId);
    });

    it('should throw error for non-existent user', async () => {
      const input: AddToWishlistInput = {
        user_id: 99999,
        product_id: productId
      };

      await expect(addToWishlist(input)).rejects.toThrow(/user not found/i);
    });

    it('should throw error for non-existent product', async () => {
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: 99999
      };

      await expect(addToWishlist(input)).rejects.toThrow(/product not found/i);
    });

    it('should throw error for inactive product', async () => {
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: inactiveProductId
      };

      await expect(addToWishlist(input)).rejects.toThrow(/product is not active/i);
    });

    it('should throw error for duplicate wishlist item', async () => {
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: productId
      };

      // Add item first time
      await addToWishlist(input);

      // Try to add same item again
      await expect(addToWishlist(input)).rejects.toThrow(/product already in wishlist/i);
    });
  });

  describe('getWishlistItems', () => {
    it('should return empty array for user with no wishlist items', async () => {
      const result = await getWishlistItems(userId);

      expect(result).toHaveLength(0);
    });

    it('should return wishlist items for user', async () => {
      // Add item to wishlist first
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: productId
      };
      await addToWishlist(input);

      const result = await getWishlistItems(userId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toEqual(userId);
      expect(result[0].product_id).toEqual(productId);
      expect(result[0].created_at).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent user', async () => {
      await expect(getWishlistItems(99999)).rejects.toThrow(/user not found/i);
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove wishlist item', async () => {
      // Add item to wishlist first
      const input: AddToWishlistInput = {
        user_id: userId,
        product_id: productId
      };
      const addedItem = await addToWishlist(input);

      const result = await removeFromWishlist(addedItem.id);

      expect(result).toBe(true);

      // Verify item was removed from database
      const remainingItems = await db.select()
        .from(wishlistItemsTable)
        .where(eq(wishlistItemsTable.id, addedItem.id))
        .execute();

      expect(remainingItems).toHaveLength(0);
    });

    it('should throw error for non-existent wishlist item', async () => {
      await expect(removeFromWishlist(99999)).rejects.toThrow(/wishlist item not found/i);
    });
  });
});
