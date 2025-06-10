import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhoneCall, MessageSquare, Users, Mic } from "lucide-react";

export function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-purple flex items-center justify-center">
              <PhoneCall className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gradient">VoiceConnect Pro</h1>
          </div>
          <p className="text-xl text-text-muted mb-8">
            Ultra-modern communication platform with WebRTC calling, real-time TTS, and comprehensive messaging
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="glassmorphic border-white/10 p-6 text-center">
            <PhoneCall className="h-12 w-12 text-accent-cyan mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">WebRTC Calls</h3>
            <p className="text-sm text-text-muted">Crystal clear peer-to-peer calling</p>
          </Card>

          <Card className="glassmorphic border-white/10 p-6 text-center">
            <MessageSquare className="h-12 w-12 text-accent-green mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Messaging</h3>
            <p className="text-sm text-text-muted">Instant messaging with typing indicators</p>
          </Card>

          <Card className="glassmorphic border-white/10 p-6 text-center">
            <Mic className="h-12 w-12 text-accent-purple mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Live TTS</h3>
            <p className="text-sm text-text-muted">ElevenLabs voice synthesis during calls</p>
          </Card>

          <Card className="glassmorphic border-white/10 p-6 text-center">
            <Users className="h-12 w-12 text-accent-cyan mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Contact Management</h3>
            <p className="text-sm text-text-muted">Organize and manage your contacts</p>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-accent-cyan to-accent-purple hover:from-accent-cyan/80 hover:to-accent-purple/80 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Sign In with Replit
          </Button>
          <p className="text-sm text-text-muted mt-4">
            Secure authentication powered by Replit
          </p>
        </div>
      </div>
    </div>
  );
}
