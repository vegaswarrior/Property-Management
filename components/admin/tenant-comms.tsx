'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Megaphone,
  MessageCircle,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date-utils';
import { createMessage, getMyMessages } from '@/lib/actions/notification.actions';

type TenantOption = {
  id: string;
  name: string;
  email: string;
  unitName?: string;
  propertyName?: string;
};

interface TenantCommsProps {
  tenants?: TenantOption[];
  landlordId?: string;
  hideHeader?: boolean;
}

interface Message {
  id: string;
  threadId: string;
  userId: string;
  thread: {
    id: string;
    type: string;
    subject: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    messages: {
      id: string;
      content: string | null;
      senderName: string | null;
      senderEmail: string | null;
      createdAt: Date;
    }[];
    participants: {
      user: {
        id: string;
        name: string;
        email: string;
      };
    }[];
  };
}

export default function TenantComms({
  tenants = [],
  landlordId,
  hideHeader = false,
}: TenantCommsProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    content: '',
  });
  const [showCompose, setShowCompose] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState({
    title: '',
    message: '',
    type: 'reminder' as const,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileTab, setMobileTab] = useState<'inbox' | 'panel'>('inbox');

  const fetchMessages = async () => {
    try {
      const result = await getMyMessages();
      setMessages(result || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      alert('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createMessage(
        newMessage.recipientId,
        newMessage.subject,
        newMessage.content,
        landlordId
      );

      alert('Message sent successfully');
      setNewMessage({ recipientId: '', subject: '', content: '' });
      setShowCompose(false);
      setMobileTab('inbox');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const handleSendBulk = async () => {
    if (!bulkMessage.title || !bulkMessage.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      alert('Bulk message sent to all tenants');
      setBulkMessage({ title: '', message: '', type: 'reminder' });
      setShowBulk(false);
      setMobileTab('inbox');
    } catch (error) {
      console.error('Failed to send bulk message:', error);
      alert('Failed to send bulk message');
    }
  };

  const filteredMessages = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return messages.filter((message) =>
      (message.thread.subject || '').toLowerCase().includes(q) ||
      (message.thread.messages[0]?.content || '').toLowerCase().includes(q) ||
      message.thread.participants.some((p) =>
        (p.user.name || '').toLowerCase().includes(q)
      )
    );
  }, [messages, searchTerm]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const messagesList = () => (
    <Card className="!border-white/10 !bg-slate-900/40 text-slate-50 lg:col-span-2">
      <CardHeader className="border-b border-white/10 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-slate-50 text-lg">
          <Users className="h-5 w-5" />
          Tenant Messages
        </CardTitle>
        <CardDescription className="text-slate-300/80">
          Direct communications with your tenants
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-4 sm:p-6 sm:pt-4">
        <ScrollArea className="h-[320px] sm:h-[420px] lg:h-[480px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-slate-300/80">Loading messages...</div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="h-12 w-12 text-slate-400/80 mb-4" />
              <div className="text-sm text-slate-300/80">
                {searchTerm ? 'No messages found matching your search' : 'No tenant messages yet'}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 !border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
                onClick={() => {
                  setShowCompose(true);
                  setMobileTab('panel');
                }}
              >
                Send your first message
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((message) => {
                const latestMessage = message.thread.messages[0];
                const otherParticipants = message.thread.participants.filter(
                  (p) => p.user.name !== 'Current User'
                );

                return (
                  <div
                    key={message.id}
                    className={`p-3 sm:p-4 rounded-xl border border-white/10 bg-slate-900/60 cursor-pointer transition-colors hover:border-violet-400/60 hover:bg-slate-900/90 ${
                      selectedThread?.id === message.id
                        ? 'border-violet-400/60 bg-slate-900/90'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedThread(message);
                      setShowCompose(false);
                      setShowBulk(false);
                      setMobileTab('panel');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate text-slate-100/90">
                            {message.thread.subject || 'No Subject'}
                          </span>
                          <Badge className="text-xs bg-white/5 text-slate-200 border border-white/10">
                            {otherParticipants.length} participants
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300/80 truncate mb-2">
                          {latestMessage?.content || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400/90">
                          <span>From: {latestMessage?.senderName || 'Unknown'}</span>
                          <span>•</span>
                          <span>
                            {latestMessage?.createdAt
                              ? formatDistanceToNow(latestMessage.createdAt, { addSuffix: true })
                              : 'Unknown time'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const panel = () => (
    <div className="space-y-4">
      {showCompose ? (
        <Card className="!border-white/10 !bg-slate-900/40 text-slate-50">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="text-slate-50 text-lg">Compose Message</CardTitle>
            <CardDescription className="text-slate-300/80">
              Send a direct message to a tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-4 sm:p-6 sm:pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-200">Recipient</label>
              {tenants.length > 0 ? (
                <select
                  value={newMessage.recipientId}
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    setNewMessage((prev) => ({
                      ...prev,
                      recipientId: e.target.value,
                    }));
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} • {t.email}
                      {t.propertyName ? ` • ${t.propertyName}` : ''}
                      {t.unitName ? ` / ${t.unitName}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Tenant user id"
                  value={newMessage.recipientId}
                  onChange={(e) =>
                    setNewMessage((prev) => ({
                      ...prev,
                      recipientId: e.target.value,
                    }))
                  }
                  className="!border-white/10 !bg-slate-900/60 text-slate-50 placeholder:text-slate-500 focus-visible:ring-violet-500/70"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-200">Subject</label>
              <Input
                placeholder="Message subject"
                value={newMessage.subject}
                onChange={(e) =>
                  setNewMessage((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                className="!border-white/10 !bg-slate-900/60 text-slate-50 placeholder:text-slate-500 focus-visible:ring-violet-500/70"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-200">Message</label>
              <Textarea
                placeholder="Type your message here..."
                value={newMessage.content}
                onChange={(e) =>
                  setNewMessage((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                rows={4}
                className="!border-white/10 !bg-slate-900/60 text-slate-50 placeholder:text-slate-500 focus-visible:ring-violet-500/70"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendMessage}
                className="flex-1 bg-violet-500 hover:bg-violet-400 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompose(false);
                  setMobileTab('inbox');
                }}
                className="!border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : showBulk ? (
        <Card className="!border-white/10 !bg-slate-900/40 text-slate-50">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-slate-50 text-lg">
              <Megaphone className="h-5 w-5" />
              Bulk Message
            </CardTitle>
            <CardDescription className="text-slate-300/80">
              Send a message to all tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-4 sm:p-6 sm:pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-200">Message Type</label>
              <select
                value={bulkMessage.type}
                onChange={(e) =>
                  setBulkMessage((prev) => ({
                    ...prev,
                    type: e.target.value as any,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
              >
                <option value="reminder">Reminder</option>
                <option value="payment">Payment Notice</option>
                <option value="maintenance">Maintenance Update</option>
                <option value="application">Application Notice</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-200">Subject</label>
              <Input
                placeholder="e.g., Important Building Notice"
                value={bulkMessage.title}
                onChange={(e) =>
                  setBulkMessage((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="!border-white/10 !bg-slate-900/60 text-slate-50 placeholder:text-slate-500 focus-visible:ring-violet-500/70"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-200">Message</label>
              <Textarea
                placeholder="Type your message to all tenants here..."
                value={bulkMessage.message}
                onChange={(e) =>
                  setBulkMessage((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                rows={4}
                className="!border-white/10 !bg-slate-900/60 text-slate-50 placeholder:text-slate-500 focus-visible:ring-violet-500/70"
              />
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-sm text-slate-200/90">
                <strong>Note:</strong> This will be sent to all active tenants and they will receive email notifications.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendBulk}
                className="flex-1 bg-violet-500 hover:bg-violet-400 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulk(false);
                  setMobileTab('inbox');
                }}
                className="!border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : selectedThread ? (
        <Card className="!border-white/10 !bg-slate-900/40 text-slate-50">
          <CardHeader className="border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="truncate text-slate-50 text-lg">
              {selectedThread.thread.subject || 'No Subject'}
            </CardTitle>
            <CardDescription className="text-slate-300/80">
              Conversation with {selectedThread.thread.participants.map((p) => p.user.name).join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-4 sm:p-6 sm:pt-4">
            <div className="space-y-4">
              <ScrollArea className="h-[260px] sm:h-[320px] pr-4">
                <div className="space-y-3">
                  {selectedThread.thread.messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-slate-100/90">
                          {msg.senderName || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400/90">
                          {msg.createdAt
                            ? formatDistanceToNow(msg.createdAt, { addSuffix: true })
                            : 'Unknown time'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200/90">{msg.content || 'No content'}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-slate-300/80 mb-2">Reply functionality coming soon...</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="!border-white/10 !bg-slate-900/40 text-slate-100"
                >
                  Reply to Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="!border-white/10 !bg-slate-900/40 text-slate-50">
          <CardContent className="flex flex-col items-center justify-center h-44 sm:h-56 text-center pt-6">
            <MessageCircle className="h-12 w-12 text-slate-400/80 mb-4" />
            <h3 className="font-medium mb-2">Communications Center</h3>
            <p className="text-sm text-slate-300/80 mb-4">
              Send direct messages or bulk announcements to tenants
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCompose(true);
                  setMobileTab('panel');
                }}
                className="!border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Direct
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBulk(true);
                  setMobileTab('panel');
                }}
                className="!border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
              >
                <Megaphone className="mr-2 h-4 w-4" />
                Bulk
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="!border-white/10 !bg-slate-900/40 text-slate-50">
        <CardHeader className="border-b border-white/10 p-4 sm:p-6">
          <CardTitle className="text-lg text-slate-50">Communication Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-4 sm:p-6 sm:pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300/80">Total Messages</span>
              <span className="font-medium">{messages.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300/80">Active Conversations</span>
              <span className="font-medium">{filteredMessages.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300/80">This Week</span>
              <span className="font-medium">
                {
                  messages.filter((m) => {
                    const messageDate = new Date(m.thread.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return messageDate > weekAgo;
                  }).length
                }
              </span>
            </div>
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full !border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
              >
                <Bell className="mr-2 h-4 w-4" />
                View Notification Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 text-slate-50">
      {!hideHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Tenant Communications
            </h2>
            <p className="text-sm text-slate-300/80">
              Direct messages and announcements to tenants.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full sm:max-w-md space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400/90" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full !border-white/10 !bg-slate-900/60 text-slate-50 placeholder:text-slate-500 focus-visible:ring-violet-500/70"
            />
          </div>

          {tenants.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Send to tenant
              </p>
              <select
                value={selectedTenantId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTenantId(value);
                  if (value) {
                    setNewMessage((prev) => ({ ...prev, recipientId: value }));
                    setShowCompose(true);
                    setShowBulk(false);
                    setSelectedThread(null);
                    setMobileTab('panel');
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
              >
                <option value="">Select a tenant...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} • {t.email}
                    {t.propertyName ? ` • ${t.propertyName}` : ''}
                    {t.unitName ? ` / ${t.unitName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap">
          <Button
            onClick={() => {
              setShowBulk((v) => !v);
              setShowCompose(false);
              setSelectedThread(null);
              setMobileTab('panel');
            }}
            variant="outline"
            className="flex-1 sm:flex-none !border-white/10 !bg-slate-900/40 text-slate-100 hover:!bg-slate-900/70"
          >
            <Megaphone className="mr-2 h-4 w-4" />
            Bulk
          </Button>
          <Button
            onClick={() => {
              setShowCompose((v) => !v);
              setShowBulk(false);
              setSelectedThread(null);
              setMobileTab('panel');
            }}
            className="flex-1 sm:flex-none bg-violet-500 hover:bg-violet-400 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      <div className="lg:hidden">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 !bg-slate-900/40 !text-slate-200">
            <TabsTrigger value="inbox" className="!bg-transparent data-[state=active]:!bg-slate-900/80 data-[state=active]:!text-slate-50">
              Inbox
            </TabsTrigger>
            <TabsTrigger value="panel" className="!bg-transparent data-[state=active]:!bg-slate-900/80 data-[state=active]:!text-slate-50">
              Actions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="mt-3">
            {messagesList()}
          </TabsContent>
          <TabsContent value="panel" className="mt-3">
            {panel()}
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:grid gap-4 lg:grid-cols-3">
        {messagesList()}
        {panel()}
      </div>
    </div>
  );
}
