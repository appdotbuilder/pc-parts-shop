
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record with proper numeric field conversions
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        brand: input.brand,
        category: input.category,
        description: input.description || null,
        price: input.price.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity,
        low_stock_threshold: input.low_stock_threshold || 10,
        is_active: input.is_active ?? true,
        // GPU specific fields
        gpu_chipset: input.gpu_chipset || null,
        gpu_memory: input.gpu_memory || null,
        gpu_memory_type: input.gpu_memory_type || null,
        // CPU specific fields
        cpu_socket: input.cpu_socket || null,
        cpu_cores: input.cpu_cores || null,
        cpu_threads: input.cpu_threads || null,
        cpu_base_clock: input.cpu_base_clock ? input.cpu_base_clock.toString() : null,
        cpu_boost_clock: input.cpu_boost_clock ? input.cpu_boost_clock.toString() : null,
        // Motherboard specific fields
        motherboard_socket: input.motherboard_socket || null,
        motherboard_chipset: input.motherboard_chipset || null,
        motherboard_form_factor: input.motherboard_form_factor || null,
        // RAM specific fields
        ram_capacity: input.ram_capacity || null,
        ram_speed: input.ram_speed || null,
        ram_type: input.ram_type || null,
        // SSD specific fields
        ssd_capacity: input.ssd_capacity || null,
        ssd_interface: input.ssd_interface || null,
        ssd_read_speed: input.ssd_read_speed || null,
        ssd_write_speed: input.ssd_write_speed || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price), // Convert string back to number
      cpu_base_clock: product.cpu_base_clock ? parseFloat(product.cpu_base_clock) : null,
      cpu_boost_clock: product.cpu_boost_clock ? parseFloat(product.cpu_boost_clock) : null
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
