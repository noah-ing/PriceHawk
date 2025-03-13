import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Bell, ExternalLink, Star } from "lucide-react"

interface ProductCardProps {
  name: string
  category: string
  image: string
  currentPrice: number
  originalPrice: number
  store: string
  priceDropPercent: number
  id: string
  url: string
}

export function ProductCard({
  name = "",
  category = "",
  image = "/placeholder.svg",
  currentPrice = 0,
  originalPrice = 0,
  store = "",
  priceDropPercent = 0,
  id = "",
  url = "",
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `$${(price || 0).toFixed(2)}`
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-0">
        <div className="relative">
          <img src={image || "/placeholder.svg"} alt={name} className="h-48 w-full object-cover" />
          {priceDropPercent > 0 && (
            <Badge className="absolute right-2 top-2 bg-green-600 hover:bg-green-700">{priceDropPercent}% Off</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-1 text-sm text-muted-foreground">{category}</div>
        <h3 className="mb-2 line-clamp-2 font-semibold">{name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{formatPrice(currentPrice)}</span>
          {originalPrice > currentPrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <span>From {store}</span>
          <div className="ml-auto flex items-center">
            <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
            <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
            <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
            <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
            <Star className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <Button className="h-8 w-full" onClick={() => window.location.href = `/products/${id}`}>
          View Details
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          title="Visit original store"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
