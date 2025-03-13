"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ProductWithPriceHistory } from '@/types';
import Image from 'next/image';
import { useMarkupSettings } from '@/hooks/use-markup-settings';
import { formatCurrency } from '@/lib/utils';
import { ChevronUp, ChevronDown, DollarSign, Percent, TrendingUp, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DropshipperProductCardProps {
  product: ProductWithPriceHistory;
  onSettingsUpdated?: () => void;
}

export default function DropshipperProductCard({ product, onSettingsUpdated }: DropshipperProductCardProps) {
  const { settings, isLoading, error, updateMarkupPercentage, calculateProfit } = useMarkupSettings(product.id);
  const [isEditing, setIsEditing] = useState(false);
  const [markupValue, setMarkupValue] = useState<number>(settings?.markupPercentage || 30);
  
  // Calculate profit metrics
  const profitMetrics = calculateProfit(product.currentPrice);
  
  // Handle markup slider change
  const handleMarkupChange = (value: number[]) => {
    setMarkupValue(value[0]);
  };
  
  // Save markup changes
  const handleSaveMarkup = async () => {
    const success = await updateMarkupPercentage(markupValue);
    if (success) {
      setIsEditing(false);
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    }
  };
  
  // Determine price trend
  const priceTrend = product.priceHistory && product.priceHistory.length > 1
    ? product.priceHistory[0].price < product.priceHistory[1].price
      ? 'decreasing'
      : product.priceHistory[0].price > product.priceHistory[1].price
        ? 'increasing'
        : 'stable'
    : 'stable';
  
  // Determine ROI rating
  const getRoiRating = () => {
    if (profitMetrics.profitMargin >= 30) return 'excellent';
    if (profitMetrics.profitMargin >= 20) return 'good';
    if (profitMetrics.profitMargin >= 10) return 'average';
    return 'poor';
  };
  
  const roiRating = getRoiRating();
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-2">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-2">{product.title}</CardTitle>
          <Badge variant={
            priceTrend === 'decreasing' ? 'default' :
            priceTrend === 'increasing' ? 'destructive' : 'secondary'
          }>
            {priceTrend === 'decreasing' && <ChevronDown className="h-3 w-3 mr-1" />}
            {priceTrend === 'increasing' && <ChevronUp className="h-3 w-3 mr-1" />}
            {formatCurrency(product.currentPrice, product.currency)}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {product.retailer}
        </div>
      </CardHeader>
      
      <div className="relative h-40 w-full">
        <Image
          src={product.imageUrl || '/placeholder-product.jpg'}
          alt={product.title}
          fill
          className="object-contain p-2"
        />
      </div>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse flex flex-col space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Profit Metrics</span>
              <Badge variant={
                roiRating === 'excellent' ? 'default' :
                roiRating === 'good' ? 'default' :
                roiRating === 'average' ? 'secondary' : 'destructive'
              }>
                {roiRating === 'excellent' && '🔥 '}
                {roiRating}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex flex-col p-2 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Selling Price</span>
                <span className="font-semibold flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(profitMetrics.sellingPrice, product.currency)}
                </span>
              </div>
              
              <div className="flex flex-col p-2 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Profit</span>
                <span className="font-semibold flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatCurrency(profitMetrics.profit, product.currency)}
                </span>
              </div>
              
              <div className="flex flex-col p-2 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Markup</span>
                <span className="font-semibold flex items-center">
                  <Percent className="h-3 w-3 mr-1" />
                  {profitMetrics.markupPercentage}%
                </span>
              </div>
              
              <div className="flex flex-col p-2 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Margin</span>
                <span className="font-semibold flex items-center">
                  <Percent className="h-3 w-3 mr-1" />
                  {profitMetrics.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {isEditing ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Markup Percentage</span>
                  <span className="text-sm font-medium">{markupValue}%</span>
                </div>
                <Slider
                  value={[markupValue]}
                  min={5}
                  max={100}
                  step={1}
                  onValueChange={handleMarkupChange}
                  className="mb-4"
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveMarkup}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => setIsEditing(true)}
              >
                Adjust Markup
              </Button>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between p-4 pt-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="px-2">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View on {product.retailer}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-xs text-muted-foreground">
          Last updated {new Date(product.lastCheckedAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}
