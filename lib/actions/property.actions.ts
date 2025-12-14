"use server";

import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/lib/services/notification-service';

export async function deletePropertyById(id: string) {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      throw new Error(landlordResult.message || 'Unable to determine landlord');
    }

    const property = await prisma.property.findFirst({
      where: { id, landlordId: landlordResult.landlord.id },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    await prisma.property.delete({ where: { id: property.id } });
    await prisma.unit.deleteMany({ where: { propertyId: property.id } });
    // Also remove related product by slug if it exists
    if (property.slug) {
      await prisma.product.deleteMany({ where: { slug: property.slug } });
    }

    revalidatePath('/admin/products');

    return { success: true, message: 'Property deleted' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function startEvictionNotice({
  tenantId,
  leaseId,
  propertyId,
  portalUrl,
  reason,
  amountOwed,
  deadline,
}: {
  tenantId: string;
  leaseId: string;
  propertyId: string;
  portalUrl: string;
  reason: string;
  amountOwed?: string;
  deadline?: string;
}) {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      throw new Error(landlordResult.message || 'Unable to determine landlord');
    }
    const landlordId = landlordResult.landlord.id;

    const lease = await prisma.lease.findFirst({
      where: { id: leaseId, tenantId },
      include: {
        tenant: { select: { email: true, name: true, id: true } },
        unit: { select: { name: true, property: { select: { name: true } } } },
      },
    });

    if (!lease) {
      throw new Error('Lease not found for tenant');
    }

    const messageLines = [
      `An eviction process has been initiated for ${lease.unit.property?.name || 'your unit'}.`,
      amountOwed ? `Amount owed: $${amountOwed}` : null,
      deadline ? `Deadline to cure or vacate: ${deadline}` : null,
      reason ? `Reason: ${reason}` : null,
      `Please review and respond via the tenant portal.`,
    ]
      .filter(Boolean)
      .join(' ');

    await NotificationService.createNotification({
      userId: tenantId,
      type: 'reminder',
      title: 'Eviction process started',
      message: messageLines,
      actionUrl: '/user/notifications',
      metadata: {
        leaseId,
        propertyId,
        portalUrl,
      },
      landlordId,
    });

    return { success: true, message: 'Eviction notice drafted and tenant notified.' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
