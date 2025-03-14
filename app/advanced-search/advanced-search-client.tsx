"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Client component for advanced search
export default function AdvancedSearchClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for form values
  const [query, setQuery] = useState(
    (initialSearchParams.query as string) || 
    searchParams.get("query") || 
    ""
  );
  const [category, setCategory] = useState(
    (initialSearchParams.category as string) || 
    searchParams.get("category") || 
    "all"
  );
  const [priceMin, setPriceMin] = useState(
    parseInt((initialSearchParams.minPrice as string) || 
    searchParams.get("minPrice") || 
    "0")
  );
  const [priceMax, setPriceMax] = useState(
    parseInt((initialSearchParams.maxPrice as string) || 
    searchParams.get("maxPrice") || 
    "1000")
  );
  const [inStock, setInStock] = useState(
    ((initialSearchParams.inStock as string) || 
    searchParams.get("inStock")) === "true"
  );
  const [sortBy, setSortBy] = useState(
    (initialSearchParams.sortBy as string) || 
    searchParams.get("sortBy") || 
    "relevance"
  );

  // Handle search form submission
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category !== "all") params.set("category", category);
    if (priceMin > 0) params.set("minPrice", priceMin.toString());
    if (priceMax < 1000) params.set("maxPrice", priceMax.toString());
    if (inStock) params.set("inStock", "true");
    if (sortBy !== "relevance") params.set("sortBy", sortBy);

    // Update the URL with search parameters
    router.push(`/advanced-search?${params.toString()}`);
  };

  // Example categories (these would typically come from an API or database)
  const categories = [
    { id: "all", name: "All Categories" },
    { id: "electronics", name: "Electronics" },
    { id: "clothing", name: "Clothing & Accessories" },
    { id: "home", name: "Home & Kitchen" },
    { id: "sports", name: "Sports & Outdoors" },
    { id: "beauty", name: "Beauty & Personal Care" },
    { id: "toys", name: "Toys & Games" },
    { id: "books", name: "Books" },
    { id: "grocery", name: "Grocery" },
  ];

  // Example sort options
  const sortOptions = [
    { id: "relevance", name: "Relevance" },
    { id: "price-asc", name: "Price: Low to High" },
    { id: "price-desc", name: "Price: High to Low" },
    { id: "newest", name: "Newest Arrivals" },
    { id: "popular", name: "Most Popular" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>
              Refine your search using the options below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Search</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="query">Search Query</Label>
                    <Input 
                      id="query" 
                      value={query} 
                      onChange={(e) => setQuery(e.target.value)} 
                      placeholder="Enter keywords..." 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="price-range">Price Range: ${priceMin} - ${priceMax}</Label>
                    </div>
                    <div className="pt-4 px-1">
                      <Slider
                        id="price-range"
                        min={0}
                        max={1000}
                        step={10}
                        value={[priceMin, priceMax]}
                        onValueChange={(value) => {
                          setPriceMin(value[0]);
                          setPriceMax(value[1]);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="in-stock" 
                      checked={inStock} 
                      onCheckedChange={(checked) => setInStock(checked === true)} 
                    />
                    <Label htmlFor="in-stock">Show only in-stock items</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sort-by">Sort Results By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sort-by" className="w-full">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6">
              <Button onClick={handleSearch} className="w-full">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Results would be displayed here based on search params */}
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {query ? `Results for "${query}"` : "Enter search criteria above to see results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* In a real implementation, this would be populated with actual search results */}
            <div className="py-8 text-center text-muted-foreground">
              {query 
                ? "This is a placeholder for search results. In a real application, this would show product results based on your search criteria."
                : "Enter search terms and apply filters to see results here."
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
