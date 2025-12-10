'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileText, 
  Wrench, 
  CreditCard, 
  Settings2, 
  Wallet, 
  Palette, 
  TrendingUp,
  Home,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { Landlord } from '@prisma/client';

interface AdminDashboardProps {
  landlord: Landlord;
}

export default function AdminDashboard({ landlord }: AdminDashboardProps) {
  // Mock data - in production, this would come from your analytics API
  const stats = {
    totalProperties: 12,
    totalUnits: 48,
    occupiedUnits: 42,
    totalTenants: 42,
    totalRevenue: 125000,
    pendingApplications: 8,
    openMaintenanceTickets: 3,
    monthlyRevenue: 18500,
  };

  const occupancyRate = ((stats.occupiedUnits / stats.totalUnits) * 100).toFixed(1);

  return (
    <main className='w-full'>
      <div className='max-w-7xl space-y-6 text-slate-50'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-white mb-2'>
            Welcome back, {landlord.name}
          </h1>
          <p className='text-base text-slate-100'>
            Here's what's happening with your properties today.
          </p>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-base font-medium text-white'>Total Properties</CardTitle>
              <Building2 className='h-5 w-5 text-emerald-300' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-white'>{stats.totalProperties}</div>
              <p className='text-sm text-slate-200'>
                <ArrowUpRight className='inline h-3 w-3 mr-1' />
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-base font-medium text-white'>Occupancy Rate</CardTitle>
              <Home className='h-5 w-5 text-emerald-300' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-white'>{occupancyRate}%</div>
              <p className='text-sm text-slate-200'>
                {stats.occupiedUnits} of {stats.totalUnits} units occupied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-lg font-medium text-white'>Total Tenants</CardTitle>
              <Users className='h-5 w-5 text-emerald-300' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>{stats.totalTenants}</div>
              <p className='text-md text-slate-200'>
                <ArrowUpRight className='inline h-3 w-3 mr-1' />
                +3 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-lg font-medium text-white'>Monthly Revenue</CardTitle>
              <DollarSign className='h-5 w-5 text-emerald-300' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>${stats.monthlyRevenue.toLocaleString()}</div>
              <p className='text-md text-slate-200'>
                <ArrowUpRight className='inline h-3 w-3 mr-1' />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <Link href='/admin/products'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Building2 className='h-4 w-4 mr-2' />
                    Properties
                  </Button>
                </Link>
                <Link href='/admin/applications'>
                  <Button variant='outline' className='w-full justify-start'>
                    <FileText className='h-4 w-4 mr-2' />
                    Applications
                  </Button>
                </Link>
                <Link href='/admin/tenants'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Users className='h-4 w-4 mr-2' />
                    Tenants
                  </Button>
                </Link>
                <Link href='/admin/maintenance'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Wrench className='h-4 w-4 mr-2' />
                    Maintenance
                  </Button>
                </Link>
                <Link href='/admin/revenue'>
                  <Button variant='outline' className='w-full justify-start'>
                    <CreditCard className='h-4 w-4 mr-2' />
                    Revenue
                  </Button>
                </Link>
                <Link href='/admin/payouts'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Wallet className='h-4 w-4 mr-2' />
                    Payouts
                  </Button>
                </Link>
                <Link href='/admin/analytics'>
                  <Button variant='outline' className='w-full justify-start'>
                    <TrendingUp className='h-4 w-4 mr-2' />
                    Analytics
                  </Button>
                </Link>
                <Link href='/admin/branding'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Palette className='h-4 w-4 mr-2' />
                    Branding
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <FileText className='h-4 w-4 text-blue-600' />
                    <div>
                      <p className='text-sm font-medium'>New rental application</p>
                      <p className='text-xs text-slate-500'>2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant='secondary'>{stats.pendingApplications}</Badge>
                </div>
                
                <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <Wrench className='h-4 w-4 text-orange-600' />
                    <div>
                      <p className='text-sm font-medium'>Maintenance request</p>
                      <p className='text-xs text-slate-500'>5 hours ago</p>
                    </div>
                  </div>
                  <Badge variant='secondary'>{stats.openMaintenanceTickets}</Badge>
                </div>
                
                <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <DollarSign className='h-4 w-4 text-green-600' />
                    <div>
                      <p className='text-sm font-medium'>Rent payment received</p>
                      <p className='text-xs text-slate-500'>1 day ago</p>
                    </div>
                  </div>
                  <Badge variant='secondary'>+$2,500</Badge>
                </div>
              </div>
              
              <Link href='/admin/notifications'>
                <Button variant='outline' className='w-full'>
                  View All Activity
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
