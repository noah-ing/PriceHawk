"use client"

import { useEffect, useState, useMemo } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, DollarSign, TrendingDown, TrendingUp, RefreshCw, ShoppingCart } from "lucide-react"

// Price history data type
interface PriceHistoryItem {
  id: string;
  price: number;
  currency: string;
  timestamp: string;
  productId: string;
}

// Price stats type
interface PriceStats {
  lowest: number | null;
  highest: number | null;
  average: number | null;
}

// Chart data type
interface ChartDataItem {
  date: string;
  price: number;
}

// Price trend type
type PriceTrend = 'up' | 'down' | 'stable' | 'unknown';

// Component props
interface PriceHistoryChartProps {
  productId?: string;
  showControls?: boolean;
  height?: number;
  // Dropshipper specific props
  sellingPrice?: number;
  competitorPrice?: number;
}

export function PriceHistoryChart({ 
  productId, 
  showControls = true, 
  height = 300,
  sellingPrice,
  competitorPrice 
}: PriceHistoryChartProps) {
  const [data, setData] = useState<ChartDataItem[]>([])
  const [stats, setStats] = useState<PriceStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<string>("30d") // Default to 30 days
  const [refreshKey, setRefreshKey] = useState<number>(0) // Used to force refresh

  // Calculate price trend metrics
  const priceTrend = useMemo((): { 
    direction: PriceTrend; 
    percentage: number; 
    absolute: number 
  } => {
    if (!data || data.length < 2) {
      return { direction: 'unknown', percentage: 0, absolute: 0 };
    }
    
    // Sort data chronologically
    const sortedData = [...data].sort((a: ChartDataItem, b: ChartDataItem) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get first and last price points
    const firstPrice = sortedData[0].price;
    const currentPrice = sortedData[sortedData.length - 1].price;
    const priceDiff = currentPrice - firstPrice;
    
    // Calculate percentage change
    const percentageChange = firstPrice > 0 
      ? (priceDiff / firstPrice) * 100 
      : 0;
    
    // Determine trend direction
    let direction: PriceTrend = 'unknown';
    if (Math.abs(percentageChange) < 1) {
      direction = 'stable';
    } else if (percentageChange > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }
    
    return {
      direction,
      percentage: Math.abs(percentageChange),
      absolute: Math.abs(priceDiff)
    };
  }, [data]);

  // Calculate profit metrics for dropshippers
  const profitMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        currentMargin: 0,
        potentialMargin: 0,
        marginPercent: 0,
        potentialProfit: 0,
        buyRating: 'unknown'
      };
    }

    const currentPrice = data[data.length - 1].price;
    // Use provided selling price or estimate a 30% markup
    const effectiveSellingPrice = sellingPrice || currentPrice * 1.3;
    
    const currentMargin = effectiveSellingPrice - currentPrice;
    const marginPercent = (currentMargin / effectiveSellingPrice) * 100;
    
    // Calculate potential margin if purchased at the lowest price
    const lowestPrice = stats?.lowest || currentPrice;
    const potentialMargin = effectiveSellingPrice - lowestPrice;
    const potentialProfit = potentialMargin - currentMargin;
    
    // Determine if it's a good time to buy based on price trends and margins
    let buyRating = 'unknown';
    
    if (marginPercent >= 40) {
      buyRating = 'excellent';
    } else if (marginPercent >= 30) {
      buyRating = 'good';
    } else if (marginPercent >= 20) {
      buyRating = 'fair';
    } else if (marginPercent >= 10) {
      buyRating = 'low';
    } else {
      buyRating = 'poor';
    }
    
    // If price is trending down, suggest waiting unless margin is already excellent
    if (priceTrend.direction === 'down' && priceTrend.percentage > 3 && buyRating !== 'excellent') {
      buyRating = 'wait';
    }
    
    // If price is near historical low, suggest buying if margin is at least fair
    if (currentPrice <= (lowestPrice * 1.05) && buyRating !== 'poor' && buyRating !== 'low') {
      buyRating = 'buy';
    }
    
    return {
      currentMargin,
      potentialMargin,
      marginPercent,
      potentialProfit,
      buyRating
    };
  }, [data, stats, sellingPrice, priceTrend]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeframe === "7d") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeframe === "30d") {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (timeframe === "90d") {
      cutoffDate.setDate(now.getDate() - 90);
    } else {
      // "all" timeframe - return all data
      return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }, [data, timeframe]);

  // Fetch price history data from the API
  useEffect(() => {
    // If no productId is provided, show empty state
    if (!productId) {
      console.log("No productId provided, showing empty state");
      return;
    }

    const fetchPriceHistory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Add query param for limit based on timeframe
        const limit = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : undefined;
        const url = new URL(`/api/products/${productId}/price-history`, window.location.origin);
        if (limit) url.searchParams.append('limit', limit.toString());
        
        console.log(`Fetching price history for product ID: ${productId}, timeframe: ${timeframe}`);
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error (${response.status}): ${errorText}`);
          throw new Error(`Failed to fetch price history (${response.status})`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'API returned failure status');
        }
        
        if (!result.data?.history || !Array.isArray(result.data.history)) {
          console.error("Invalid data format:", result.data);
          throw new Error('Invalid data format from API');
        }

        // Transform the API data to chart data
        const chartData = result.data.history.map((item: PriceHistoryItem) => {
          // Ensure timestamp is properly formatted
          const timestamp = item.timestamp ? item.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
          return {
            date: timestamp,
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price),
          };
        });
        
        // Sort data by date (oldest to newest)
        chartData.sort((a: ChartDataItem, b: ChartDataItem) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setData(chartData);
        
        if (result.data.stats) {
          setStats(result.data.stats);
        } else {
          // Calculate stats if not provided by API
          if (chartData.length > 0) {
            const prices = chartData.map((item: ChartDataItem) => item.price);
            setStats({
              lowest: Math.min(...prices),
              highest: Math.max(...prices),
              average: prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
            });
          }
        }
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError(`Failed to load price history data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceHistory();
  }, [productId, timeframe, refreshKey]);

  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } catch (error) {
      console.error("Error formatting date:", dateStr, error);
      return dateStr; // Return original string as fallback
    }
  }

  // Handle manual data refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // This will trigger the useEffect
  };

  // Get the buy rating badge color
  const getBuyRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-600 hover:bg-green-700';
      case 'good': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'buy': return 'bg-blue-600 hover:bg-blue-700';
      case 'fair': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-orange-500 hover:bg-orange-600';
      case 'poor': return 'bg-red-500 hover:bg-red-600';
      case 'wait': return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  }

  // Get the buy rating text
  const getBuyRatingText = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'EXCELLENT BUY';
      case 'good': return 'GOOD BUY';
      case 'buy': return 'BUY NOW';
      case 'fair': return 'FAIR MARGIN';
      case 'low': return 'LOW MARGIN';
      case 'poor': return 'POOR MARGIN';
      case 'wait': return 'WAIT - DROPPING';
      default: return 'ANALYZING';
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ height: `${height}px` }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center" style={{ height: `${height}px` }}>
        <AlertTriangle className="text-red-500 mb-2 h-8 w-8" />
        <h3 className="text-lg font-medium">Unable to load price history</h3>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
          Try Again
        </Button>
      </div>
    )
  }

  // Empty data state
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center" style={{ height: `${height}px` }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-4"><path d="M3 3v18h18"></path><path d="M18.4 9.4a3 3 0 1 1 0 5.2"></path><path d="m8 14 4-4 4 4"></path></svg>
        <h3 className="text-lg font-medium">Price History Tracking Active</h3>
        <p className="text-sm text-muted-foreground mt-1">We're monitoring this product's price in real-time</p>
        <p className="text-sm text-muted-foreground mt-1">Historical data will appear here as prices change</p>
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-800 text-sm max-w-md">
          <p className="font-medium">Dropshipper Pro Tip:</p>
          <p className="mt-1">As price history builds, you'll be able to identify ideal purchase timing for maximum profit margins.</p>
        </div>
      </div>
    )
  }
  
  // Limited data state - show a more helpful view when we have only 1-2 data points
  if (data.length < 3) {
    return (
      <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Price Tracking Initiated</CardTitle>
              {showControls && (
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              )}
            </div>
            <CardDescription>
              Price data is being collected for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
              <div className="bg-blue-50 rounded-md p-4 flex flex-col">
                <span className="text-blue-500 text-xs font-medium mb-1">CURRENT PRICE</span>
                <span className="text-2xl font-bold text-blue-700">
                  {formatPrice(data[data.length-1]?.price || 0)}
                </span>
                {data.length > 1 && (
                  <div className="mt-2 flex items-center">
                    {data[data.length-1].price > data[data.length-2].price ? (
                      <ArrowUp className="text-red-500 h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDown className="text-green-500 h-4 w-4 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${data[data.length-1].price > data[data.length-2].price ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPrice(Math.abs(data[data.length-1].price - data[data.length-2].price))}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">since last check</span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-md p-4 flex flex-col">
                <span className="text-gray-500 text-xs font-medium mb-1">POTENTIAL PROFIT</span>
                <span className="flex items-center text-xl font-bold text-gray-900">
                  <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                  {formatPrice(profitMetrics.currentMargin)}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {profitMetrics.marginPercent.toFixed(1)}% margin at estimated selling price
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-md">
              <ShoppingCart className="text-blue-500 mb-2 h-6 w-6" />
              <h3 className="text-md font-medium">Building Price History</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
                We're tracking price changes over time to help you identify the best purchasing opportunities.
              </p>
              <div className="mt-4 flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-sm font-medium">Price Point Tracking Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full featured price history display with real data - optimized for dropshippers
  return (
    <div className="w-full overflow-hidden" style={{ minHeight: `${height}px` }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <CardTitle className="text-lg">Dropshipper Price Analysis</CardTitle>
            {showControls && (
              <div className="flex items-center gap-2">
                <Tabs value={timeframe} onValueChange={setTimeframe} className="w-auto">
                  <TabsList className="grid grid-cols-4 h-7 w-auto">
                    <TabsTrigger value="7d" className="text-xs px-2">7 Days</TabsTrigger>
                    <TabsTrigger value="30d" className="text-xs px-2">30 Days</TabsTrigger>
                    <TabsTrigger value="90d" className="text-xs px-2">90 Days</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="h-7 px-2">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            Price insights for optimal profit margins and purchase timing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          {/* Dropshipper metrics grid */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-3">
            <div className="bg-slate-50 rounded-md p-3 flex flex-col">
              <span className="text-slate-500 text-xs font-medium mb-1">CURRENT PRICE</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(data[data.length-1]?.price || 0)}
              </span>
              <div className="mt-1 flex items-center">
                {priceTrend.direction === 'up' ? (
                  <TrendingUp className="text-red-500 h-3 w-3 mr-1" />
                ) : priceTrend.direction === 'down' ? (
                  <TrendingDown className="text-green-500 h-3 w-3 mr-1" />
                ) : (
                  <span className="inline-block w-3 h-3 mr-1"></span>
                )}
                <span className={`text-xs font-medium ${
                  priceTrend.direction === 'up' ? 'text-red-600' : 
                  priceTrend.direction === 'down' ? 'text-green-600' : 
                  'text-slate-600'
                }`}>
                  {priceTrend.direction === 'stable' ? 'Stable' : 
                   priceTrend.direction !== 'unknown' ? `${priceTrend.percentage.toFixed(1)}%` : '-'}
                </span>
                <span className="text-xs text-slate-500 ml-1">
                  {priceTrend.direction === 'up' ? 'increase' : 
                   priceTrend.direction === 'down' ? 'decrease' : ''}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-md p-3 flex flex-col">
              <span className="text-slate-500 text-xs font-medium mb-1">PROFIT MARGIN</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(profitMetrics.currentMargin)}
              </span>
              <div className="mt-1 flex items-center">
                <span className="text-xs font-medium text-slate-600">
                  {profitMetrics.marginPercent.toFixed(1)}% margin
                </span>
                {profitMetrics.potentialProfit > 0 && (
                  <span className="text-xs text-green-600 ml-2">
                    +{formatPrice(profitMetrics.potentialProfit)} possible
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-md p-3 flex flex-col">
              <span className="text-slate-500 text-xs font-medium mb-1">LOWEST PRICE</span>
              <span className="text-xl font-bold text-slate-900">
                {stats?.lowest ? formatPrice(stats.lowest) : 'N/A'}
              </span>
              {stats?.lowest && data.length > 0 && (
                <div className="mt-1 flex items-center">
                  <span className="text-xs font-medium text-slate-600">
                    {formatPrice(data[data.length-1].price - (stats.lowest || 0))} higher
                  </span>
                  <span className="text-xs text-slate-500 ml-1">
                    than lowest
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 rounded-md p-3 flex flex-col">
              <span className="text-slate-500 text-xs font-medium mb-1">BUY RATING</span>
              <div className="flex items-center">
                <Badge className={`mr-1 ${getBuyRatingColor(profitMetrics.buyRating)}`}>
                  {getBuyRatingText(profitMetrics.buyRating)}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Based on margin and price trends
              </div>
            </div>
          </div>
          
          {/* Price chart */}
          <div className="h-[220px] mt-3 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} tickMargin={5} tickCount={5} />
                <YAxis tickFormatter={formatPrice} tick={{ fontSize: 10 }} tickMargin={5} domain={["auto", "auto"]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0 && payload[0] && payload[0].payload) {
                      const dataPoint = payload[0].payload as ChartDataItem;
                      const value = payload[0].value as number;

                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm font-medium text-foreground">
                            {dataPoint.date ? formatDate(dataPoint.date) : "Unknown date"}
                          </div>
                          <div className="text-sm font-bold text-primary">
                            {typeof value === "number" ? formatPrice(value) : "Unknown price"}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                {stats?.average && (
                  <ReferenceLine 
                    y={stats.average} 
                    stroke="#6b7280" 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: 'Average', 
                      position: 'insideTopRight',
                      fill: '#6b7280',
                      fontSize: 10
                    }} 
                  />
                )}
                {stats?.lowest && (
                  <ReferenceLine 
                    y={stats.lowest} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: 'Lowest', 
                      position: 'insideBottomRight',
                      fill: '#10b981',
                      fontSize: 10 
                    }} 
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Additional dropshipper insights */}
          <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
            <h4 className="font-medium text-blue-800">Dropshipper Insights:</h4>
            <ul className="mt-1 text-blue-700 text-xs space-y-1">
              <li>• {data[data.length-1].price <= (stats?.lowest || 0) * 1.05 ? 
                "Price near historical low - good time to stock up" : 
                data[data.length-1].price >= (stats?.highest || 0) * 0.95 ?
                "Price near historical high - consider waiting for a drop" :
                "Price in middle range - monitor for downward trends"}
              </li>
              <li>• {priceTrend.direction === 'down' ? 
                "Downward trend detected - may drop further" : 
                priceTrend.direction === 'up' ?
                "Upward trend detected - buy soon if needed" :
                "Price is stable - good for predictable margins"}
              </li>
              <li>• {profitMetrics.marginPercent >= 30 ?
                `Strong profit potential of ${profitMetrics.marginPercent.toFixed(1)}% at current price` :
                `Moderate profit margin of ${profitMetrics.marginPercent.toFixed(1)}% - seek better opportunities`}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
