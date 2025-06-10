import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Phone, MessageSquare, MoreVertical, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Contacts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newContactId, setNewContactId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactUserId: string) => {
      const response = await apiRequest("POST", "/api/contacts", {
        contactUserId,
        status: "pending",
      });
      return response.json();
    },
    onSuccess: () => {
      setNewContactId("");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact Added",
        description: "Contact request sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const handleAddContact = () => {
    if (!newContactId.trim()) return;
    addContactMutation.mutate(newContactId.trim());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-accent-green text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "blocked":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <div className="w-3 h-3 bg-accent-green rounded-full"></div>;
      case "pending":
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header
        title="Contacts"
        subtitle="Manage your contacts and connections"
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <Card className="glassmorphic border-white/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Your Contacts</h2>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent-cyan hover:bg-accent-cyan/80">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphic border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-text-muted">User ID or Email</Label>
                      <Input
                        value={newContactId}
                        onChange={(e) => setNewContactId(e.target.value)}
                        placeholder="Enter user ID or email address"
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="border-white/20"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddContact}
                        disabled={addContactMutation.isPending || !newContactId.trim()}
                        className="bg-accent-cyan hover:bg-accent-cyan/80"
                      >
                        {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-white/10 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {contacts?.map((contact: any) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-200"
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${contact.contactUserId}&background=00f5ff&color=fff&size=48`}
                      alt="Contact"
                      className="w-12 h-12 rounded-full"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {contact.contactUserId}
                        </p>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                        {getStatusIcon(contact.status)}
                      </div>
                      <p className="text-xs text-text-muted">
                        Added {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {contact.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateContactMutation.mutate({ 
                              id: contact.id, 
                              status: "accepted" 
                            })}
                            className="bg-accent-green hover:bg-accent-green/80"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateContactMutation.mutate({ 
                              id: contact.id, 
                              status: "blocked" 
                            })}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {contact.status === "accepted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 hover:bg-white/10"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 hover:bg-white/10"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-white/10"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(!contacts || contacts.length === 0) && (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No contacts yet</h3>
                    <p className="text-text-muted mb-4">
                      Start by adding your first contact to begin connecting
                    </p>
                    <Button 
                      onClick={() => setDialogOpen(true)}
                      className="bg-accent-cyan hover:bg-accent-cyan/80"
                    >
                      Add Your First Contact
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
