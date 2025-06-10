import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const voiceOptions = [
  { value: "pNInz6obpgDQGcFmaJgB", label: "ElevenLabs - Rachel" },
  { value: "VR6AewLTigWG4xSOukaG", label: "ElevenLabs - Adam" },
  { value: "EXAVITQu4vr4xnSDxMaL", label: "ElevenLabs - Bella" },
  { value: "polly-joanna", label: "AWS Polly - Joanna" },
];

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Settings state
  const [settings, setSettings] = useState({
    defaultVoice: "pNInz6obpgDQGcFmaJgB",
    autoRecord: true,
    pushNotifications: true,
    darkMode: true,
    soundEffects: true,
    typingIndicators: true,
    readReceipts: true,
    onlineStatus: true,
  });

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header
        title="Settings"
        subtitle="Customize your VoiceConnect Pro experience"
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 glassmorphic border-white/10">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="glassmorphic border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-muted">First Name</Label>
                    <Input
                      defaultValue={user?.firstName}
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div>
                    <Label className="text-text-muted">Last Name</Label>
                    <Input
                      defaultValue={user?.lastName}
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-text-muted">Email</Label>
                    <Input
                      defaultValue={user?.email}
                      disabled
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </Card>

              <Card className="glassmorphic border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Dark Mode</Label>
                      <p className="text-sm text-text-muted">Use dark theme throughout the app</p>
                    </div>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, darkMode: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Sound Effects</Label>
                      <p className="text-sm text-text-muted">Play sounds for notifications and actions</p>
                    </div>
                    <Switch
                      checked={settings.soundEffects}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, soundEffects: checked })
                      }
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="calls" className="space-y-6">
              <Card className="glassmorphic border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Call Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-text-muted">Default Voice</Label>
                    <Select
                      value={settings.defaultVoice}
                      onValueChange={(value) =>
                        setSettings({ ...settings, defaultVoice: value })
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Auto-record calls</Label>
                      <p className="text-sm text-text-muted">Automatically record all calls</p>
                    </div>
                    <Switch
                      checked={settings.autoRecord}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoRecord: checked })
                      }
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card className="glassmorphic border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Message Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Typing Indicators</Label>
                      <p className="text-sm text-text-muted">Show when you're typing</p>
                    </div>
                    <Switch
                      checked={settings.typingIndicators}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, typingIndicators: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Read Receipts</Label>
                      <p className="text-sm text-text-muted">Show when messages are read</p>
                    </div>
                    <Switch
                      checked={settings.readReceipts}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, readReceipts: checked })
                      }
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card className="glassmorphic border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Online Status</Label>
                      <p className="text-sm text-text-muted">Show when you're online</p>
                    </div>
                    <Switch
                      checked={settings.onlineStatus}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, onlineStatus: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Push Notifications</Label>
                      <p className="text-sm text-text-muted">Receive notifications for new messages and calls</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, pushNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card className="glassmorphic border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
                <div className="space-y-4">
                  <Separator className="bg-white/10" />
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              className="bg-accent-cyan hover:bg-accent-cyan/80"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
