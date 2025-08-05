
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product | null> => {
  try {
    // Prepare update data with numeric conversions
    const updateData: any = { ...input };
    delete updateData.id; // Remove id from update data

    // Convert numeric fields to strings for database storage
    if (updateData.price !== undefined) {
      updateData.price = updateData.price.toString();
    }
    if (updateData.cpu_base_clock !== undefined) {
      updateData.cpu_base_clock = updateData.cpu_base_clock?.toString();
    }
    if (updateData.cpu_boost_clock !== undefined) {
      updateData.cpu_boost_clock = updateData.cpu_boost_clock?.toString();
    }

    // Set updated_at timestamp
    updateData.updated_at = new Date();

    // Update the product
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price),
      cpu_base_clock: product.cpu_base_clock ? parseFloat(product.cpu_base_clock) : null,
      cpu_boost_clock: product.cpu_boost_clock ? parseFloat(product.cpu_boost_clock) : null
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};

export const updateProductStock = async (productId: number, newStock: number): Promise<Product | null> => {
  try {
    // Update stock quantity with timestamp
    const result = await db.update(productsTable)
      .set({
        stock_quantity: newStock,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, productId))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price),
      cpu_base_clock: product.cpu_base_clock ? parseFloat(product.cpu_base_clock) : null,
      cpu_boost_clock: product.cpu_boost_clock ? parseFloat(product.cpu_boost_clock) : null
    };
  } catch (error) {
    console.error('Product stock update failed:', error);
    throw error;
  }
};
