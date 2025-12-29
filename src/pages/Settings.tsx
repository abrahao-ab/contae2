import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { Moon, Sun, User, Bell, Shield, Crown, ChevronRight } from 'lucide-react';
import { WhatsAppSettings } from '@/components/settings/WhatsAppSettings';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências</p>
        </div>

        <div className="grid gap-6">
          {/* WhatsApp */}
          <WhatsAppSettings />

          {/* Appearance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                Aparência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Tema Escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative o modo escuro para uma experiência visual mais confortável
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <User className="w-5 h-5" />
                Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate('/plans')}
                  >
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary" />
                      Gerenciar Plano
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Alertas de gastos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas quando seus gastos estiverem acima do normal
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Lembretes de faturas</Label>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado sobre vencimentos de faturas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Autenticação em dois fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
