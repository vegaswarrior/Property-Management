'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { setUserRoleAndLandlordIntake } from './user.actions';

export async function roleOnboardingAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', role: null };
    }

    const role = formData.get('role') === 'tenant' ? 'tenant' : 'landlord';

    const unitsEstimateRange = (formData.get('unitsEstimateRange') || undefined) as
      | '0-10'
      | '11-50'
      | '51-200'
      | '200+'
      | undefined;

    const ownsProperties = formData.get('ownsProperties') === 'on';
    const managesForOthers = formData.get('managesForOthers') === 'on';
    const useSubdomain = formData.get('useSubdomain') === 'on';

    console.log('Onboarding form data:', {
      role,
      unitsEstimateRange,
      ownsProperties,
      managesForOthers,
      useSubdomain,
    });

    const result = await setUserRoleAndLandlordIntake({
      role,
      unitsEstimateRange,
      ownsProperties,
      managesForOthers,
      useSubdomain,
    });

    if (!result.success) {
      console.error('setUserRoleAndLandlordIntake failed:', result.message);
      return { success: false, message: result.message || 'Failed to save preferences', role };
    }

    if (role === 'tenant') {
      redirect('/user/applications');
    } else {
      redirect('/admin/onboarding');
    }
  } catch (error) {
    // Re-throw redirect errors - they're not actual errors, just how Next.js handles redirects
    if (isRedirectError(error)) {
      throw error;
    }
    
    console.error('Role onboarding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return { success: false, message: errorMessage, role: null };
  }
}
