import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Smile } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSocket } from "@/lib/socket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Messages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/messages", selectedContact],
    enabled: !!selectedContact,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: (message) => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedContact] });
      
      // Send via socket
      const socket = getSocket();
      socket?.emit('message:send', {
        recipientId: selectedContact,
        content: message.content,
        type: message.type,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('message:received', (message) => {
        if (message.senderId === selectedContact) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedContact] });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/messages/recent"] });
      });

      socket.on('message:typing', (data) => {
        if (data.senderId === selectedContact) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      socket.on('message:stop-typing', (data) => {
        if (data.senderId === selectedContact) {
          setIsTyping(false);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message:received');
        socket.off('message:typing');
        socket.off('message:stop-typing');
      }
    };
  }, [selectedContact, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;

    sendMessageMutation.mutate({
      recipientId: selectedContact,
      content: messageText,
      type: "text",
    });
  };

  const handleTyping = () => {
    const socket = getSocket();
    socket?.emit('message:typing', { recipientId: selectedContact });
    
    setTimeout(() => {
      socket?.emit('message:stop-typing', { recipientId: selectedContact });
    }, 1000);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header
        title="Messages"
        subtitle="Stay connected with real-time messaging"
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 overflow-hidden p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="h-[calc(100vh-200px)] flex gap-6">
          {/* Contacts Sidebar */}
          <Card className="w-80 glassmorphic border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Contacts</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {contacts?.map((contact: any) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.contactUserId)}
                    className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedContact === contact.contactUserId
                        ? "bg-accent-cyan/20 border border-accent-cyan/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${contact.contactUserId}&background=00f5ff&color=fff&size=40`}
                      alt="Contact"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {contact.contactUserId}
                      </p>
                      <p className="text-xs text-text-muted">
                        {contact.status === "accepted" ? "Available" : "Offline"}
                      </p>
                    </div>
                    {contact.status === "accepted" && (
                      <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 glassmorphic border-white/10 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${selectedContact}&background=00f5ff&color=fff&size=40`}
                      alt="Contact"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedContact}</h3>
                      {isTyping && (
                        <p className="text-xs text-accent-cyan">Typing...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages?.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.senderId === user?.id
                              ? "bg-accent-cyan text-white"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-5 w-5 text-text-muted" />
                    </Button>
                    <Input
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/10 border-white/20"
                    />
                    <Button variant="ghost" size="icon">
                      <Smile className="h-5 w-5 text-text-muted" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-accent-cyan hover:bg-accent-cyan/80"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Select a contact to start messaging
                  </h3>
                  <p className="text-text-muted">
                    Choose a contact from the sidebar to begin a conversation
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
