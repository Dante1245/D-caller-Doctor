import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { webrtcManager } from "@/lib/webrtc";
import { getSocket } from "@/lib/socket";

const voiceOptions = [
  { value: "pNInz6obpgDQGcFmaJgB", label: "ElevenLabs - Rachel" },
  { value: "VR6AewLTigWG4xSOukaG", label: "ElevenLabs - Adam" },
  { value: "EXAVITQu4vr4xnSDxMaL", label: "ElevenLabs - Bella" },
  { value: "polly-joanna", label: "AWS Polly - Joanna" },
];

export function CallInterface() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("pNInz6obpgDQGcFmaJgB");
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCallMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calls", data);
      return response.json();
    },
    onSuccess: (call) => {
      setIsCallActive(true);
      toast({
        title: "Call Initiated",
        description: `Calling ${phoneNumber || call.recipientId}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calls/history"] });
    },
    onError: (error) => {
      toast({
        title: "Call Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendTtsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tts", data);
      return response.json();
    },
    onSuccess: () => {
      setLiveMessage("");
      toast({
        title: "TTS Sent",
        description: "Voice message sent to call",
      });
    },
  });

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number or select a contact",
        variant: "destructive",
      });
      return;
    }

    // Determine if it's a WebRTC call (user ID) or Twilio call (phone number)
    const isPhoneNumber = /^\+?[\d\s\-\(\)]+$/.test(phoneNumber);
    
    const callData = {
      type: isPhoneNumber ? "twilio" : "webrtc",
      recipientNumber: isPhoneNumber ? phoneNumber : undefined,
      recipientId: isPhoneNumber ? undefined : phoneNumber,
      voiceId: selectedVoice,
      recordingEnabled,
      status: "initiated",
    };

    if (callData.type === "webrtc") {
      // Initialize WebRTC call
      try {
        const call = await createCallMutation.mutateAsync(callData);
        await webrtcManager.initializeCall(phoneNumber, call.id);
      } catch (error) {
        console.error("WebRTC call failed:", error);
      }
    } else {
      // Twilio call
      createCallMutation.mutate(callData);
    }
  };

  const handleEndCall = () => {
    if (isCallActive) {
      webrtcManager.endCall();
      setIsCallActive(false);
      toast({
        title: "Call Ended",
        description: "Call has been terminated",
      });
    }
  };

  const handleToggleMute = () => {
    const muted = webrtcManager.toggleMute();
    setIsMuted(muted);
    toast({
      title: muted ? "Microphone Muted" : "Microphone Unmuted",
      description: muted ? "You are now muted" : "You are now unmuted",
    });
  };

  const handleSendTts = () => {
    if (!liveMessage.trim()) return;
    
    const socket = getSocket();
    socket?.emit('tts:send', {
      message: liveMessage,
      voiceId: selectedVoice,
      callId: 1, // This should be the actual call ID
    });

    sendTtsMutation.mutate({
      message: liveMessage,
      voiceId: selectedVoice,
      callId: 1,
    });
  };

  return (
    <div className="lg:col-span-2">
      <Card className="glassmorphic border-white/10 p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-6">Quick Call Interface</h3>
        
        {/* Call Input Section */}
        <div className="space-y-4 mb-6">
          <div>
            <Label className="block text-sm font-medium text-text-muted mb-2">
              Phone Number or Contact
            </Label>
            <Input
              type="text"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-text-muted mb-2">
                Voice ID
              </Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-full bg-white/10 border border-white/20 rounded-xl">
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
            
            <div className="flex items-end space-x-2">
              <div className="flex items-center space-x-2 text-sm text-text-muted">
                <Checkbox
                  checked={recordingEnabled}
                  onCheckedChange={setRecordingEnabled}
                  className="w-4 h-4"
                />
                <span>Record Call</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          {!isCallActive ? (
            <Button
              onClick={handleStartCall}
              disabled={createCallMutation.isPending}
              className="flex items-center space-x-2 bg-accent-green hover:bg-accent-green/80 px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              <Phone className="h-5 w-5" />
              <span>{createCallMutation.isPending ? "Connecting..." : "Start Call"}</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleEndCall}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl font-medium"
              >
                <PhoneOff className="h-5 w-5" />
                <span>End Call</span>
              </Button>
              
              <Button
                onClick={handleToggleMute}
                variant="outline"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
            </>
          )}
        </div>

        {/* Live TTS Input */}
        <div className="border-t border-white/10 pt-6">
          <Label className="block text-sm font-medium text-text-muted mb-2">
            Live TTS Message
          </Label>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type message to speak during call..."
              value={liveMessage}
              onChange={(e) => setLiveMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendTts()}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl"
            />
            <Button
              onClick={handleSendTts}
              disabled={sendTtsMutation.isPending || !liveMessage.trim()}
              className="bg-accent-cyan hover:bg-accent-cyan/80 px-6 py-3 rounded-xl"
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
