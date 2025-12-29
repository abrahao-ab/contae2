import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean | null;
}

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  readOnly?: boolean;
}

const getIcon = (iconName: string | null) => {
  if (!iconName) return LucideIcons.CircleDot;
  
  const iconMap: Record<string, any> = {
    'utensils': LucideIcons.UtensilsCrossed,
    'car': LucideIcons.Car,
    'home': LucideIcons.Home,
    'gamepad-2': LucideIcons.Gamepad2,
    'heart-pulse': LucideIcons.HeartPulse,
    'graduation-cap': LucideIcons.GraduationCap,
    'shopping-bag': LucideIcons.ShoppingBag,
    'wrench': LucideIcons.Wrench,
    'wallet': LucideIcons.Wallet,
    'trending-up': LucideIcons.TrendingUp,
    'gift': LucideIcons.Gift,
    'plane': LucideIcons.Plane,
    'smartphone': LucideIcons.Smartphone,
    'shirt': LucideIcons.Shirt,
    'paw-print': LucideIcons.PawPrint,
    'circle-dot': LucideIcons.CircleDot,
  };
  
  return iconMap[iconName] || LucideIcons.CircleDot;
};

export function CategoryCard({ category, onEdit, onDelete, readOnly = false }: CategoryCardProps) {
  const IconComponent = getIcon(category.icon);
  const isDefault = category.is_default;
  const showActions = !readOnly && (onEdit || onDelete);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: category.color || '#3b82f6' }}
        >
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-card-foreground">{category.name}</p>
            {isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Padrão
              </span>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          'opacity-0 group-hover:opacity-100'
        )}>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(category)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && !isDefault && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-expense"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
