
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const productCategoryEnum = pgEnum('product_category', ['gpu', 'cpu', 'motherboard', 'ram', 'ssd']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const ramTypeEnum = pgEnum('ram_type', ['DDR4', 'DDR5']);
export const storageInterfaceEnum = pgEnum('storage_interface', ['SATA', 'NVMe']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: userRoleEnum('role').notNull().default('customer'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: productCategoryEnum('category').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  low_stock_threshold: integer('low_stock_threshold').notNull().default(10),
  is_active: boolean('is_active').notNull().default(true),
  // GPU specific fields
  gpu_chipset: text('gpu_chipset'),
  gpu_memory: integer('gpu_memory'),
  gpu_memory_type: text('gpu_memory_type'),
  // CPU specific fields
  cpu_socket: text('cpu_socket'),
  cpu_cores: integer('cpu_cores'),
  cpu_threads: integer('cpu_threads'),
  cpu_base_clock: numeric('cpu_base_clock', { precision: 5, scale: 2 }),
  cpu_boost_clock: numeric('cpu_boost_clock', { precision: 5, scale: 2 }),
  // Motherboard specific fields
  motherboard_socket: text('motherboard_socket'),
  motherboard_chipset: text('motherboard_chipset'),
  motherboard_form_factor: text('motherboard_form_factor'),
  // RAM specific fields
  ram_capacity: integer('ram_capacity'),
  ram_speed: integer('ram_speed'),
  ram_type: ramTypeEnum('ram_type'),
  // SSD specific fields
  ssd_capacity: integer('ssd_capacity'),
  ssd_interface: storageInterfaceEnum('ssd_interface'),
  ssd_read_speed: integer('ssd_read_speed'),
  ssd_write_speed: integer('ssd_write_speed'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Product images table
export const productImagesTable = pgTable('product_images', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull(),
  image_url: text('image_url').notNull(),
  alt_text: text('alt_text'),
  display_order: integer('display_order').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Cart items table
export const cartItemsTable = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  shipping_address: text('shipping_address').notNull(),
  billing_address: text('billing_address').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Order items table
export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price_at_time: numeric('price_at_time', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Wishlist items table
export const wishlistItemsTable = pgTable('wishlist_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  product_id: integer('product_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Reviews table
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  product_id: integer('product_id').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const userRelations = relations(usersTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orders: many(ordersTable),
  wishlistItems: many(wishlistItemsTable),
  reviews: many(reviewsTable),
}));

export const productRelations = relations(productsTable, ({ many }) => ({
  images: many(productImagesTable),
  cartItems: many(cartItemsTable),
  orderItems: many(orderItemsTable),
  wishlistItems: many(wishlistItemsTable),
  reviews: many(reviewsTable),
}));

export const productImageRelations = relations(productImagesTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [productImagesTable.product_id],
    references: [productsTable.id],
  }),
}));

export const cartItemRelations = relations(cartItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [cartItemsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [cartItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const orderRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [ordersTable.user_id],
    references: [usersTable.id],
  }),
  items: many(orderItemsTable),
}));

export const orderItemRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const wishlistItemRelations = relations(wishlistItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [wishlistItemsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [wishlistItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const reviewRelations = relations(reviewsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [reviewsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [reviewsTable.product_id],
    references: [productsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  products: productsTable,
  productImages: productImagesTable,
  cartItems: cartItemsTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
  wishlistItems: wishlistItemsTable,
  reviews: reviewsTable,
};
