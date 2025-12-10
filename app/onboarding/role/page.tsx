'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { roleOnboardingAction } from '@/lib/actions/onboarding.actions';
import { Button } from '@/components/ui/button';

function SubmitButton({ text = 'Continue' }: { text?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full max-w-sm mx-auto text-lg font-semibold py-6"
      disabled={pending}
    >
      {pending ? 'Saving...' : text}
    </Button>
  );
}

export default function OnboardingRolePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    unitsEstimateRange: '',
    ownsProperties: false,
    managesForOthers: false,
    useSubdomain: true,
  });

  const [state, action] = useActionState(roleOnboardingAction, {
    success: false,
    message: '',
    role: null as 'tenant' | 'landlord' | null,
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full space-y-12">
        {/* Progress indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step
                    ? 'w-12 bg-emerald-500'
                    : 'w-8 bg-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">
            Step {step} of {totalSteps}
          </p>
        </div>

        <form action={action} className="space-y-8">
          <input type="hidden" name="role" value="landlord" />
          <input type="hidden" name="unitsEstimateRange" value={formData.unitsEstimateRange} />
          <input type="hidden" name="ownsProperties" value={formData.ownsProperties ? 'on' : 'off'} />
          <input type="hidden" name="managesForOthers" value={formData.managesForOthers ? 'on' : 'off'} />
          <input type="hidden" name="useSubdomain" value={formData.useSubdomain ? 'on' : 'off'} />

          {/* Step 1: How many units */}
          {step === 1 && (
            <div className="space-y-8 text-center animate-in fade-in duration-500">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600/80">
                  Welcome to Rent Flows HQ
                </p>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  How many rental units do you manage?
                </h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto">
                  This helps us tailor your dashboard and recommend the right tools for your portfolio size.
                </p>
              </div>

              <div className="grid gap-4 max-w-md mx-auto">
                {[
                  { value: '0-10', label: '0-10 units', desc: 'Small portfolio' },
                  { value: '11-50', label: '11-50 units', desc: 'Growing portfolio' },
                  { value: '51-200', label: '51-200 units', desc: 'Large portfolio' },
                  { value: '200+', label: '200+ units', desc: 'Enterprise' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="cursor-pointer group"
                    onClick={() => {
                      setFormData({ ...formData, unitsEstimateRange: opt.value });
                      setTimeout(handleNext, 300);
                    }}
                  >
                    <div className={`rounded-2xl border-2 transition-all duration-200 p-6 text-left ${
                      formData.unitsEstimateRange === opt.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                      <p className="text-xl font-semibold">{opt.label}</p>
                      <p className="text-sm text-slate-600 mt-1">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Ownership type */}
          {step === 2 && (
            <div className="space-y-8 text-center animate-in fade-in duration-500">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Tell us about your role
                </h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto">
                  Do you own these properties, manage them for others, or both?
                </p>
              </div>

              <div className="grid gap-4 max-w-md mx-auto">
                <label className="cursor-pointer group">
                  <div className={`rounded-2xl border-2 transition-all duration-200 p-6 text-left ${
                    formData.ownsProperties
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.ownsProperties}
                        onChange={(e) => setFormData({ ...formData, ownsProperties: e.target.checked })}
                        className="mt-1 h-5 w-5 rounded border-slate-300 bg-white text-emerald-500"
                      />
                      <div>
                        <p className="text-xl font-semibold">I own properties</p>
                        <p className="text-sm text-slate-600 mt-1">
                          You're the owner or part of an ownership group
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="cursor-pointer group">
                  <div className={`rounded-2xl border-2 transition-all duration-200 p-6 text-left ${
                    formData.managesForOthers
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.managesForOthers}
                        onChange={(e) => setFormData({ ...formData, managesForOthers: e.target.checked })}
                        className="mt-1 h-5 w-5 rounded border-slate-300 bg-white text-emerald-500"
                      />
                      <div>
                        <p className="text-xl font-semibold">I manage for other owners</p>
                        <p className="text-sm text-slate-600 mt-1">
                          You're a third-party property manager or management company
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 max-w-md mx-auto">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-lg py-6"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  size="lg"
                  className="flex-1 text-lg py-6"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Subdomain preference */}
          {step === 3 && (
            <div className="space-y-8 text-center animate-in fade-in duration-500">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Get your own tenant portal URL
                </h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto">
                  We'll create a custom URL like <span className="font-mono text-emerald-700">yourname.yourdomain.com</span> that you can share with tenants for applications and rent payments.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="cursor-pointer group">
                  <div className={`rounded-2xl border-2 transition-all duration-200 p-6 ${
                    formData.useSubdomain
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xl font-semibold">Enable custom tenant portal</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Recommended for professional landlords
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.useSubdomain}
                        onChange={(e) => setFormData({ ...formData, useSubdomain: e.target.checked })}
                        className="h-6 w-6 rounded border-slate-300 bg-white text-emerald-500"
                      />
                    </div>
                  </div>
                </label>
              </div>

              {state && !state.success && state.message && (
                <p className="text-sm text-red-400">{state.message}</p>
              )}

              <div className="flex gap-3 max-w-md mx-auto">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-lg py-6"
                >
                  Back
                </Button>
                <SubmitButton text="Complete setup" />
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
