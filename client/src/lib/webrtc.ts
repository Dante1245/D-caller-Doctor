import { getSocket } from './socket';

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: number | null = null;
  private isInitiator = false;

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
    
    const socket = getSocket();
    socket?.emit('call:offer', {
      recipientId,
      offer,
      callId,
    });
  }

  async answerCall(offer: RTCSessionDescriptionInit, callId: number, callerId: string): Promise<void> {
    this.callId = callId;
    this.isInitiator = false;
    
    await this.setupPeerConnection();
    await this.getUserMedia();
    
    await this.peerConnection!.setRemoteDescription(offer);
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    
    const socket = getSocket();
    socket?.emit('call:answer', {
      callerId,
      answer,
      callId,
    });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.peerConnection!.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.peerConnection!.addIceCandidate(candidate);
  }

  private async setupPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(this.configuration);
    
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit('call:ice-candidate', {
          recipientId: this.isInitiator ? undefined : 'caller', // This should be properly managed
          candidate: event.candidate,
        });
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
        this.onCallConnected?.();
      } else if (state === 'disconnected' || state === 'failed') {
        this.endCall();
      }
    };
  }

  private async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false, // Audio only for now
      });

      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      this.onLocalStream?.(this.localStream);
    } catch (error) {
      console.error('Error accessing user media:', error);
      throw error;
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

    this.remoteStream = null;
    this.callId = null;
    
    const socket = getSocket();
    socket?.emit('call:end', { callId: this.callId });
    
    this.onCallEnded?.();
  }

  rejectCall(callId: number, callerId: string): void {
    const socket = getSocket();
    socket?.emit('call:reject', { callerId, callId });
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return true if muted
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

  // Event handlers - set these from components
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onCallConnected?: () => void;
  onCallEnded?: () => void;
}

export const webrtcManager = new WebRTCManager();
