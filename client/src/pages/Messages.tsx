import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Paperclip, 
  Search,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { socketManager } from "@/lib/socket";

interface Message {
  id: number;
  senderId: string;
  recipientId: string;
  content: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface Contact {
  id: number;
  userId: string;
  contactUserId: string;
  status: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function Messages() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    enabled: true
  });

  // Fetch messages for selected contact
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedContact],
    enabled: !!selectedContact
  });

  // Fetch recent messages overview
  const { data: recentMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages/recent'],
    enabled: true
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; content: string; type?: string }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/recent'] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // Setup real-time message updates
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('new-message', (message: Message) => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/recent'] });
        
        toast({
          title: "New Message",
          description: `Message from ${message.sender?.firstName || 'Unknown'}`
        });
      });

      socket.on('message-read', (messageId: number) => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact] });
      });
    }

    return () => {
      if (socket) {
        socket.off('new-message');
        socket.off('message-read');
      }
    };
  }, [selectedContact, queryClient, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedContact) {
      sendMessageMutation.mutate({
        recipientId: selectedContact,
        content: newMessage,
        type: 'text'
      });
    }
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContact(contactId);
    // Mark messages as read when opening conversation
    const unreadMessages = messages.filter((msg: Message) => !msg.isRead && msg.senderId !== contactId);
    unreadMessages.forEach((msg: Message) => {
      fetch(`/api/messages/${msg.id}/read`, { method: 'PATCH' });
    });
  };

  const acceptedContacts = contacts.filter((contact: Contact) => contact.status === 'accepted');
  const filteredContacts = acceptedContacts.filter((contact: Contact) => {
    const name = `${contact.user?.firstName || ''} ${contact.user?.lastName || ''}`.trim();
    const email = contact.user?.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedContactData = contacts.find((contact: Contact) => contact.user?.id === selectedContact);
  const selectedContactName = selectedContactData 
    ? `${selectedContactData.user?.firstName || ''} ${selectedContactData.user?.lastName || ''}`.trim()
    : 'Unknown User';

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLastMessage = (contactId: string) => {
    const contactMessages = recentMessages.filter((msg: Message) => 
      msg.senderId === contactId || msg.recipientId === contactId
    );
    return contactMessages.sort((a: Message, b: Message) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  const getUnreadCount = (contactId: string) => {
    return recentMessages.filter((msg: Message) => 
      msg.senderId === contactId && !msg.isRead
    ).length;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-background">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <ScrollArea className="h-[calc(100%-8rem)]">
          <div className="space-y-2 p-4 pt-0">
            {filteredContacts.map((contact: Contact) => {
              const lastMessage = getLastMessage(contact.user!.id);
              const unreadCount = getUnreadCount(contact.user!.id);
              const name = `${contact.user?.firstName || ''} ${contact.user?.lastName || ''}`.trim();
              
              return (
                <Card
                  key={contact.id}
                  className={`cursor-pointer transition-colors hover:bg-muted ${
                    selectedContact === contact.user?.id ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => handleContactSelect(contact.user!.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.user?.profileImageUrl} alt={name} />
                        <AvatarFallback>
                          {(contact.user?.firstName?.[0] || '') + (contact.user?.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{name}</p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage ? lastMessage.content : 'No messages yet'}
                          </p>
                          {unreadCount > 0 && (
                            <Badge variant="default" className="h-5 w-5 p-0 text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="border-b bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedContactData?.user?.profileImageUrl} alt={selectedContactName} />
                    <AvatarFallback>
                      {(selectedContactData?.user?.firstName?.[0] || '') + (selectedContactData?.user?.lastName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedContactName}</h3>
                    <p className="text-sm text-muted-foreground">Online</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message: Message) => {
                  const isFromMe = message.senderId !== selectedContact;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isFromMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatMessageTime(message.createdAt)}
                          {isFromMe && message.isRead && ' • Read'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t bg-card p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a contact to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}