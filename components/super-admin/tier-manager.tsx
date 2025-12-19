'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Loader2, Crown, Zap, Building2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Landlord {
  id: string;
  name: string;
  email: string;
  currentTier: string;
  status: string;
  propertyCount: number;
}

interface Tier {
  id: string;
  name: string;
  price: number | null;
  unitLimit: number;
  noCashoutFees: boolean;
}

export default function TierManager() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/super-admin/set-tier');
      if (res.ok) {
        const data = await res.json();
        setLandlords(data.landlords);
        setTiers(data.availableTiers);
        const initial: Record<string, string> = {};
        data.landlords.forEach((l: Landlord) => {
          initial[l.id] = l.currentTier;
        });
        setSelectedTiers(initial);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load landlords', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (landlordId: string) => {
    const newTier = selectedTiers[landlordId];
    const landlord = landlords.find(l => l.id === landlordId);
    
    if (!newTier || newTier === landlord?.currentTier) {
      toast({ title: 'Info', description: 'No tier change selected' });
      return;
    }

    setUpdating(landlordId);
    try {
      const res = await fetch('/api/super-admin/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId, tier: newTier }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({ title: 'Success', description: `Tier updated to ${data.tier}` });
        setLandlords(prev =>
          prev.map(l =>
            l.id === landlordId ? { ...l, currentTier: newTier } : l
          )
        );
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update tier', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to update tier:', error);
      toast({ title: 'Error', description: 'Failed to update tier', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'pro':
        return <Building2 className="h-4 w-4 text-violet-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pro':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Subscription Tier Manager
          </CardTitle>
          <CardDescription>
            Manually set subscription tiers for testing purposes. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tier Legend */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Available Tiers</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-2 text-sm">
                  {getTierIcon(tier.id)}
                  <span className="font-medium">{tier.name}</span>
                  <span className="text-muted-foreground">
                    {tier.price === null ? 'Custom' : tier.price === 0 ? 'Free' : `$${tier.price}/mo`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Landlords List */}
          {landlords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No landlords found in the system.
            </p>
          ) : (
            <div className="space-y-3">
              {landlords.map((landlord) => (
                <div
                  key={landlord.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{landlord.name}</span>
                      <Badge variant="outline" className={getTierBadgeColor(landlord.currentTier)}>
                        {landlord.currentTier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{landlord.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {landlord.propertyCount} {landlord.propertyCount === 1 ? 'property' : 'properties'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTiers[landlord.id] || landlord.currentTier}
                      onValueChange={(value) =>
                        setSelectedTiers((prev) => ({ ...prev, [landlord.id]: value }))
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            <div className="flex items-center gap-2">
                              {getTierIcon(tier.id)}
                              {tier.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => updateTier(landlord.id)}
                      disabled={
                        updating === landlord.id ||
                        selectedTiers[landlord.id] === landlord.currentTier
                      }
                    >
                      {updating === landlord.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Feature Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tier Features Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Feature</th>
                  <th className="text-center py-2 px-2">Free</th>
                  <th className="text-center py-2 px-2">Pro</th>
                  <th className="text-center py-2 px-2">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4">Unit Limit</td>
                  <td className="text-center py-2 px-2">24</td>
                  <td className="text-center py-2 px-2">250</td>
                  <td className="text-center py-2 px-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">No Cashout Fees</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Rent Reminders</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Auto Late Fees</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Team Management</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Team Communications</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Employment Verifications</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">Unlimited</td>
                  <td className="text-center py-2 px-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Custom Branding</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">API Access</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Webhooks</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
