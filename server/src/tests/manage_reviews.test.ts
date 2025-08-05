
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, ordersTable, orderItemsTable, reviewsTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview, getProductReviews, getUserReviews, updateReview, deleteReview } from '../handlers/manage_reviews';
import { eq, and } from 'drizzle-orm';

describe('manage_reviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;
  let testOrderId: number;

  const setupTestData = async () => {
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
        stock_quantity: 10,
        low_stock_threshold: 5,
        is_active: true
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: testUserId,
        status: 'delivered',
        total_amount: '599.99',
        shipping_address: '123 Test St',
        billing_address: '123 Test St'
      })
      .returning()
      .execute();
    testOrderId = orderResult[0].id;

    // Create order item to establish purchase history
    await db.insert(orderItemsTable)
      .values({
        order_id: testOrderId,
        product_id: testProductId,
        quantity: 1,
        price_at_time: '599.99'
      })
      .execute();
  };

  describe('createReview', () => {
    it('should create a review for purchased product', async () => {
      await setupTestData();

      const testInput: CreateReviewInput = {
        user_id: testUserId,
        product_id: testProductId,
        rating: 5,
        comment: 'Great graphics card!'
      };

      const result = await createReview(testInput);

      expect(result.user_id).toEqual(testUserId);
      expect(result.product_id).toEqual(testProductId);
      expect(result.rating).toEqual(5);
      expect(result.comment).toEqual('Great graphics card!');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save review to database', async () => {
      await setupTestData();

      const testInput: CreateReviewInput = {
        user_id: testUserId,
        product_id: testProductId,
        rating: 4,
        comment: 'Good product'
      };

      const result = await createReview(testInput);

      const reviews = await db.select()
        .from(reviewsTable)
        .where(eq(reviewsTable.id, result.id))
        .execute();

      expect(reviews).toHaveLength(1);
      expect(reviews[0].user_id).toEqual(testUserId);
      expect(reviews[0].product_id).toEqual(testProductId);
      expect(reviews[0].rating).toEqual(4);
      expect(reviews[0].comment).toEqual('Good product');
    });

    it('should create review with null comment', async () => {
      await setupTestData();

      const testInput: CreateReviewInput = {
        user_id: testUserId,
        product_id: testProductId,
        rating: 3,
        comment: null
      };

      const result = await createReview(testInput);

      expect(result.comment).toBeNull();
    });

    it('should reject review for non-purchased product', async () => {
      await setupTestData();

      // Create another product that user hasn't purchased
      const anotherProductResult = await db.insert(productsTable)
        .values({
          name: 'Another GPU',
          brand: 'AMD',
          category: 'gpu',
          description: 'Another graphics card',
          price: '499.99',
          stock_quantity: 5,
          low_stock_threshold: 2,
          is_active: true
        })
        .returning()
        .execute();

      const testInput: CreateReviewInput = {
        user_id: testUserId,
        product_id: anotherProductResult[0].id,
        rating: 5,
        comment: 'Never bought this'
      };

      expect(createReview(testInput)).rejects.toThrow(/must purchase product before reviewing/i);
    });

    it('should reject duplicate review', async () => {
      await setupTestData();

      const testInput: CreateReviewInput = {
        user_id: testUserId,
        product_id: testProductId,
        rating: 5,
        comment: 'First review'
      };

      await createReview(testInput);

      const duplicateInput: CreateReviewInput = {
        user_id: testUserId,
        product_id: testProductId,
        rating: 4,
        comment: 'Second review'
      };

      expect(createReview(duplicateInput)).rejects.toThrow(/already reviewed this product/i);
    });
  });

  describe('getProductReviews', () => {
    it('should fetch all reviews for a product', async () => {
      await setupTestData();

      // Create multiple users and reviews
      const user2Result = await db.insert(usersTable)
        .values({
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          first_name: 'User',
          last_name: 'Two',
          role: 'customer'
        })
        .returning()
        .execute();

      const order2Result = await db.insert(ordersTable)
        .values({
          user_id: user2Result[0].id,
          status: 'delivered',
          total_amount: '599.99',
          shipping_address: '456 Test Ave',
          billing_address: '456 Test Ave'
        })
        .returning()
        .execute();

      await db.insert(orderItemsTable)
        .values({
          order_id: order2Result[0].id,
          product_id: testProductId,
          quantity: 1,
          price_at_time: '599.99'
        })
        .execute();

      // Create reviews from both users
      await createReview({
        user_id: testUserId,
        product_id: testProductId,
        rating: 5,
        comment: 'Excellent!'
      });

      await createReview({
        user_id: user2Result[0].id,
        product_id: testProductId,
        rating: 4,
        comment: 'Very good'
      });

      const reviews = await getProductReviews(testProductId);

      expect(reviews).toHaveLength(2);
      expect(reviews.some(r => r.user_id === testUserId)).toBe(true);
      expect(reviews.some(r => r.user_id === user2Result[0].id)).toBe(true);
      expect(reviews.every(r => r.product_id === testProductId)).toBe(true);
    });

    it('should return empty array for product with no reviews', async () => {
      await setupTestData();

      const reviews = await getProductReviews(testProductId);

      expect(reviews).toHaveLength(0);
    });
  });

  describe('getUserReviews', () => {
    it('should fetch all reviews by a user', async () => {
      await setupTestData();

      // Create another product and purchase
      const product2Result = await db.insert(productsTable)
        .values({
          name: 'Test CPU',
          brand: 'Intel',
          category: 'cpu',
          description: 'Test processor',
          price: '299.99',
          stock_quantity: 8,
          low_stock_threshold: 3,
          is_active: true
        })
        .returning()
        .execute();

      await db.insert(orderItemsTable)
        .values({
          order_id: testOrderId,
          product_id: product2Result[0].id,
          quantity: 1,
          price_at_time: '299.99'
        })
        .execute();

      // Create reviews for both products
      await createReview({
        user_id: testUserId,
        product_id: testProductId,
        rating: 5,
        comment: 'Great GPU!'
      });

      await createReview({
        user_id: testUserId,
        product_id: product2Result[0].id,
        rating: 4,
        comment: 'Good CPU'
      });

      const reviews = await getUserReviews(testUserId);

      expect(reviews).toHaveLength(2);
      expect(reviews.every(r => r.user_id === testUserId)).toBe(true);
      expect(reviews.some(r => r.product_id === testProductId)).toBe(true);
      expect(reviews.some(r => r.product_id === product2Result[0].id)).toBe(true);
    });

    it('should return empty array for user with no reviews', async () => {
      await setupTestData();

      const reviews = await getUserReviews(testUserId);

      expect(reviews).toHaveLength(0);
    });
  });

  describe('updateReview', () => {
    it('should update review rating and comment', async () => {
      await setupTestData();

      const review = await createReview({
        user_id: testUserId,
        product_id: testProductId,
        rating: 3,
        comment: 'Original comment'
      });

      const updatedReview = await updateReview(review.id, 5, 'Updated comment');

      expect(updatedReview).not.toBeNull();
      expect(updatedReview!.id).toEqual(review.id);
      expect(updatedReview!.rating).toEqual(5);
      expect(updatedReview!.comment).toEqual('Updated comment');
      expect(updatedReview!.updated_at.getTime()).toBeGreaterThan(review.updated_at.getTime());
    });

    it('should update review with null comment', async () => {
      await setupTestData();

      const review = await createReview({
        user_id: testUserId,
        product_id: testProductId,
        rating: 4,
        comment: 'Will be removed'
      });

      const updatedReview = await updateReview(review.id, 3, null);

      expect(updatedReview).not.toBeNull();
      expect(updatedReview!.rating).toEqual(3);
      expect(updatedReview!.comment).toBeNull();
    });

    it('should return null for non-existent review', async () => {
      await setupTestData();

      const result = await updateReview(999, 5, 'Does not exist');

      expect(result).toBeNull();
    });
  });

  describe('deleteReview', () => {
    it('should delete existing review', async () => {
      await setupTestData();

      const review = await createReview({
        user_id: testUserId,
        product_id: testProductId,
        rating: 4,
        comment: 'To be deleted'
      });

      const deleted = await deleteReview(review.id);

      expect(deleted).toBe(true);

      const reviews = await db.select()
        .from(reviewsTable)
        .where(eq(reviewsTable.id, review.id))
        .execute();

      expect(reviews).toHaveLength(0);
    });

    it('should return false for non-existent review', async () => {
      await setupTestData();

      const result = await deleteReview(999);

      expect(result).toBe(false);
    });
  });
});
