
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['customer', 'admin']);
export const productCategorySchema = z.enum(['gpu', 'cpu', 'motherboard', 'ram', 'ssd']);
export const orderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const ramTypeSchema = z.enum(['DDR4', 'DDR5']);
export const storageInterfaceSchema = z.enum(['SATA', 'NVMe']);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema.default('customer')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  brand: z.string(),
  category: productCategorySchema,
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  low_stock_threshold: z.number().int(),
  is_active: z.boolean(),
  // GPU specific fields
  gpu_chipset: z.string().nullable(),
  gpu_memory: z.number().nullable(),
  gpu_memory_type: z.string().nullable(),
  // CPU specific fields
  cpu_socket: z.string().nullable(),
  cpu_cores: z.number().int().nullable(),
  cpu_threads: z.number().int().nullable(),
  cpu_base_clock: z.number().nullable(),
  cpu_boost_clock: z.number().nullable(),
  // Motherboard specific fields
  motherboard_socket: z.string().nullable(),
  motherboard_chipset: z.string().nullable(),
  motherboard_form_factor: z.string().nullable(),
  // RAM specific fields
  ram_capacity: z.number().nullable(),
  ram_speed: z.number().nullable(),
  ram_type: ramTypeSchema.nullable(),
  // SSD specific fields
  ssd_capacity: z.number().nullable(),
  ssd_interface: storageInterfaceSchema.nullable(),
  ssd_read_speed: z.number().nullable(),
  ssd_write_speed: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string(),
  brand: z.string(),
  category: productCategorySchema,
  description: z.string().nullable(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  low_stock_threshold: z.number().int().nonnegative().default(10),
  is_active: z.boolean().default(true),
  // Optional category-specific fields
  gpu_chipset: z.string().optional(),
  gpu_memory: z.number().optional(),
  gpu_memory_type: z.string().optional(),
  cpu_socket: z.string().optional(),
  cpu_cores: z.number().int().optional(),
  cpu_threads: z.number().int().optional(),
  cpu_base_clock: z.number().optional(),
  cpu_boost_clock: z.number().optional(),
  motherboard_socket: z.string().optional(),
  motherboard_chipset: z.string().optional(),
  motherboard_form_factor: z.string().optional(),
  ram_capacity: z.number().optional(),
  ram_speed: z.number().optional(),
  ram_type: ramTypeSchema.optional(),
  ssd_capacity: z.number().optional(),
  ssd_interface: storageInterfaceSchema.optional(),
  ssd_read_speed: z.number().optional(),
  ssd_write_speed: z.number().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  brand: z.string().optional(),
  category: productCategorySchema.optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  gpu_chipset: z.string().nullable().optional(),
  gpu_memory: z.number().nullable().optional(),
  gpu_memory_type: z.string().nullable().optional(),
  cpu_socket: z.string().nullable().optional(),
  cpu_cores: z.number().int().nullable().optional(),
  cpu_threads: z.number().int().nullable().optional(),
  cpu_base_clock: z.number().nullable().optional(),
  cpu_boost_clock: z.number().nullable().optional(),
  motherboard_socket: z.string().nullable().optional(),
  motherboard_chipset: z.string().nullable().optional(),
  motherboard_form_factor: z.string().nullable().optional(),
  ram_capacity: z.number().nullable().optional(),
  ram_speed: z.number().nullable().optional(),
  ram_type: ramTypeSchema.nullable().optional(),
  ssd_capacity: z.number().nullable().optional(),
  ssd_interface: storageInterfaceSchema.nullable().optional(),
  ssd_read_speed: z.number().nullable().optional(),
  ssd_write_speed: z.number().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Product Image schemas
export const productImageSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  image_url: z.string().url(),
  alt_text: z.string().nullable(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type ProductImage = z.infer<typeof productImageSchema>;

export const addProductImageInputSchema = z.object({
  product_id: z.number(),
  image_url: z.string().url(),
  alt_text: z.string().nullable(),
  display_order: z.number().int().nonnegative()
});

export type AddProductImageInput = z.infer<typeof addProductImageInputSchema>;

// Cart schemas
export const cartItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const addToCartInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

// Order schemas
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  status: orderStatusSchema,
  total_amount: z.number(),
  shipping_address: z.string(),
  billing_address: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  user_id: z.number(),
  total_amount: z.number().positive(),
  shipping_address: z.string(),
  billing_address: z.string()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: orderStatusSchema
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

// Order Item schemas
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  price_at_time: z.number(),
  created_at: z.coerce.date()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderItemInputSchema = z.object({
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  price_at_time: z.number().positive()
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;

// Wishlist schemas
export const wishlistItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  created_at: z.coerce.date()
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const addToWishlistInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number()
});

export type AddToWishlistInput = z.infer<typeof addToWishlistInputSchema>;

// Review schemas
export const reviewSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

export const createReviewInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable()
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Filter schemas
export const productFiltersSchema = z.object({
  category: productCategorySchema.optional(),
  brand: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  gpu_chipset: z.string().optional(),
  cpu_socket: z.string().optional(),
  ram_capacity: z.number().optional(),
  ram_type: ramTypeSchema.optional(),
  ssd_interface: storageInterfaceSchema.optional(),
  motherboard_form_factor: z.string().optional(),
  in_stock_only: z.boolean().optional()
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;
