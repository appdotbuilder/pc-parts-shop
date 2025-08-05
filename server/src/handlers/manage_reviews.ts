
import { db } from '../db';
import { reviewsTable, orderItemsTable, ordersTable, usersTable } from '../db/schema';
import { type CreateReviewInput, type Review } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  try {
    // Check if user has purchased this product
    const purchaseCheck = await db.select()
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.order_id, ordersTable.id))
      .where(and(
        eq(ordersTable.user_id, input.user_id),
        eq(orderItemsTable.product_id, input.product_id)
      ))
      .limit(1)
      .execute();

    if (purchaseCheck.length === 0) {
      throw new Error('User must purchase product before reviewing');
    }

    // Check for existing review
    const existingReview = await db.select()
      .from(reviewsTable)
      .where(and(
        eq(reviewsTable.user_id, input.user_id),
        eq(reviewsTable.product_id, input.product_id)
      ))
      .limit(1)
      .execute();

    if (existingReview.length > 0) {
      throw new Error('User has already reviewed this product');
    }

    // Create review
    const result = await db.insert(reviewsTable)
      .values({
        user_id: input.user_id,
        product_id: input.product_id,
        rating: input.rating,
        comment: input.comment
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Review creation failed:', error);
    throw error;
  }
};

export const getProductReviews = async (productId: number): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.product_id, productId))
      .execute();

    return results;
  } catch (error) {
    console.error('Product reviews fetch failed:', error);
    throw error;
  }
};

export const getUserReviews = async (userId: number): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('User reviews fetch failed:', error);
    throw error;
  }
};

export const updateReview = async (reviewId: number, rating: number, comment: string | null): Promise<Review | null> => {
  try {
    const result = await db.update(reviewsTable)
      .set({
        rating: rating,
        comment: comment,
        updated_at: new Date()
      })
      .where(eq(reviewsTable.id, reviewId))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Review update failed:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId: number): Promise<boolean> => {
  try {
    const result = await db.delete(reviewsTable)
      .where(eq(reviewsTable.id, reviewId))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Review deletion failed:', error);
    throw error;
  }
};
