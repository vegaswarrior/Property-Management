'use server';

import { NotificationService } from '@/lib/services/notification-service';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

// Test notification creation
export async function createTestNotification() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Create a test notification
  const notification = await NotificationService.createNotification({
    userId: session.user.id,
    type: 'reminder',
    title: 'Test Notification',
    message: 'This is a test notification to verify the system is working correctly.',
    actionUrl: '/dashboard',
    landlordId: 'test-landlord-id', // This would be the actual landlord ID
  });

  return notification;
}

// Send bulk notification to all tenants
export async function sendBulkNotification(
  landlordId: string,
  title: string,
  message: string,
  type: 'application' | 'message' | 'maintenance' | 'payment' | 'reminder' = 'reminder'
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify user is authorized to send notifications for this landlord
  // This is a simplified check - in production you'd want proper authorization

  const notifications = await NotificationService.sendBulkNotificationToTenants(
    landlordId,
    {
      type,
      title,
      message,
      actionUrl: '/user/notifications',
      landlordId,
    }
  );

  return notifications;
}

// Create a message between users
export async function createMessage(
  recipientId: string,
  subject: string,
  content: string,
  landlordId?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const { message: newMessage, thread } = await NotificationService.createMessage(
    session.user.id,
    recipientId,
    subject,
    content,
    landlordId
  );

  return { message: newMessage, thread };
}

// Get notifications for current user
export async function getMyNotifications(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const notifications = await NotificationService.getUnreadNotifications(
    session.user.id,
    limit
  );

  return notifications;
}

// Get messages for current user
export async function getMyMessages(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const messages = await NotificationService.getMessages(session.user.id, limit);

  return messages;
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await NotificationService.markAsRead(notificationId, session.user.id);

  return { success: true };
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await NotificationService.markAllAsRead(session.user.id);

  return { success: true };
}
