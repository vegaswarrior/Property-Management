'use client';

import { useState, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/utils';
import { Search, MoreVertical, Trash2, Ban, Eye, Building2 } from 'lucide-react';
import LandlordDetailModal from './landlord-detail-modal';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  createdAt: string | Date;
  landlordId?: string;
  isBlocked?: boolean;
}

interface UserManagementProps {
  users: User[];
  landlords?: Array<{ id: string; name: string; ownerUserId: string }>;
}

export default function UserManagement({ users, landlords = [] }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'block' | null>(null);
  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/super-admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUser.id }),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        alert('Error deleting user');
      }
    });
    setSelectedUser(null);
    setActionType(null);
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/super-admin/block-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUser.id }),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          alert('Failed to block user');
        }
      } catch (error) {
        alert('Error blocking user');
      }
    });
    setSelectedUser(null);
    setActionType(null);
  };

  const getLandlordForUser = (userId: string) => {
    return landlords.find(l => l.ownerUserId === userId);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="landlord">Landlords</option>
          <option value="admin">Admins</option>
          <option value="super-admin">Super Admins</option>
        </select>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map((user) => {
          const landlord = getLandlordForUser(user.id);
          return (
            <div key={user.id} className="p-4 border rounded-lg bg-card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{user.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {landlord && (
                      <DropdownMenuItem onClick={() => setSelectedLandlordId(landlord.id)}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => { setSelectedUser(user); setActionType('block'); }}
                      className="text-orange-500"
                    >
                      <Ban className="h-4 w-4 mr-2" /> Block IP
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => { setSelectedUser(user); setActionType('delete'); }}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'landlord' ? 'default' : 'secondary'} className="text-xs">
                  {user.role || 'user'}
                </Badge>
                {landlord && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {landlord.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Joined {formatDateTime(new Date(user.createdAt)).dateOnly}
              </p>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Landlord</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const landlord = getLandlordForUser(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'landlord' ? 'default' : 'secondary'}>
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {landlord ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => setSelectedLandlordId(landlord.id)}
                        >
                          {landlord.name}
                        </Button>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{formatDateTime(new Date(user.createdAt)).dateOnly}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {landlord && (
                            <DropdownMenuItem onClick={() => setSelectedLandlordId(landlord.id)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => { setSelectedUser(user); setActionType('block'); }}
                            className="text-orange-500"
                          >
                            <Ban className="h-4 w-4 mr-2" /> Block IP
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setSelectedUser(user); setActionType('delete'); }}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' ? 'Delete User' : 'Block User IP'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' 
                ? `Are you sure you want to delete ${selectedUser?.name || selectedUser?.email}? This action cannot be undone.`
                : `Are you sure you want to block ${selectedUser?.name || selectedUser?.email}? They will not be able to access the platform from their current IP address.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === 'delete' ? handleDeleteUser : handleBlockUser}
              className={actionType === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : actionType === 'delete' ? 'Delete' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Landlord Detail Modal */}
      <LandlordDetailModal
        landlordId={selectedLandlordId}
        isOpen={!!selectedLandlordId}
        onClose={() => setSelectedLandlordId(null)}
      />
    </div>
  );
}
