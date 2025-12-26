import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { DeleteCategoryDialog } from '@/components/categories/DeleteCategoryDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Tags, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean | null;
  user_id: string;
  created_at: string;
}

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const handleCreate = async (data: { name: string; icon: string; color: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        is_default: false,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Categoria criada com sucesso.',
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a categoria.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdate = async (data: { name: string; icon: string; color: string }) => {
    if (!user || !editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          icon: data.icon,
          color: data.color,
        })
        .eq('id', editingCategory.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Categoria atualizada com sucesso.',
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a categoria.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!user || !deletingCategory) return;

    try {
      // First, remove category from transactions
      await supabase
        .from('transactions')
        .update({ category_id: null })
        .eq('category_id', deletingCategory.id)
        .eq('user_id', user.id);

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Categoria excluída com sucesso.',
      });

      setDeletingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a categoria.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultCategories = filteredCategories.filter((c) => c.is_default);
  const customCategories = filteredCategories.filter((c) => !c.is_default);

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Categorias</h1>
            <p className="text-muted-foreground">Organize seus gastos por categoria</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-primary text-white hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-input text-foreground"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Tags className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma categoria encontrada</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Tente buscar por outro termo' : 'Crie sua primeira categoria'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setFormOpen(true)} className="mt-4 bg-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Default Categories */}
            {defaultCategories.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Categorias Padrão ({defaultCategories.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {defaultCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={openEditForm}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Categories */}
            {customCategories.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Categorias Personalizadas ({customCategories.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {customCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={openEditForm}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms */}
      <CategoryForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editingCategory ? handleUpdate : handleCreate}
        category={editingCategory}
      />

      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
        category={deletingCategory}
      />
    </DashboardLayout>
  );
}
