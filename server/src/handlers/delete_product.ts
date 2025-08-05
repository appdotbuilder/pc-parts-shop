
import { db } from '../db';
import { productsTable, orderItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    // Check if product exists
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (existingProducts.length === 0) {
      return false; // Product doesn't exist
    }

    // Check if product is referenced in any orders
    const orderReferences = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.product_id, id))
      .limit(1)
      .execute();

    if (orderReferences.length > 0) {
      // Product is referenced in orders, perform soft delete
      const result = await db.update(productsTable)
        .set({ 
          is_active: false,
          updated_at: new Date()
        })
        .where(eq(productsTable.id, id))
        .returning()
        .execute();

      return result.length > 0;
    } else {
      // No order references, perform hard delete
      const result = await db.delete(productsTable)
        .where(eq(productsTable.id, id))
        .returning()
        .execute();

      return result.length > 0;
    }
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
