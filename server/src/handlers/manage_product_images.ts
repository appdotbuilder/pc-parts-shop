
import { db } from '../db';
import { productImagesTable, productsTable } from '../db/schema';
import { type AddProductImageInput, type ProductImage } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const addProductImage = async (input: AddProductImageInput): Promise<ProductImage> => {
  try {
    // Verify the product exists
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with id ${input.product_id} does not exist`);
    }

    // Insert the product image
    const result = await db.insert(productImagesTable)
      .values({
        product_id: input.product_id,
        image_url: input.image_url,
        alt_text: input.alt_text,
        display_order: input.display_order
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Product image creation failed:', error);
    throw error;
  }
};

export const getProductImages = async (productId: number): Promise<ProductImage[]> => {
  try {
    const results = await db.select()
      .from(productImagesTable)
      .where(eq(productImagesTable.product_id, productId))
      .orderBy(asc(productImagesTable.display_order))
      .execute();

    return results;
  } catch (error) {
    console.error('Product images fetch failed:', error);
    throw error;
  }
};

export const deleteProductImage = async (imageId: number): Promise<boolean> => {
  try {
    // Check if the image exists
    const existingImages = await db.select()
      .from(productImagesTable)
      .where(eq(productImagesTable.id, imageId))
      .execute();

    if (existingImages.length === 0) {
      return false;
    }

    // Delete the image
    await db.delete(productImagesTable)
      .where(eq(productImagesTable.id, imageId))
      .execute();

    return true;
  } catch (error) {
    console.error('Product image deletion failed:', error);
    throw error;
  }
};
