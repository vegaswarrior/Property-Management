'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  DollarSign, 
  FileText, 
  Wrench, 
  Calendar,
  MapPin,
  User,
  Bell,
  CreditCard,
  FileSignature,
  ReceiptText,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { Landlord, Lease } from '@prisma/client';

interface UserDashboardProps {
  tenantLease: Lease & {
    unit: {
      name: string;
      property: {
        name: string;
        address?: any;
      };
    };
  };
  landlord: Landlord;
}

export default function UserDashboard({ tenantLease, landlord }: UserDashboardProps) {
  // Mock data - in production, this would come from your APIs
  const tenantInfo = {
    nextRentDue: '2024-01-01',
    rentAmount: '$2,500',
    daysUntilDue: 15,
    maintenanceRequests: 1,
    unreadNotifications: 3,
  };

  return (
    <main className='w-full'>
      <div className='max-w-7xl space-y-6 text-slate-50'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-white mb-2'>
            Welcome back, Tenant
          </h1>
          <p className='text-base text-slate-100'>
            Manage your rental and stay connected with {landlord.name}.
          </p>
        </div>

        {/* Current Rental Info */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Home className='h-5 w-5' />
              Your Current Rental
            </CardTitle>
            <CardDescription>Details about your leased property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <MapPin className='h-4 w-4 text-slate-500' />
                  <div>
                    <p className='font-medium'>{tenantLease.unit.property.name}</p>
                    <p className='text-sm text-slate-600'>
                      {tenantLease.unit.name} • {typeof tenantLease.unit.property.address === 'string' ? tenantLease.unit.property.address : 'Address not available'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <User className='h-4 w-4 text-slate-500' />
                  <div>
                    <p className='font-medium'>Landlord</p>
                    <p className='text-sm text-slate-600'>{landlord.name}</p>
                  </div>
                </div>
              </div>
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <DollarSign className='h-4 w-4 text-slate-500' />
                  <div>
                    <p className='font-medium'>Monthly Rent</p>
                    <p className='text-sm text-slate-600'>{tenantInfo.rentAmount}</p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Calendar className='h-4 w-4 text-slate-500' />
                  <div>
                    <p className='font-medium'>Next Payment Due</p>
                    <p className='text-sm text-slate-600'>{tenantInfo.nextRentDue}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='h-5 w-5' />
                Rent Payment
              </CardTitle>
              <CardDescription>
                Due in {tenantInfo.daysUntilDue} days
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>{tenantInfo.rentAmount}</div>
                <p className='text-sm text-slate-600'>Next payment: {tenantInfo.nextRentDue}</p>
              </div>
              <Button className='w-full'>
                Pay Rent Now
              </Button>
              <Link href='/user/notifications'>
                <Button variant='outline' className='w-full mt-2'>
                  Pay with Cash at Store
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Wrench className='h-5 w-5' />
                Maintenance
              </CardTitle>
              <CardDescription>
                {tenantInfo.maintenanceRequests} active request(s)
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{tenantInfo.maintenanceRequests}</div>
                <p className='text-sm text-slate-600'>Active requests</p>
              </div>
              <Link href='/user/maintenance'>
                <Button variant='outline' className='w-full'>
                  Manage Requests
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Bell className='h-5 w-5' />
                Notifications
              </CardTitle>
              <CardDescription>
                {tenantInfo.unreadNotifications} unread message(s)
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{tenantInfo.unreadNotifications}</div>
                <p className='text-sm text-slate-600'>Unread notifications</p>
              </div>
              <Link href='/user/notifications'>
                <Button variant='outline' className='w-full'>
                  View Messages
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Navigation Cards - Show all sidebar links on mobile */}
        <div className='md:hidden space-y-4'>
          <h2 className='text-xl font-semibold text-white'>Navigation</h2>
          <div className='grid gap-3'>
            <Link
              href='/user/profile'
              className='rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex items-start gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer'
            >
              <div className='h-9 w-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0'>
                <User className='h-4 w-4' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-semibold text-white'>Profile</span>
                <span className='text-xs text-slate-200'>Manage your personal details</span>
              </div>
            </Link>

            <Link
              href='/user/profile/application'
              className='rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex items-start gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer'
            >
              <div className='h-9 w-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0'>
                <FileText className='h-4 w-4' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-semibold text-white'>Application</span>
                <span className='text-xs text-slate-200'>View your rental application</span>
              </div>
            </Link>

            <Link
              href='/user/profile/lease'
              className='rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex items-start gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer'
            >
              <div className='h-9 w-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0'>
                <FileSignature className='h-4 w-4' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-semibold text-white'>Lease</span>
                <span className='text-xs text-slate-200'>Review lease documents</span>
              </div>
            </Link>

            <Link
              href='/user/profile/rent-receipts'
              className='rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex items-start gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer'
            >
              <div className='h-9 w-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0'>
                <ReceiptText className='h-4 w-4' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-semibold text-white'>Rent Receipts</span>
                <span className='text-xs text-slate-200'>Download payment receipts</span>
              </div>
            </Link>

            <Link
              href='/user/profile/ticket'
              className='rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 flex items-start gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer'
            >
              <div className='h-9 w-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0'>
                <MessageCircle className='h-4 w-4' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-semibold text-white'>Create Ticket</span>
                <span className='text-xs text-slate-200'>Submit a maintenance request</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest rental activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <CreditCard className='h-4 w-4 text-green-600' />
                  <div>
                    <p className='text-sm font-medium'>Rent payment confirmed</p>
                    <p className='text-xs text-slate-500'>December 1, 2024</p>
                  </div>
                </div>
                <Badge variant='secondary'>Paid</Badge>
              </div>
              
              <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <FileText className='h-4 w-4 text-blue-600' />
                  <div>
                    <p className='text-sm font-medium'>Lease agreement renewed</p>
                    <p className='text-xs text-slate-500'>November 15, 2024</p>
                  </div>
                </div>
                <Badge variant='secondary'>Active</Badge>
              </div>
              
              <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <Wrench className='h-4 w-4 text-orange-600' />
                  <div>
                    <p className='text-sm font-medium'>Maintenance request completed</p>
                    <p className='text-xs text-slate-500'>November 10, 2024</p>
                  </div>
                </div>
                <Badge variant='secondary'>Resolved</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
