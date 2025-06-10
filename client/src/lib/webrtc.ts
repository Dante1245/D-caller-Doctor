import { getSocket } from "./socket";

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: number | null = null;
  private isInitiator = false;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async initializeCall(recipientId: string, callId: number): Promise<void> {
    this.callId = callId;
    this.isInitiator = true;
    await this.setupPeerConnection();
    await this.getUserMedia();
    
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);
    
    // Send offer via socket
    const socket = getSocket();
    if (socket) {
      socket.emit('webrtc-offer', {
        callId,
        recipientId,
        offer
      });
    }
  }

  async answerCall(offer: RTCSessionDescriptionInit, callId: number, callerId: string): Promise<void> {
    this.callId = callId;
    this.isInitiator = false;
    await this.setupPeerConnection();
    await this.getUserMedia();
    
    await this.peerConnection!.setRemoteDescription(offer);
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    
    // Send answer via socket
    const socket = getSocket();
    if (socket) {
      socket.emit('webrtc-answer', {
        callId,
        callerId,
        answer
      });
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(candidate);
    }
  }

  private async setupPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(this.configuration);
    
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket && this.callId) {
          socket.emit('webrtc-ice-candidate', {
            callId: this.callId,
            candidate: event.candidate
          });
        }
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      this.onConnectionStateChange?.(state);
      
      if (state === 'connected') {
        this.setupAudioContext();
        this.onCallConnected?.();
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.onCallEnded?.();
      }
    };
  }

  private async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      
      this.onLocalStream?.(this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  private setupAudioContext(): void {
    try {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      
      if (this.localStream) {
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.localStream);
        this.mediaStreamSource.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
      }
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  }

  async injectTTSAudio(audioData: string, mimeType: string = 'audio/mpeg'): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      console.error('Audio context not initialized');
      return;
    }

    try {
      // Decode base64 audio data
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      
      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to gain node for mixing with existing audio
      const ttsGain = this.audioContext.createGain();
      ttsGain.gain.value = 0.8; // Adjust TTS volume
      
      source.connect(ttsGain);
      ttsGain.connect(this.gainNode);
      
      // Play the TTS audio
      source.start();
      
      console.log('TTS audio injected successfully');
    } catch (error) {
      console.error('Error injecting TTS audio:', error);
    }
  }

  async sendTTSMessage(message: string, voiceId?: string): Promise<void> {
    if (!this.callId) {
      console.error('No active call for TTS injection');
      return;
    }

    try {
      const response = await fetch('/api/tts/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: this.callId,
          message,
          voiceId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate TTS');
      }

      const data = await response.json();
      await this.injectTTSAudio(data.audioData, data.mimeType);
    } catch (error) {
      console.error('Error sending TTS message:', error);
    }
  }

  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.gainNode = null;
    this.mediaStreamSource = null;
    this.callId = null;
    this.isInitiator = false;
    this.onCallEnded?.();
  }

  rejectCall(callId: number, callerId: string): void {
    const socket = getSocket();
    if (socket) {
      socket.emit('webrtc-reject', { callId, callerId });
    }
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getCurrentCallId(): number | null {
    return this.callId;
  }

  // Callback functions
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onCallConnected?: () => void;
  onCallEnded?: () => void;
}

export const webrtcManager = new WebRTCManager();