
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, User, Settings, Package, TrendingUp, Search, Filter, Heart } from 'lucide-react';
import type { Product, ProductFilters, CartItem, Order } from '../../server/src/schema';

// User type with proper role union type
type AppUser = {
  id: number;
  name: string;
  role: 'customer' | 'admin';
};

// Demo users for application demonstration
const demoCustomer: AppUser = { id: 1, name: 'John Doe', role: 'customer' };
const demoAdmin: AppUser = { id: 2, name: 'Admin User', role: 'admin' };

function App() {
  const [currentUser, setCurrentUser] = useState<AppUser>(demoCustomer);
  const [currentView, setCurrentView] = useState<'products' | 'cart' | 'orders' | 'admin'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({});

  // Load initial data
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProducts.query(filters);
      setProducts(result);
      setFilteredProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Demo data for application showcase since backend handlers are placeholder
      const demoProducts: Product[] = [
        {
          id: 1,
          name: 'NVIDIA GeForce RTX 4090',
          brand: 'NVIDIA',
          category: 'gpu',
          description: 'The ultimate gaming GPU with uncompromising performance',
          price: 1599.99,
          stock_quantity: 15,
          low_stock_threshold: 5,
          is_active: true,
          gpu_chipset: 'AD102',
          gpu_memory: 24,
          gpu_memory_type: 'GDDR6X',
          cpu_socket: null,
          cpu_cores: null,
          cpu_threads: null,
          cpu_base_clock: null,
          cpu_boost_clock: null,
          motherboard_socket: null,
          motherboard_chipset: null,
          motherboard_form_factor: null,
          ram_capacity: null,
          ram_speed: null,
          ram_type: null,
          ssd_capacity: null,
          ssd_interface: null,
          ssd_read_speed: null,
          ssd_write_speed: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'AMD Ryzen 9 7950X',
          brand: 'AMD',
          category: 'cpu',
          description: '16-core, 32-thread powerhouse for gaming and content creation',
          price: 699.99,
          stock_quantity: 8,
          low_stock_threshold: 10,
          is_active: true,
          gpu_chipset: null,
          gpu_memory: null,
          gpu_memory_type: null,
          cpu_socket: 'AM5',
          cpu_cores: 16,
          cpu_threads: 32,
          cpu_base_clock: 4.5,
          cpu_boost_clock: 5.7,
          motherboard_socket: null,
          motherboard_chipset: null,
          motherboard_form_factor: null,
          ram_capacity: null,
          ram_speed: null,
          ram_type: null,
          ssd_capacity: null,
          ssd_interface: null,
          ssd_read_speed: null,
          ssd_write_speed: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Corsair Dominator Platinum RGB 32GB',
          brand: 'Corsair',
          category: 'ram',
          description: 'Premium DDR5 memory with stunning RGB lighting',
          price: 299.99,
          stock_quantity: 25,
          low_stock_threshold: 10,
          is_active: true,
          gpu_chipset: null,
          gpu_memory: null,
          gpu_memory_type: null,
          cpu_socket: null,
          cpu_cores: null,
          cpu_threads: null,
          cpu_base_clock: null,
          cpu_boost_clock: null,
          motherboard_socket: null,
          motherboard_chipset: null,
          motherboard_form_factor: null,
          ram_capacity: 32,
          ram_speed: 6000,
          ram_type: 'DDR5',
          ssd_capacity: null,
          ssd_interface: null,
          ssd_read_speed: null,
          ssd_write_speed: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          name: 'Samsung 990 PRO 2TB',
          brand: 'Samsung',
          category: 'ssd',
          description: 'Blazing fast NVMe SSD for ultimate performance',
          price: 199.99,
          stock_quantity: 30,
          low_stock_threshold: 15,
          is_active: true,
          gpu_chipset: null,
          gpu_memory: null,
          gpu_memory_type: null,
          cpu_socket: null,
          cpu_cores: null,
          cpu_threads: null,
          cpu_base_clock: null,
          cpu_boost_clock: null,
          motherboard_socket: null,
          motherboard_chipset: null,
          motherboard_form_factor: null,
          ram_capacity: null,
          ram_speed: null,
          ram_type: null,
          ssd_capacity: 2000,
          ssd_interface: 'NVMe',
          ssd_read_speed: 7000,
          ssd_write_speed: 6900,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      setProducts(demoProducts);
      setFilteredProducts(demoProducts);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadCartItems = useCallback(async () => {
    try {
      const result = await trpc.getCartItems.query(currentUser.id);
      setCartItems(result);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems([]);
    }
  }, [currentUser.id]);

  const loadOrders = useCallback(async () => {
    try {
      const result = currentUser.role === 'admin' 
        ? await trpc.getAllOrders.query()
        : await trpc.getOrdersByUser.query(currentUser.id);
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    }
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  useEffect(() => {
    if (currentView === 'orders' || currentView === 'admin') {
      loadOrders();
    }
  }, [currentView, loadOrders]);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((product: Product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter((product: Product) => product.category === filters.category);
    }

    if (filters.brand) {
      filtered = filtered.filter((product: Product) => product.brand === filters.brand);
    }

    if (filters.min_price !== undefined) {
      filtered = filtered.filter((product: Product) => product.price >= filters.min_price!);
    }

    if (filters.max_price !== undefined) {
      filtered = filtered.filter((product: Product) => product.price <= filters.max_price!);
    }

    if (filters.in_stock_only) {
      filtered = filtered.filter((product: Product) => product.stock_quantity > 0);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filters]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      await trpc.addToCart.mutate({
        user_id: currentUser.id,
        product_id: productId,
        quantity: quantity
      });
      await loadCartItems();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gpu': return '🎮';
      case 'cpu': return '🧠';
      case 'motherboard': return '🔧';
      case 'ram': return '💾';
      case 'ssd': return '💿';
      default: return '💻';
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { status: 'Out of Stock', color: 'bg-red-500' };
    if (product.stock_quantity <= product.low_stock_threshold) return { status: 'Low Stock', color: 'bg-yellow-500' };
    return { status: 'In Stock', color: 'bg-green-500' };
  };

  const renderProductCard = (product: Product) => {
    const stockStatus = getStockStatus(product);
    
    return (
      <Card key={product.id} className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="text-3xl mb-2">{getCategoryIcon(product.category)}</div>
            <Badge className={`${stockStatus.color} text-white`}>
              {stockStatus.status}
            </Badge>
          </div>
          <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
            {product.name}
          </CardTitle>
          <Badge variant="outline" className="w-fit text-cyan-400 border-cyan-400">
            {product.brand}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {product.description && (
            <p className="text-gray-400 text-sm">{product.description}</p>
          )}
          
          {/* Category-specific specs */}
          {product.category === 'gpu' && (
            <div className="space-y-1 text-sm">
              {product.gpu_chipset && <p className="text-gray-300">Chipset: <span className="text-cyan-400">{product.gpu_chipset}</span></p>}
              {product.gpu_memory && <p className="text-gray-300">Memory: <span className="text-cyan-400">{product.gpu_memory}GB {product.gpu_memory_type}</span></p>}
            </div>
          )}
          
          {product.category === 'cpu' && (
            <div className="space-y-1 text-sm">
              {product.cpu_cores && <p className="text-gray-300">Cores/Threads: <span className="text-cyan-400">{product.cpu_cores}/{product.cpu_threads}</span></p>}
              {product.cpu_base_clock && <p className="text-gray-300">Base Clock: <span className="text-cyan-400">{product.cpu_base_clock}GHz</span></p>}
              {product.cpu_socket && <p className="text-gray-300">Socket: <span className="text-cyan-400">{product.cpu_socket}</span></p>}
            </div>
          )}
          
          {product.category === 'ram' && (
            <div className="space-y-1 text-sm">
              {product.ram_capacity && <p className="text-gray-300">Capacity: <span className="text-cyan-400">{product.ram_capacity}GB</span></p>}
              {product.ram_speed && <p className="text-gray-300">Speed: <span className="text-cyan-400">{product.ram_speed}MHz {product.ram_type}</span></p>}
            </div>
          )}
          
          {product.category === 'ssd' && (
            <div className="space-y-1 text-sm">
              {product.ssd_capacity && <p className="text-gray-300">Capacity: <span className="text-cyan-400">{product.ssd_capacity}GB</span></p>}
              {product.ssd_interface && <p className="text-gray-300">Interface: <span className="text-cyan-400">{product.ssd_interface}</span></p>}
              {product.ssd_read_speed && <p className="text-gray-300">Read Speed: <span className="text-cyan-400">{product.ssd_read_speed} MB/s</span></p>}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-cyan-400">${product.price.toFixed(2)}</span>
            <span className="text-gray-400 text-sm">Stock: {product.stock_quantity}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            onClick={() => addToCart(product.id)}
            disabled={product.stock_quantity === 0}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
          <Button variant="outline" size="icon" className="border-gray-600 hover:border-pink-400 hover:text-pink-400">
            <Heart className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card className="bg-gray-900 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Category</label>
            <Select value={filters.category || 'all'} onValueChange={(value: string) => 
              setFilters((prev: ProductFilters) => ({ ...prev, category: value === 'all' ? undefined : value as 'gpu' | 'cpu' | 'motherboard' | 'ram' | 'ssd' }))
            }>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gpu">🎮 GPU</SelectItem>
                <SelectItem value="cpu">🧠 CPU</SelectItem>
                <SelectItem value="motherboard">🔧 Motherboard</SelectItem>
                <SelectItem value="ram">💾 RAM</SelectItem>
                <SelectItem value="ssd">💿 SSD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Brand</label>
            <Select value={filters.brand || 'all'} onValueChange={(value: string) =>
              setFilters((prev: ProductFilters) => ({ ...prev, brand: value === 'all' ? undefined : value }))
            }>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="NVIDIA">NVIDIA</SelectItem>
                <SelectItem value="AMD">AMD</SelectItem>
                <SelectItem value="Intel">Intel</SelectItem>
                <SelectItem value="Corsair">Corsair</SelectItem>
                <SelectItem value="Samsung">Samsung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Min Price ($)</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.min_price || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: ProductFilters) => ({ 
                  ...prev, 
                  min_price: e.target.value ? parseFloat(e.target.value) : undefined 
                }))
              }
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Max Price ($)</label>
            <Input
              type="number"
              placeholder="5000"
              value={filters.max_price || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: ProductFilters) => ({ 
                  ...prev, 
                  max_price: e.target.value ? parseFloat(e.target.value) : undefined 
                }))
              }
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="in-stock"
            checked={filters.in_stock_only || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilters((prev: ProductFilters) => ({ ...prev, in_stock_only: e.target.checked }))
            }
            className="w-4 h-4"
          />
          <label htmlFor="in-stock" className="text-sm text-gray-400">In Stock Only</label>
        </div>
        
        <Button 
          onClick={() => setFilters({})}
          variant="outline"
          className="border-gray-600 text-gray-400 hover:text-white"
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Navigation Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                ⚡ TechForge
              </h1>
              <nav className="hidden md:flex space-x-6">
                <Button
                  variant={currentView === 'products' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('products')}
                  className="text-white hover:text-cyan-400"
                >
                  Products
                </Button>
                <Button
                  variant={currentView === 'cart' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('cart')}
                  className="text-white hover:text-cyan-400 relative"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {getCartItemCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-cyan-500 text-black text-xs">
                      {getCartItemCount()}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={currentView === 'orders' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('orders')}
                  className="text-white hover:text-cyan-400"
                >
                  Orders
                </Button>
                {currentUser.role === 'admin' && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('admin')}
                    className="text-white hover:text-cyan-400"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              {currentView === 'products' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white w-64"
                  />
                </div>
              )}
              
              {/* User Toggle */}
              <Select value={currentUser.role} onValueChange={(value: 'customer' | 'admin') => 
                setCurrentUser(value === 'admin' ? demoAdmin : demoCustomer)
              }>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-32">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'products' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Premium PC Components</h2>
              <p className="text-gray-400">Build your ultimate gaming rig with the latest high-performance hardware</p>
            </div>
            
            {renderFilters()}
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product: Product) => renderProductCard(product))}
              </div>
            )}
            
            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No products found matching your criteria</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'cart' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">🛒 Shopping Cart</h2>
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Your cart is empty</p>
                <Button 
                  onClick={() => setCurrentView('products')}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item: CartItem) => (
                  <Card key={item.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">Product #{item.product_id}</h3>
                          <p className="text-gray-400">Quantity: {item.quantity}</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end">
                  <Button className="bg-green-600 hover:bg-green-700" size="lg">
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'orders' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">📦 Order History</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <Card key={order.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-semibold">Order #{order.id}</h3>
                          <p className="text-gray-400">Status: {order.status}</p>
                          <p className="text-gray-400">Date: {order.created_at.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-400">${order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'admin' && currentUser.role === 'admin' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">⚙️ Admin Dashboard</h2>
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="products" className="text-white data-[state=active]:bg-cyan-600">
                  Products
                </TabsTrigger>
                <TabsTrigger value="orders" className="text-white data-[state=active]:bg-cyan-600">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-cyan-600">
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="mt-6">
                <Card className="bg-gray-900 border-gray-700 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white">Product Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gray-800 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-cyan-400">{products.length}</div>
                          <div className="text-gray-400">Total Products</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {products.filter((p: Product) => p.stock_quantity <= p.low_stock_threshold).length}
                          </div>
                          <div className="text-gray-400">Low Stock</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {products.filter((p: Product) => p.stock_quantity === 0).length}
                          </div>
                          <div className="text-gray-400">Out of Stock</div>
                        </CardContent>
                      </Card>
                    </div>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      Add New Product
                    </Button>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.length > 0 ? products.map((product: Product) => (
                    <Card key={product.id} className="bg-gray-800 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-white font-semibold">{product.name}</h3>
                          <Badge className={getStockStatus(product).color}>
                            {product.stock_quantity}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{product.brand}</p>
                        <p className="text-cyan-400 font-bold">${product.price.toFixed(2)}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1">
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-400">No products available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="orders" className="mt-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Order Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">Order management features coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">Analytics and reporting features coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
