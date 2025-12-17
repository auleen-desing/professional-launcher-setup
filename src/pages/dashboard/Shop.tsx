import { useState, useEffect } from 'react';
import { ShoppingCart, Sparkles, ChevronRight, Loader2, Package, FolderOpen, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { cn } from '@/lib/utils';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  itemVNum: number;
  quantity: number;
  category: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  master_category: number;
}

interface Character {
  id: number;
  name: string;
  level: number;
  class: string;
}

export function Shop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(API_CONFIG.GLOBAL_DISCOUNT);
  const { toast } = useToast();
  const { user, updateCoins } = useAuth();

  useEffect(() => {
    fetchConfig();
    fetchData();
    fetchCharacters();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(buildApiUrl('/shop/config'));
      const data = await res.json();
      if (data?.success && typeof data?.data?.globalDiscount === 'number') {
        setGlobalDiscount(data.data.globalDiscount);
      }
    } catch {
      // Keep fallback from API_CONFIG.GLOBAL_DISCOUNT
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.ITEMS)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.CATEGORIES))
      ]);
      
      const itemsData = await itemsRes.json();
      const categoriesData = await categoriesRes.json();
      
      if (itemsData.success) {
        setItems(itemsData.data);
      }
      
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
    } catch (error) {
      console.error('Shop error:', error);
      toast({
        title: 'Error',
        description: 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CHARACTER.LIST), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setCharacters(data.data);
        setSelectedCharacter(data.data[0].id.toString());
      }
    } catch (error) {
      console.error('Characters error:', error);
    }
  };

  // Get main categories (master_category = NULL or 0)
  const mainCategories = categories.filter(c => c.master_category === null || c.master_category === 0);
  
  // Get subcategories for a given category
  const getSubcategories = (categoryId: number) => {
    return categories.filter(c => c.master_category === categoryId);
  };

  // Toggle expanded state for a category
  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Get all category IDs that should show items (including subcategories)
  const getSelectedCategoryIds = (): number[] => {
    if (selectedCategory === null) return [];
    
    const ids = [selectedCategory];
    const subcats = getSubcategories(selectedCategory);
    subcats.forEach(sub => {
      ids.push(sub.id);
      // Also get nested subcategories
      const nestedSubs = getSubcategories(sub.id);
      nestedSubs.forEach(nested => ids.push(nested.id));
    });
    
    return ids;
  };

  // Filter items by selected category
  const filteredItems = selectedCategory === null 
    ? items 
    : items.filter(item => getSelectedCategoryIds().includes(item.categoryId));

  const handlePurchase = async (item: ShopItem) => {
    const finalPrice = globalDiscount > 0 ? Math.floor(item.price * (1 - globalDiscount / 100)) : item.price;

    if (!selectedCharacter) {
      toast({
        title: 'Select a character',
        description: 'Please select a character to receive the item.',
        variant: 'destructive',
      });
      return;
    }

    if ((user?.coins || 0) < finalPrice) {
      toast({
        title: 'Insufficient coins',
        description: `You need ${finalPrice.toLocaleString()} coins to buy this item.`,
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(item.id);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.PURCHASE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: item.id, characterId: parseInt(selectedCharacter) }),
      });

      const data = await response.json();

      if (data.success) {
        updateCoins(data.data.newBalance);
        toast({
          title: 'Purchase successful!',
          description: `You bought ${item.name}. Check your in-game mail!`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Could not complete the purchase.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const renderCategoryItem = (category: Category, level: number = 0) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.includes(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id}>
        <button
          onClick={() => {
            setSelectedCategory(category.id);
            if (hasSubcategories) {
              toggleExpanded(category.id);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
            "hover:bg-primary/10",
            isSelected && "bg-primary/20 text-primary font-medium",
            level > 0 && "ml-4"
          )}
        >
          {hasSubcategories ? (
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )} 
            />
          ) : (
            <FolderOpen className="h-4 w-4 opacity-50" />
          )}
          <span className="truncate">{category.name}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {items.filter(i => {
              const ids = [category.id];
              subcategories.forEach(sub => ids.push(sub.id));
              return ids.includes(i.categoryId);
            }).length}
          </Badge>
        </button>
        
        {hasSubcategories && isExpanded && (
          <div className="mt-1">
            {subcategories.map(sub => renderCategoryItem(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Shop</h1>
          <p className="text-muted-foreground mt-2">Buy items with your coins</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Discount Banner */}
      {globalDiscount > 0 && (
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg p-4 flex items-center justify-center gap-3">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-lg font-bold text-primary">
            {globalDiscount}% OFF on ALL items!
          </span>
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Shop</h1>
          <p className="text-muted-foreground mt-2">
            Buy items with your coins • 
            <span className="text-primary font-medium ml-1">
              {user?.coins?.toLocaleString() || 0} coins available
            </span>
          </p>
        </div>
        
        {characters.length > 0 && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select character" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id.toString()}>
                    {char.name} (Lv.{char.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                    "hover:bg-primary/10",
                    selectedCategory === null && "bg-primary/20 text-primary font-medium"
                  )}
                >
                  <Package className="h-4 w-4" />
                  <span>All Items</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.length}
                  </Badge>
                </button>
                
                <div className="h-px bg-border my-2" />
                
                {mainCategories.map(category => renderCategoryItem(category))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Items Grid */}
        <div className="lg:col-span-3">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No items in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const finalPrice = globalDiscount > 0 ? Math.floor(item.price * (1 - globalDiscount / 100)) : item.price;

                return (
                  <Card key={item.id} className="hover:border-primary/50 transition-all group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <img 
                            src={`/items/${item.itemVNum}.png`} 
                            alt={item.name}
                            className="h-12 w-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Package className="h-10 w-10 text-primary hidden" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-base">Item #{item.itemVNum}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {item.description || `Quantity: x${item.quantity}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          {globalDiscount > 0 && (
                            <span className="text-sm text-muted-foreground line-through mr-2">
                              {item.price.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xl font-bold text-primary">
                            {finalPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">coins</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handlePurchase(item)}
                          disabled={purchasing === item.id}
                        >
                          {purchasing === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Buy
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
