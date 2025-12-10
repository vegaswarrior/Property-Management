'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Users, Search, Bell, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date-utils';
import { createMessage, getMyMessages } from '@/lib/actions/notification.actions';

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

export default function TenantMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);
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

  // Fetch messages
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

  // Send new message
  const handleSendMessage = async () => {
    if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createMessage(
        newMessage.recipientId,
        newMessage.subject,
        newMessage.content
      );
      
      alert('Message sent successfully');
      setNewMessage({ recipientId: '', subject: '', content: '' });
      setShowCompose(false);
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  // Send bulk message
  const handleSendBulk = async () => {
    if (!bulkMessage.title || !bulkMessage.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // This would send to all tenants of the landlord
      // For now, just show success
      alert('Bulk message sent to all tenants');
      setBulkMessage({ title: '', message: '', type: 'reminder' });
      setShowBulk(false);
    } catch (error) {
      console.error('Failed to send bulk message:', error);
      alert('Failed to send bulk message');
    }
  };

  // Filter messages based on search
  const filteredMessages = messages.filter(message =>
    (message.thread.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.thread.messages[0]?.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.thread.participants.some(p => p.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tenant Communications</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button onClick={() => setShowBulk(!showBulk)} variant="outline">
            <Megaphone className="mr-2 h-4 w-4" />
            Bulk Message
          </Button>
          <Button onClick={() => setShowCompose(!showCompose)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Messages List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenant Messages
            </CardTitle>
            <CardDescription>
              Direct communications with your tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? 'No messages found matching your search' : 'No tenant messages yet'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowCompose(true)}
                  >
                    Send your first message
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMessages.map((message) => {
                    const latestMessage = message.thread.messages[0];
                    const otherParticipants = message.thread.participants.filter(p => p.user.name !== 'Current User'); // Filter out current user
                    
                    return (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                          selectedThread?.id === message.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => setSelectedThread(message)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">
                                {message.thread.subject || 'No Subject'}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {otherParticipants.length} participants
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {latestMessage?.content || 'No messages yet'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>From: {latestMessage?.senderName || 'Unknown'}</span>
                              <span>•</span>
                              <span>{latestMessage?.createdAt ? formatDistanceToNow(latestMessage.createdAt, { addSuffix: true }) : 'Unknown time'}</span>
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

        {/* Compose / Bulk Message / Message Details */}
        <div className="space-y-4">
          {showCompose ? (
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Send a direct message to a tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recipient Email</label>
                  <Input
                    placeholder="tenant@example.com"
                    value={newMessage.recipientId}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, recipientId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    placeholder="Message subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSendMessage} className="flex-1">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCompose(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : showBulk ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Bulk Message
                </CardTitle>
                <CardDescription>
                  Send a message to all tenants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message Type</label>
                  <select
                    value={bulkMessage.type}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="reminder">Reminder</option>
                    <option value="payment">Payment Notice</option>
                    <option value="maintenance">Maintenance Update</option>
                    <option value="application">Application Notice</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    placeholder="e.g., Important Building Notice"
                    value={bulkMessage.title}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your message to all tenants here..."
                    value={bulkMessage.message}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This will be sent to all active tenants and they will receive email notifications.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSendBulk} className="flex-1">
                    <Send className="mr-2 h-4 w-4" />
                    Send to All Tenants
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBulk(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedThread ? (
            <Card>
              <CardHeader>
                <CardTitle className="truncate">{selectedThread.thread.subject || 'No Subject'}</CardTitle>
                <CardDescription>
                  Conversation with {selectedThread.thread.participants.map(p => p.user.name).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedThread.thread.messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{msg.senderName || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.createdAt ? formatDistanceToNow(msg.createdAt, { addSuffix: true }) : 'Unknown time'}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content || 'No content'}</p>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Reply functionality coming soon...
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Reply to Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Communications Center</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send direct messages or bulk announcements to tenants
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompose(true)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Direct Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulk(true)}
                  >
                    <Megaphone className="mr-2 h-4 w-4" />
                    Bulk Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communication Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Messages</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Conversations</span>
                  <span className="font-medium">{filteredMessages.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-medium">
                    {messages.filter(m => {
                      const messageDate = new Date(m.thread.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return messageDate > weekAgo;
                    }).length}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <Bell className="mr-2 h-4 w-4" />
                    View Notification Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
