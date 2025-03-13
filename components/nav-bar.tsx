"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bell, CreditCard, Home, LineChart, LogOut, Menu, Package, RefreshCw, Search, Settings, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);
  
  // Fetch active alerts count
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/alerts?userId=${session.user.id}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Count only non-triggered (active) alerts
          const activeCount = data.data.filter((alert: { isTriggered: boolean }) => !alert.isTriggered).length;
          setActiveAlerts(activeCount);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };
    
    fetchActiveAlerts();
  }, [session]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center border-b px-4">
          <LineChart className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">PriceHawk</span>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Main</h2>
            <div className="space-y-1">
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant={pathname === "/products" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/products">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Link>
              </Button>
              <Button
                variant={pathname === "/alerts" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/alerts">
                  <Bell className="mr-2 h-4 w-4" />
                  Alerts
                  {activeAlerts > 0 && <Badge className="ml-auto">{activeAlerts}</Badge>}
                </Link>
              </Button>
              <Button
                variant={pathname === "/history" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/history">
                  <LineChart className="mr-2 h-4 w-4" />
                  Price History
                </Link>
              </Button>
              <Button
                variant={pathname === "/advanced-search" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/advanced-search">
                  <Search className="mr-2 h-4 w-4" />
                  Advanced Search
                  <Badge variant="outline" className="ml-auto bg-primary/10 text-primary text-xs px-1 py-0">PRO</Badge>
                </Link>
              </Button>
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button
                variant={pathname === "/admin/monitoring" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/monitoring">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Monitoring
                </Link>
              </Button>
            </div>
          </div>

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Account</h2>
            <div className="space-y-1">
              <Button
                variant={pathname === "/profile" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button
                variant={pathname === "/settings/subscription" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/settings/subscription">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscription
                </Link>
              </Button>
              <Button
                variant={pathname === "/pricing" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/pricing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pricing Plans
                </Link>
              </Button>
            </div>
          </div>

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Categories</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/category/electronics">Electronics</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/category/fashion">Fashion</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/category/home">Home & Kitchen</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback>
                  {session?.user?.name ? getInitials(session.user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2">
                <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email || ""}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex items-center">
          <LineChart className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">PriceHawk</span>
        </div>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback>
                    {session?.user?.name ? getInitials(session.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-16 items-center border-b px-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </Button>
            <div className="ml-4 flex items-center">
              <LineChart className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold">PriceHawk</span>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold tracking-tight">Main</h2>
              <div className="space-y-1">
                <Button
                  variant={pathname === "/" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/products" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/products">
                    <Package className="mr-2 h-4 w-4" />
                    Products
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/alerts" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/alerts">
                    <Bell className="mr-2 h-4 w-4" />
                    Alerts
                    {activeAlerts > 0 && <Badge className="ml-auto">{activeAlerts}</Badge>}
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/history" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/history">
                    <LineChart className="mr-2 h-4 w-4" />
                    Price History
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/advanced-search" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/advanced-search">
                    <Search className="mr-2 h-4 w-4" />
                    Advanced Search
                    <Badge variant="outline" className="ml-auto bg-primary/10 text-primary text-xs px-1 py-0">PRO</Badge>
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/settings" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/admin/monitoring" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/admin/monitoring">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Monitoring
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold tracking-tight">Account</h2>
              <div className="space-y-1">
                <Button
                  variant={pathname === "/profile" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/settings/subscription" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/settings/subscription">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>
                </Button>
                <Button
                  variant={pathname === "/pricing" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pricing Plans
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold tracking-tight">Categories</h2>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/category/electronics">Electronics</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/category/fashion">Fashion</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/category/home">Home & Kitchen</Link>
                </Button>
              </div>
            </div>
            <div className="mt-auto">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
