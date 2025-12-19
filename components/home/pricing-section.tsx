'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Check, 
  Zap, 
  Building2, 
  Crown, 
  ArrowRight,
  Bell,
  DollarSign,
  Users,
  MessageSquare,
  Briefcase,
  Palette,
  Code,
  Webhook,
  Shield,
  Sparkles
} from 'lucide-react';

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started with up to 24 units',
    unitLimit: '24 units',
    icon: Building2,
    popular: false,
    features: [
      { name: 'Up to 24 units', included: true },
      { name: 'Online rent collection', included: true },
      { name: 'Tenant portal', included: true },
      { name: 'Maintenance tickets', included: true },
      { name: 'Digital lease storage', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Automatic rent reminders', included: false },
      { name: 'Auto late fees', included: false },
      { name: 'Team management', included: false },
      { name: 'Employment verification', included: false },
    ],
    cta: 'Start Free',
    iconBg: 'bg-slate-500/20',
    iconColor: 'text-slate-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    description: 'Everything you need for serious property management',
    unitLimit: '250 units',
    icon: Zap,
    popular: true,
    features: [
      { name: 'Up to 250 units', included: true },
      { name: 'Everything in Free', included: true },
      { name: 'Automatic rent reminders', included: true },
      { name: 'Auto late fee charges', included: true },
      { name: 'Team management', included: true },
      { name: 'Team communications', included: true },
      { name: 'Unlimited employment verifications', included: true },
      { name: 'No platform cashout fees', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced reporting', included: true },
    ],
    cta: 'Get Started',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-300',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    description: 'Custom solutions for large portfolios',
    unitLimit: 'Unlimited',
    icon: Crown,
    popular: false,
    features: [
      { name: 'Unlimited units', included: true },
      { name: 'Everything in Pro', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Custom branding', included: true },
      { name: 'White-label tenant portal', included: true },
      { name: 'API access', included: true },
      { name: 'Webhooks', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
    ],
    cta: 'Contact Sales',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
  },
];

export default function PricingSection() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleTierClick = async (tierId: string) => {
    setLoadingTier(tierId);

    // Enterprise tier - go to contact
    if (tierId === 'enterprise') {
      router.push('/contact?subject=Enterprise%20Plan');
      return;
    }

    // Check if user is logged in
    if (status === 'authenticated' && session?.user) {
      // Check if user is a landlord/admin
      if (session.user.role === 'admin' || session.user.role === 'landlord') {
        // Already an admin, go to subscription page
        if (tierId === 'free') {
          router.push('/admin');
        } else {
          router.push(`/admin/settings/subscription?upgrade=${tierId}`);
        }
      } else {
        // User exists but not a landlord - go to onboarding
        router.push(`/onboarding?plan=${tierId}`);
      }
    } else {
      // Not logged in - go to sign up with plan parameter
      router.push(`/sign-up?plan=${tierId}`);
    }
  };

  return (
    <section id="pricing" className="w-full py-20 md:py-28 px-4 relative overflow-hidden scroll-mt-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-sky-600" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-violet-300 text-sm font-medium border border-violet-500/20">
            <Sparkles className="h-4 w-4" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Choose Your Plan
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Start free and upgrade as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isPopular = tier.popular;
            
            return (
              <div
                key={tier.id}
                className={`relative group rounded-2xl border bg-slate-950/60 p-8 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom ${
                  isPopular 
                    ? 'border-violet-500/50 hover:border-violet-500 scale-105 lg:scale-110 z-10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/50 flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Tier header */}
                <div className={`flex items-center gap-3 mb-4 ${isPopular ? 'pt-2' : ''}`}>
                  <div className={`rounded-xl ${tier.iconBg} p-3 border border-white/10`}>
                    <Icon className={`h-6 w-6 ${tier.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    <p className="text-xs text-slate-400">{tier.unitLimit}</p>
                  </div>
                </div>

                  {/* Price */}
                  <div className="mb-4">
                    {tier.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">${tier.price}</span>
                        <span className="text-slate-400">/month</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-white">Custom Pricing</div>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleTierClick(tier.id)}
                    disabled={loadingTier === tier.id}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mb-8 ${
                      isPopular
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105'
                        : tier.id === 'enterprise'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {loadingTier === tier.id ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {tier.cta}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Features list */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      What's included
                    </p>
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li 
                          key={i} 
                          className={`flex items-start gap-3 text-sm ${
                            feature.included ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          <div className={`mt-0.5 rounded-full p-0.5 ${
                            feature.included 
                              ? isPopular 
                                ? 'bg-violet-500/20 text-violet-400' 
                                : 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700 text-slate-500'
                          }`}>
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <span className={feature.included ? '' : 'line-through'}>{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            All plans include SSL security, 99.9% uptime, and 24/7 monitoring.
            <br />
            <span className="text-slate-500">Questions? </span>
            <a href="/contact" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              Talk to our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
