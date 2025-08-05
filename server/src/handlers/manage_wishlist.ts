
import { db } from '../db';
import { wishlistItemsTable, productsTable, usersTable } from '../db/schema';
import { type AddToWishlistInput, type WishlistItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addToWishlist = async (input: AddToWishlistInput): Promise<WishlistItem> => {
  try {
    // Verify user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Verify product exists and is active
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    if (!product[0].is_active) {
      throw new Error('Product is not active');
    }

    // Check if item already exists in wishlist
    const existingItem = await db.select()
      .from(wishlistItemsTable)
      .where(and(
        eq(wishlistItemsTable.user_id, input.user_id),
        eq(wishlistItemsTable.product_id, input.product_id)
      ))
      .execute();

    if (existingItem.length > 0) {
      throw new Error('Product already in wishlist');
    }

    // Add item to wishlist
    const result = await db.insert(wishlistItemsTable)
      .values({
        user_id: input.user_id,
        product_id: input.product_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add to wishlist failed:', error);
    throw error;
  }
};

export const getWishlistItems = async (userId: number): Promise<WishlistItem[]> => {
  try {
    // Verify user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Get wishlist items for user
    const result = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.user_id, userId))
      .execute();

    return result;
  } catch (error) {
    console.error('Get wishlist items failed:', error);
    throw error;
  }
};

export const removeFromWishlist = async (wishlistItemId: number): Promise<boolean> => {
  try {
    // Check if wishlist item exists
    const existingItem = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.id, wishlistItemId))
      .execute();

    if (existingItem.length === 0) {
      throw new Error('Wishlist item not found');
    }

    // Remove item from wishlist
    const result = await db.delete(wishlistItemsTable)
      .where(eq(wishlistItemsTable.id, wishlistItemId))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Remove from wishlist failed:', error);
    throw error;
  }
};
