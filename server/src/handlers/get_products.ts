
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product, type ProductFilters } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export const getProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters) {
      if (filters.category) {
        conditions.push(eq(productsTable.category, filters.category));
      }

      if (filters.brand) {
        conditions.push(eq(productsTable.brand, filters.brand));
      }

      if (filters.min_price !== undefined) {
        conditions.push(gte(productsTable.price, filters.min_price.toString()));
      }

      if (filters.max_price !== undefined) {
        conditions.push(lte(productsTable.price, filters.max_price.toString()));
      }

      if (filters.gpu_chipset) {
        conditions.push(eq(productsTable.gpu_chipset, filters.gpu_chipset));
      }

      if (filters.cpu_socket) {
        conditions.push(eq(productsTable.cpu_socket, filters.cpu_socket));
      }

      if (filters.ram_capacity !== undefined) {
        conditions.push(eq(productsTable.ram_capacity, filters.ram_capacity));
      }

      if (filters.ram_type) {
        conditions.push(eq(productsTable.ram_type, filters.ram_type));
      }

      if (filters.ssd_interface) {
        conditions.push(eq(productsTable.ssd_interface, filters.ssd_interface));
      }

      if (filters.motherboard_form_factor) {
        conditions.push(eq(productsTable.motherboard_form_factor, filters.motherboard_form_factor));
      }

      if (filters.in_stock_only) {
        conditions.push(gte(productsTable.stock_quantity, 1));
      }
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(productsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(productsTable)
          .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price),
      cpu_base_clock: product.cpu_base_clock ? parseFloat(product.cpu_base_clock) : null,
      cpu_boost_clock: product.cpu_boost_clock ? parseFloat(product.cpu_boost_clock) : null
    }));
  } catch (error) {
    console.error('Get products failed:', error);
    throw error;
  }
};

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    return {
      ...product,
      price: parseFloat(product.price),
      cpu_base_clock: product.cpu_base_clock ? parseFloat(product.cpu_base_clock) : null,
      cpu_boost_clock: product.cpu_boost_clock ? parseFloat(product.cpu_boost_clock) : null
    };
  } catch (error) {
    console.error('Get product by ID failed:', error);
    throw error;
  }
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(lte(productsTable.stock_quantity, productsTable.low_stock_threshold))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price),
      cpu_base_clock: product.cpu_base_clock ? parseFloat(product.cpu_base_clock) : null,
      cpu_boost_clock: product.cpu_boost_clock ? parseFloat(product.cpu_boost_clock) : null
    }));
  } catch (error) {
    console.error('Get low stock products failed:', error);
    throw error;
  }
};
