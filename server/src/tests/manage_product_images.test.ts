
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productImagesTable } from '../db/schema';
import { type AddProductImageInput, type CreateProductInput } from '../schema';
import { addProductImage, getProductImages, deleteProductImage } from '../handlers/manage_product_images';
import { eq } from 'drizzle-orm';

// Test data - simplified to avoid optional numeric fields
const testProduct: CreateProductInput = {
  name: 'Test Graphics Card',
  brand: 'NVIDIA',
  category: 'gpu',
  description: 'High-performance GPU',
  price: 599.99,
  stock_quantity: 10,
  low_stock_threshold: 5,
  is_active: true,
  gpu_chipset: 'RTX 4060',
  gpu_memory: 8,
  gpu_memory_type: 'GDDR6'
};

const testImageInput: AddProductImageInput = {
  product_id: 1,
  image_url: 'https://example.com/gpu-front.jpg',
  alt_text: 'GPU front view',
  display_order: 1
};

// Helper function to create a product with proper type conversions
const createTestProduct = async (productData: CreateProductInput) => {
  return await db.insert(productsTable)
    .values({
      name: productData.name,
      brand: productData.brand,
      category: productData.category,
      description: productData.description,
      price: productData.price.toString(),
      stock_quantity: productData.stock_quantity,
      low_stock_threshold: productData.low_stock_threshold,
      is_active: productData.is_active,
      gpu_chipset: productData.gpu_chipset,
      gpu_memory: productData.gpu_memory,
      gpu_memory_type: productData.gpu_memory_type
    })
    .returning()
    .execute();
};

describe('manage_product_images', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('addProductImage', () => {
    it('should add a product image', async () => {
      // Create a product first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;
      const imageInput = { ...testImageInput, product_id: productId };

      const result = await addProductImage(imageInput);

      expect(result.product_id).toEqual(productId);
      expect(result.image_url).toEqual('https://example.com/gpu-front.jpg');
      expect(result.alt_text).toEqual('GPU front view');
      expect(result.display_order).toEqual(1);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save image to database', async () => {
      // Create a product first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;
      const imageInput = { ...testImageInput, product_id: productId };

      const result = await addProductImage(imageInput);

      const images = await db.select()
        .from(productImagesTable)
        .where(eq(productImagesTable.id, result.id))
        .execute();

      expect(images).toHaveLength(1);
      expect(images[0].product_id).toEqual(productId);
      expect(images[0].image_url).toEqual('https://example.com/gpu-front.jpg');
      expect(images[0].alt_text).toEqual('GPU front view');
      expect(images[0].display_order).toEqual(1);
    });

    it('should throw error for non-existent product', async () => {
      const imageInput = { ...testImageInput, product_id: 999 };

      await expect(addProductImage(imageInput)).rejects.toThrow(/Product with id 999 does not exist/i);
    });

    it('should handle null alt_text', async () => {
      // Create a product first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;
      const imageInput = {
        product_id: productId,
        image_url: 'https://example.com/gpu-side.jpg',
        alt_text: null,
        display_order: 2
      };

      const result = await addProductImage(imageInput);

      expect(result.alt_text).toBeNull();
      expect(result.image_url).toEqual('https://example.com/gpu-side.jpg');
      expect(result.display_order).toEqual(2);
    });
  });

  describe('getProductImages', () => {
    it('should return empty array for product with no images', async () => {
      // Create a product first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;
      const result = await getProductImages(productId);

      expect(result).toEqual([]);
    });

    it('should return product images ordered by display_order', async () => {
      // Create a product first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;

      // Add multiple images with different display orders
      await addProductImage({
        product_id: productId,
        image_url: 'https://example.com/gpu-back.jpg',
        alt_text: 'GPU back view',
        display_order: 3
      });

      await addProductImage({
        product_id: productId,
        image_url: 'https://example.com/gpu-front.jpg',
        alt_text: 'GPU front view',
        display_order: 1
      });

      await addProductImage({
        product_id: productId,
        image_url: 'https://example.com/gpu-side.jpg',
        alt_text: 'GPU side view',
        display_order: 2
      });

      const result = await getProductImages(productId);

      expect(result).toHaveLength(3);
      expect(result[0].display_order).toEqual(1);
      expect(result[0].image_url).toContain('gpu-front.jpg');
      expect(result[1].display_order).toEqual(2);
      expect(result[1].image_url).toContain('gpu-side.jpg');
      expect(result[2].display_order).toEqual(3);
      expect(result[2].image_url).toContain('gpu-back.jpg');
    });

    it('should return only images for specified product', async () => {
      // Create two products
      const product1 = await createTestProduct({
        ...testProduct,
        name: 'Product 1'
      });

      const product2 = await createTestProduct({
        ...testProduct,
        name: 'Product 2'
      });

      // Add images to both products
      await addProductImage({
        product_id: product1[0].id,
        image_url: 'https://example.com/product1.jpg',
        alt_text: 'Product 1 image',
        display_order: 1
      });

      await addProductImage({
        product_id: product2[0].id,
        image_url: 'https://example.com/product2.jpg',
        alt_text: 'Product 2 image',
        display_order: 1
      });

      const result = await getProductImages(product1[0].id);

      expect(result).toHaveLength(1);
      expect(result[0].product_id).toEqual(product1[0].id);
      expect(result[0].image_url).toContain('product1.jpg');
    });
  });

  describe('deleteProductImage', () => {
    it('should delete existing product image', async () => {
      // Create a product and image first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;
      const imageResult = await addProductImage({
        ...testImageInput,
        product_id: productId
      });

      const deleteResult = await deleteProductImage(imageResult.id);

      expect(deleteResult).toBe(true);

      // Verify image was deleted
      const images = await db.select()
        .from(productImagesTable)
        .where(eq(productImagesTable.id, imageResult.id))
        .execute();

      expect(images).toHaveLength(0);
    });

    it('should return false for non-existent image', async () => {
      const result = await deleteProductImage(999);

      expect(result).toBe(false);
    });

    it('should not affect other images when deleting one', async () => {
      // Create a product first
      const productResult = await createTestProduct(testProduct);
      const productId = productResult[0].id;

      // Add two images
      const image1 = await addProductImage({
        product_id: productId,
        image_url: 'https://example.com/image1.jpg',
        alt_text: 'Image 1',
        display_order: 1
      });

      const image2 = await addProductImage({
        product_id: productId,
        image_url: 'https://example.com/image2.jpg',
        alt_text: 'Image 2',
        display_order: 2
      });

      // Delete first image
      const deleteResult = await deleteProductImage(image1.id);
      expect(deleteResult).toBe(true);

      // Verify second image still exists
      const remainingImages = await getProductImages(productId);
      expect(remainingImages).toHaveLength(1);
      expect(remainingImages[0].id).toEqual(image2.id);
      expect(remainingImages[0].image_url).toContain('image2.jpg');
    });
  });
});
