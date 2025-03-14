"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Search, Filter, ArrowUpDown, XCircle } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Simulated product interface
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  store: string;
  category: string;
  imageUrl: string;
  rating: number;
  inStock: boolean;
  priceDropPercent: number;
  lastUpdated: string;
}

// Client component for advanced product search
export default function AdvancedProductSearchClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // States for search parameters
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceDropsOnly, setPriceDropsOnly] = useState(false);
  
  // States for result
  const [products, setProducts] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Available filter options
  const stores = ["Amazon", "Best Buy", "Walmart", "Target", "Newegg", "eBay"];
  const categories = ["Electronics", "Home & Kitchen", "Clothing", "Books", "Toys", "Sports", "Automotive", "Health"];
  const sortOptions = [
    { id: "relevance", name: "Relevance" },
    { id: "price_low", name: "Price: Low to High" },
    { id: "price_high", name: "Price: High to Low" },
    { id: "newest", name: "Newest First" },
    { id: "price_drop", name: "Biggest Price Drop" },
    { id: "rating", name: "Highest Rated" },
  ];

  // Initialize search parameters from URL
  useEffect(() => {
    if (initialSearchParams) {
      // Parse search query
      if (initialSearchParams.q) {
        setSearchQuery(Array.isArray(initialSearchParams.q) ? initialSearchParams.q[0] : initialSearchParams.q);
      }
      
      // Parse stores
      if (initialSearchParams.stores) {
        const storesParam = Array.isArray(initialSearchParams.stores) 
          ? initialSearchParams.stores[0] 
          : initialSearchParams.stores;
        setSelectedStores(storesParam.split(','));
      }
      
      // Parse categories
      if (initialSearchParams.categories) {
        const categoriesParam = Array.isArray(initialSearchParams.categories) 
          ? initialSearchParams.categories[0] 
          : initialSearchParams.categories;
        setSelectedCategories(categoriesParam.split(','));
      }
      
      // Parse price range
      if (initialSearchParams.min_price && initialSearchParams.max_price) {
        const minPrice = parseInt(Array.isArray(initialSearchParams.min_price) 
          ? initialSearchParams.min_price[0] 
          : initialSearchParams.min_price);
        const maxPrice = parseInt(Array.isArray(initialSearchParams.max_price) 
          ? initialSearchParams.max_price[0] 
          : initialSearchParams.max_price);
        setPriceRange([minPrice, maxPrice]);
      }
      
      // Parse sort option
      if (initialSearchParams.sort) {
        setSortBy(Array.isArray(initialSearchParams.sort) ? initialSearchParams.sort[0] : initialSearchParams.sort);
      }
      
      // Parse stock filter
      if (initialSearchParams.in_stock) {
        setInStockOnly(initialSearchParams.in_stock === 'true');
      }
      
      // Parse price drops filter
      if (initialSearchParams.price_drops) {
        setPriceDropsOnly(initialSearchParams.price_drops === 'true');
      }
      
      // Parse page
      if (initialSearchParams.page) {
        setCurrentPage(parseInt(Array.isArray(initialSearchParams.page) ? initialSearchParams.page[0] : initialSearchParams.page));
      }
    }
  }, [initialSearchParams]);

  // Perform search
  useEffect(() => {
    if (!searchQuery) {
      // Don't search if there's no query
      return;
    }
    
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be an API call with all parameters
        // const response = await fetch(`/api/products/search?...`)
        
        // For demo, simulate API call with timeout
        setTimeout(() => {
          // Mock search results
          const mockProducts: Product[] = Array.from({ length: 10 }, (_, i) => ({
            id: `p${i + 1}`,
            title: `Product ${i + 1} - ${searchQuery} ${selectedCategories.length > 0 ? `in ${selectedCategories[0]}` : ''}`,
            description: "This is a product description for the search result item. It would describe the features and benefits of the product.",
            price: Math.round((50 + Math.random() * 500) * 100) / 100,
            store: stores[Math.floor(Math.random() * stores.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            imageUrl: "/placeholder.png",
            rating: Math.floor(Math.random() * 5) + 1,
            inStock: Math.random() > 0.2,
            priceDropPercent: Math.floor(Math.random() * 30),
            lastUpdated: new Date().toISOString(),
          }));
          
          setProducts(mockProducts);
          setTotalResults(45); // Mock total results
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error searching products:", err);
        setError("Failed to search products. Please try again.");
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery, selectedStores, selectedCategories, priceRange, sortBy, inStockOnly, priceDropsOnly, currentPage]);

  // Update URL with search parameters
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedStores.length > 0) params.set('stores', selectedStores.join(','));
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    params.set('min_price', priceRange[0].toString());
    params.set('max_price', priceRange[1].toString());
    params.set('sort', sortBy);
    if (inStockOnly) params.set('in_stock', 'true');
    if (priceDropsOnly) params.set('price_drops', 'true');
    params.set('page', currentPage.toString());
    
    router.push(`/advanced-product-search?${params.toString()}`);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    updateSearchParams();
  };

  // Handle store selection
  const handleStoreToggle = (store: string) => {
    setSelectedStores(prev => 
      prev.includes(store) 
        ? prev.filter(s => s !== store) 
        : [...prev, store]
    );
  };

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateSearchParams();
  };

  // If loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-card rounded-md p-6 h-96 animate-pulse"></div>
          </div>
          <div className="md:col-span-3">
            <div className="bg-card rounded-md p-6 h-24 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-md p-6 h-40 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Advanced Product Search</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch}>
                <div className="space-y-6">
                  {/* Search input */}
                  <div>
                    <Label htmlFor="search-query">Search Query</Label>
                    <div className="flex mt-1">
                      <Input
                        id="search-query"
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button type="submit" size="icon" className="rounded-l-none">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Price range */}
                  <div>
                    <Label>Price Range</Label>
                    <div className="mt-4">
                      <Slider
                        value={[priceRange[0], priceRange[1]]}
                        min={0}
                        max={1000}
                        step={10}
                        onValueChange={(value) => setPriceRange([value[0], value[1]])}
                      />
                      <div className="flex justify-between mt-2 text-sm">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stores */}
                  <div>
                    <Label>Stores</Label>
                    <div className="space-y-2 mt-2">
                      {stores.map((store) => (
                        <div key={store} className="flex items-center gap-2">
                          <Checkbox
                            id={`store-${store}`}
                            checked={selectedStores.includes(store)}
                            onCheckedChange={() => handleStoreToggle(store)}
                          />
                          <Label htmlFor={`store-${store}`} className="text-sm cursor-pointer">
                            {store}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div>
                    <Label>Categories</Label>
                    <div className="space-y-2 mt-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center gap-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                          />
                          <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Additional filters */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="in-stock" className="cursor-pointer">In Stock Only</Label>
                      <Switch
                        id="in-stock"
                        checked={inStockOnly}
                        onCheckedChange={setInStockOnly}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="price-drops" className="cursor-pointer">Price Drops Only</Label>
                      <Switch
                        id="price-drops"
                        checked={priceDropsOnly}
                        onCheckedChange={setPriceDropsOnly}
                      />
                    </div>
                  </div>
                  
                  {/* Apply filters button */}
                  <Button type="submit" className="w-full">
                    Apply Filters
                  </Button>
                  
                  {/* Reset filters */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedStores([]);
                      setSelectedCategories([]);
                      setPriceRange([0, 1000]);
                      setSortBy("relevance");
                      setInStockOnly(false);
                      setPriceDropsOnly(false);
                      router.push("/advanced-product-search");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Search results */}
        <div className="md:col-span-3">
          {searchQuery ? (
            <>
              {/* Sort and result count */}
              <Card className="mb-6">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {totalResults} results for "{searchQuery}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sort" className="text-sm">Sort by:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sort" className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSortBy("relevance");
                        updateSearchParams();
                      }}
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Product list */}
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-32 h-32 bg-muted flex-shrink-0 flex items-center justify-center">
                          {/* Image placeholder */}
                          <div className="text-xl font-bold text-muted-foreground">
                            IMG
                          </div>
                        </div>
                        <div className="p-4 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h3 className="font-medium truncate">
                                <Link 
                                  href={`/products/${product.id}`}
                                  className="hover:underline"
                                >
                                  {product.title}
                                </Link>
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{product.store}</span>
                                <span>•</span>
                                <span>{product.category}</span>
                                {!product.inStock && (
                                  <>
                                    <span>•</span>
                                    <span className="text-red-500">Out of Stock</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">{formatPrice(product.price)}</div>
                              {product.priceDropPercent > 0 && (
                                <div className="text-sm text-green-500">
                                  {product.priceDropPercent}% price drop
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap justify-between mt-4 gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/products/${product.id}`)}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                // In real app, would add to tracking
                                alert(`Added ${product.title} to tracking`);
                              }}
                            >
                              Track Price
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No results found</h3>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Pagination */}
              {products.length > 0 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.ceil(totalResults / 10) }, (_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                        className="w-8 h-8 p-0"
                      >
                        {i + 1}
                      </Button>
                    )).slice(0, 5)}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === Math.ceil(totalResults / 10)}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Product Search</CardTitle>
                <CardDescription>
                  Use the filters on the left to find exactly what you're looking for
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Enter a search term and apply filters to find products
                </p>
                <Button onClick={() => {
                  setSearchQuery("electronics");
                  updateSearchParams();
                }}>
                  Try an Example Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
