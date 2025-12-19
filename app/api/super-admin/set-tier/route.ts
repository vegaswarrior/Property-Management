import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/config/subscription-tiers';

/**
 * Manual tier setter for testing purposes
 * Only accessible by super-admin
 * 
 * POST /api/super-admin/set-tier
 * Body: { landlordId: string, tier: 'free' | 'pro' | 'enterprise' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { landlordId, tier } = await request.json();

    if (!landlordId || !tier) {
      return NextResponse.json({ error: 'landlordId and tier are required' }, { status: 400 });
    }

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier. Must be: free, pro, or enterprise' }, { status: 400 });
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as SubscriptionTier];

    // Update or create the subscription
    await prisma.landlordSubscription.upsert({
      where: { landlordId },
      create: {
        landlordId,
        tier,
        status: 'active',
        unitLimit: tierConfig.unitLimit === Infinity ? 999999 : tierConfig.unitLimit,
        freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
        freeEvictionChecks: tierConfig.features.freeEvictionChecks,
        freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      update: {
        tier,
        status: 'active',
        unitLimit: tierConfig.unitLimit === Infinity ? 999999 : tierConfig.unitLimit,
        freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
        freeEvictionChecks: tierConfig.features.freeEvictionChecks,
        freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Also update the landlord record
    await prisma.landlord.update({
      where: { id: landlordId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
        freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Landlord subscription set to ${tierConfig.name} tier`,
      tier,
      features: tierConfig.features,
      unitLimit: tierConfig.unitLimit,
      noCashoutFees: tierConfig.noCashoutFees,
    });
  } catch (error) {
    console.error('Failed to set tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List all landlords with their current tiers (for the UI)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const landlords = await prisma.landlord.findMany({
      include: {
        subscription: true,
        owner: { select: { email: true, name: true } },
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      landlords: landlords.map(l => ({
        id: l.id,
        name: l.name,
        email: l.owner?.email,
        currentTier: l.subscription?.tier || l.subscriptionTier || 'free',
        status: l.subscription?.status || l.subscriptionStatus || 'active',
        propertyCount: l._count.properties,
      })),
      availableTiers: Object.entries(SUBSCRIPTION_TIERS).map(([key, config]) => ({
        id: key,
        name: config.name,
        price: config.price,
        unitLimit: config.unitLimit,
        noCashoutFees: config.noCashoutFees,
      })),
    });
  } catch (error) {
    console.error('Failed to get landlords:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
