
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  createProductInputSchema, 
  updateProductInputSchema,
  productFiltersSchema,
  addProductImageInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  createOrderItemInputSchema,
  addToWishlistInputSchema,
  createReviewInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getProducts, getProductById, getLowStockProducts } from './handlers/get_products';
import { createProduct } from './handlers/create_product';
import { updateProduct, updateProductStock } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';
import { addProductImage, getProductImages, deleteProductImage } from './handlers/manage_product_images';
import { addToCart, updateCartItem, getCartItems, removeFromCart, clearCart } from './handlers/manage_cart';
import { createOrder, createOrderItem, updateOrderStatus, getOrdersByUser, getAllOrders, getOrderById } from './handlers/manage_orders';
import { addToWishlist, getWishlistItems, removeFromWishlist } from './handlers/manage_wishlist';
import { createReview, getProductReviews, getUserReviews, updateReview, deleteReview } from './handlers/manage_reviews';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Product management
  getProducts: publicProcedure
    .input(productFiltersSchema.optional())
    .query(({ input }) => getProducts(input)),
  
  getProductById: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductById(input)),

  getLowStockProducts: publicProcedure
    .query(() => getLowStockProducts()),

  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  updateProductStock: publicProcedure
    .input(z.object({ productId: z.number(), newStock: z.number() }))
    .mutation(({ input }) => updateProductStock(input.productId, input.newStock)),

  deleteProduct: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteProduct(input)),

  // Product image management
  addProductImage: publicProcedure
    .input(addProductImageInputSchema)
    .mutation(({ input }) => addProductImage(input)),

  getProductImages: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductImages(input)),

  deleteProductImage: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteProductImage(input)),

  // Cart management
  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),

  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),

  getCartItems: publicProcedure
    .input(z.number())
    .query(({ input }) => getCartItems(input)),

  removeFromCart: publicProcedure
    .input(z.number())
    .mutation(({ input }) => removeFromCart(input)),

  clearCart: publicProcedure
    .input(z.number())
    .mutation(({ input }) => clearCart(input)),

  // Order management
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),

  createOrderItem: publicProcedure
    .input(createOrderItemInputSchema)
    .mutation(({ input }) => createOrderItem(input)),

  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),

  getOrdersByUser: publicProcedure
    .input(z.number())
    .query(({ input }) => getOrdersByUser(input)),

  getAllOrders: publicProcedure
    .query(() => getAllOrders()),

  getOrderById: publicProcedure
    .input(z.number())
    .query(({ input }) => getOrderById(input)),

  // Wishlist management
  addToWishlist: publicProcedure
    .input(addToWishlistInputSchema)
    .mutation(({ input }) => addToWishlist(input)),

  getWishlistItems: publicProcedure
    .input(z.number())
    .query(({ input }) => getWishlistItems(input)),

  removeFromWishlist: publicProcedure
    .input(z.number())
    .mutation(({ input }) => removeFromWishlist(input)),

  // Review management
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),

  getProductReviews: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductReviews(input)),

  getUserReviews: publicProcedure
    .input(z.number())
    .query(({ input }) => getUserReviews(input)),

  updateReview: publicProcedure
    .input(z.object({ 
      reviewId: z.number(), 
      rating: z.number().int().min(1).max(5), 
      comment: z.string().nullable() 
    }))
    .mutation(({ input }) => updateReview(input.reviewId, input.rating, input.comment)),

  deleteReview: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteReview(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
