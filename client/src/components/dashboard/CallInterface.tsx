import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Send,
  Volume2,
  Users,
  Settings
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { webrtcManager } from "@/lib/webrtc";
import { socketManager } from "@/lib/socket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

export function CallInterface() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("idle");
  const [ttsMessage, setTtsMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callType, setCallType] = useState<"webrtc" | "twilio">("webrtc");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available voices
  const { data: voices } = useQuery<{ voices: Voice[] }>({
    queryKey: ['/api/voices'],
    enabled: true
  });

  // Call mutations
  const webrtcCallMutation = useMutation({
    mutationFn: async (data: { recipientId: string; voiceId?: string }) => {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: data.recipientId,
          type: 'webrtc',
          voiceId: data.voiceId
        })
      });
      if (!response.ok) throw new Error('Failed to initiate call');
      return response.json();
    }
  });

  const twilioCallMutation = useMutation({
    mutationFn: async (data: { to: string; voiceId?: string }) => {
      const response = await fetch('/api/calls/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to initiate Twilio call');
      return response.json();
    }
  });

  useEffect(() => {
    // Setup WebRTC callbacks
    webrtcManager.onLocalStream = (stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    webrtcManager.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    webrtcManager.onCallConnected = () => {
      setCallStatus("connected");
      callStartTime.current = Date.now();
      toast({
        title: "Call Connected",
        description: "You are now connected to the call"
      });
    };

    webrtcManager.onCallEnded = () => {
      setIsCallActive(false);
      setCallStatus("idle");
      setCallDuration(0);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    webrtcManager.onConnectionStateChange = (state) => {
      setCallStatus(state);
    };

    // Setup socket for incoming calls
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('incoming-call', (data) => {
        // Handle incoming call notification
        toast({
          title: "Incoming Call",
          description: `Call from ${data.callerName || 'Unknown'}`
        });
      });

      socket.on('webrtc-offer', async (data) => {
        try {
          await webrtcManager.answerCall(data.offer, data.callId, data.callerId);
          setIsCallActive(true);
          setCallStatus("connecting");
        } catch (error) {
          console.error('Error answering call:', error);
        }
      });

      socket.on('webrtc-answer', async (data) => {
        try {
          await webrtcManager.handleAnswer(data.answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      });

      socket.on('webrtc-ice-candidate', async (data) => {
        try {
          await webrtcManager.handleIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      });

      socket.on('call-ended', () => {
        webrtcManager.endCall();
        toast({
          title: "Call Ended",
          description: "The call has been terminated"
        });
      });
    }

    return () => {
      webrtcManager.endCall();
      if (socket) {
        socket.off('incoming-call');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('call-ended');
      }
    };
  }, [toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive && callStatus === "connected") {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, callStatus]);

  const handleStartWebRTCCall = async () => {
    try {
      setIsCallActive(true);
      setCallStatus("connecting");
      
      // For demo purposes, we'll simulate a WebRTC call
      const callData = await webrtcCallMutation.mutateAsync({
        recipientId: "demo-user",
        voiceId: selectedVoice
      });
      
      await webrtcManager.initializeCall("demo-user", callData.id);
      
      toast({
        title: "Call Initiated",
        description: "WebRTC call started successfully"
      });
    } catch (error) {
      console.error('Error starting WebRTC call:', error);
      setIsCallActive(false);
      setCallStatus("error");
      toast({
        title: "Call Failed",
        description: "Failed to start WebRTC call",
        variant: "destructive"
      });
    }
  };

  const handleStartTwilioCall = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCallActive(true);
      setCallStatus("connecting");
      
      const callData = await twilioCallMutation.mutateAsync({
        to: phoneNumber,
        voiceId: selectedVoice
      });
      
      toast({
        title: "Twilio Call Initiated",
        description: `Calling ${phoneNumber}...`
      });
    } catch (error) {
      console.error('Error starting Twilio call:', error);
      setIsCallActive(false);
      setCallStatus("error");
      toast({
        title: "Call Failed",
        description: "Failed to initiate Twilio call",
        variant: "destructive"
      });
    }
  };

  const handleEndCall = () => {
    webrtcManager.endCall();
    
    // Notify server to end call
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('end-call', { callId: webrtcManager.getCurrentCallId() });
    }
  };

  const toggleMute = () => {
    const muted = webrtcManager.toggleMute();
    setIsMuted(muted);
  };

  const toggleVideo = () => {
    const videoOff = webrtcManager.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const sendTTSMessage = async () => {
    if (ttsMessage.trim()) {
      try {
        await webrtcManager.sendTTSMessage(ttsMessage, selectedVoice);
        setTtsMessage("");
        toast({
          title: "TTS Injected",
          description: "Voice message injected into call"
        });
      } catch (error) {
        toast({
          title: "TTS Failed",
          description: "Failed to inject voice message",
          variant: "destructive"
        });
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Call Status Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant={isCallActive ? "default" : "secondary"} className="animate-pulse">
                {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
              </Badge>
              {isCallActive && callStatus === "connected" && (
                <span className="text-sm font-mono text-muted-foreground">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isMuted && <MicOff className="h-4 w-4 text-red-500" />}
              {isVideoOff && <VideoOff className="h-4 w-4 text-red-500" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Remote Video */}
        <Card className="aspect-video bg-black rounded-lg overflow-hidden">
          <CardContent className="p-0 h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isCallActive && (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-gray-400">
                  <Phone className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No active call</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Local Video */}
        <Card className="aspect-video bg-black rounded-lg overflow-hidden">
          <CardContent className="p-0 h-full relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isCallActive && (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-800 to-purple-800">
                <div className="text-center text-white">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Your video</p>
                </div>
              </div>
            )}
            <Badge className="absolute top-2 left-2 bg-black/50 text-white">
              You
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Call Controls */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="webrtc" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="webrtc" onClick={() => setCallType("webrtc")}>
                <Users className="h-4 w-4 mr-2" />
                WebRTC Call
              </TabsTrigger>
              <TabsTrigger value="twilio" onClick={() => setCallType("twilio")}>
                <Phone className="h-4 w-4 mr-2" />
                Phone Call
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="webrtc" className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                {!isCallActive ? (
                  <Button
                    onClick={handleStartWebRTCCall}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                    disabled={webrtcCallMutation.isPending}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Start WebRTC Call
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="lg"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    <Button
                      variant={isVideoOff ? "destructive" : "outline"}
                      size="lg"
                      onClick={toggleVideo}
                    >
                      {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>

                    <Button
                      onClick={handleEndCall}
                      size="lg"
                      variant="destructive"
                      className="px-8"
                    >
                      <PhoneOff className="h-5 w-5 mr-2" />
                      End Call
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="twilio" className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number (+1234567890)"
                  className="flex-1"
                />
                <Button
                  onClick={handleStartTwilioCall}
                  disabled={!phoneNumber || twilioCallMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* TTS Injection Panel */}
      {isCallActive && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  TTS Voice Injection
                </h3>
              </div>
              
              <div className="flex space-x-2">
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices && voices.voices && voices.voices.map((voice: Voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name} ({voice.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={ttsMessage}
                  onChange={(e) => setTtsMessage(e.target.value)}
                  placeholder="Enter message to inject as voice..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && sendTTSMessage()}
                />
                <Button onClick={sendTTSMessage} disabled={!ttsMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Type a message to inject AI-generated voice into the active call
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}