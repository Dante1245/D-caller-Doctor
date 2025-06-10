import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSocketHandlers } from "./socketHandlers";
import {
  insertContactSchema,
  insertCallSchema,
  insertMessageSchema,
  insertTtsMessageSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Contact routes
  app.get('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contactData = insertContactSchema.parse({
        ...req.body,
        userId,
      });
      const contact = await storage.addContact(contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error adding contact:", error);
      res.status(500).json({ message: "Failed to add contact" });
    }
  });

  app.patch('/api/contacts/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const contact = await storage.updateContactStatus(parseInt(id), status);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact status:", error);
      res.status(500).json({ message: "Failed to update contact status" });
    }
  });

  // Call routes
  app.post('/api/calls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const callData = insertCallSchema.parse({
        ...req.body,
        initiatorId: userId,
      });
      const call = await storage.createCall(callData);
      res.json(call);
    } catch (error) {
      console.error("Error creating call:", error);
      res.status(500).json({ message: "Failed to create call" });
    }
  });

  app.patch('/api/calls/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const call = await storage.updateCall(parseInt(id), updates);
      res.json(call);
    } catch (error) {
      console.error("Error updating call:", error);
      res.status(500).json({ message: "Failed to update call" });
    }
  });

  app.get('/api/calls/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calls = await storage.getCallHistory(userId);
      res.json(calls);
    } catch (error) {
      console.error("Error fetching call history:", error);
      res.status(500).json({ message: "Failed to fetch call history" });
    }
  });

  // Message routes
  app.get('/api/messages/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      const messages = await storage.getMessages(userId, contactId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });
      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getRecentMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      res.status(500).json({ message: "Failed to fetch recent messages" });
    }
  });

  // TTS routes
  app.post('/api/tts', isAuthenticated, async (req: any, res) => {
    try {
      const ttsData = insertTtsMessageSchema.parse(req.body);
      const ttsMessage = await storage.addTtsMessage(ttsData);
      
      // Send TTS via ElevenLabs API
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || "";
      if (elevenLabsApiKey) {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ttsData.voiceId || 'pNInz6obpgDQGcFmaJgB'}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: ttsData.message,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
          });
          res.send(Buffer.from(audioBuffer));
        } else {
          res.status(500).json({ message: "TTS generation failed" });
        }
      } else {
        res.json(ttsMessage);
      }
    } catch (error) {
      console.error("Error processing TTS:", error);
      res.status(500).json({ message: "Failed to process TTS" });
    }
  });

  // Twilio calling functionality
  app.post('/api/calls/twilio', isAuthenticated, async (req: any, res) => {
    try {
      const { to, voiceId } = req.body;
      const userId = req.user.claims.sub;
      
      // Create call record
      const call = await storage.createCall({
        initiatorId: userId,
        recipientNumber: to,
        type: 'twilio',
        status: 'initiated',
        voiceId: voiceId || process.env.ELEVENLABS_VOICE_ID
      });

      // Initialize Twilio call using REST API
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const twilioCall = await client.calls.create({
        url: `https://${req.get('host')}/api/twilio/twiml/${call.id}`,
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER,
        statusCallback: `https://${req.get('host')}/api/twilio/status`,
        statusCallbackMethod: 'POST'
      });

      await storage.updateCall(call.id, { 
        status: 'ringing',
        startedAt: new Date()
      });

      res.json({ call, twilioCallSid: twilioCall.sid });
    } catch (error) {
      console.error("Error initiating Twilio call:", error);
      res.status(500).json({ message: "Failed to initiate call" });
    }
  });

  // TwiML endpoint for call handling
  app.post('/api/twilio/twiml/:callId', async (req, res) => {
    try {
      const callId = parseInt(req.params.callId);
      const call = await storage.getCall(callId);
      
      if (!call) {
        return res.status(404).send('Call not found');
      }

      const twilio = require('twilio');
      const twiml = new twilio.twiml.VoiceResponse();
      
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Hello! This is a call from VoiceConnect Pro. Please hold while we connect you.');
      
      if (call.recipientNumber) {
        twiml.dial({
          timeout: 30,
          hangupOnStar: true
        }, call.recipientNumber);
      }

      res.type('text/xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error("Error generating TwiML:", error);
      res.status(500).send('Error processing call');
    }
  });

  // Twilio webhook for call status updates
  app.post('/api/twilio/status', async (req, res) => {
    try {
      const { CallSid, CallStatus, Duration, CallDuration } = req.body;
      console.log(`Twilio call ${CallSid} status: ${CallStatus}, duration: ${Duration || CallDuration}`);
      
      // Find and update call status in database
      // This would require adding a twilioCallSid field to track calls
      
      res.status(200).send('OK');
    } catch (error) {
      console.error("Error handling Twilio webhook:", error);
      res.status(500).json({ message: "Failed to handle webhook" });
    }
  });

  // ElevenLabs voice management
  app.get('/api/voices', isAuthenticated, async (req: any, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "ElevenLabs API key not configured" });
      }

      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices from ElevenLabs');
      }

      const voices = await response.json();
      res.json(voices);
    } catch (error) {
      console.error("Error fetching voices:", error);
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });

  // Enhanced TTS endpoint with voice injection
  app.post('/api/tts/inject', isAuthenticated, async (req: any, res) => {
    try {
      const { callId, message, voiceId } = req.body;
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ message: "ElevenLabs API key not configured" });
      }

      // Generate TTS audio
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || process.env.ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: message,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate TTS audio');
      }

      // Store TTS message record
      const ttsMessage = await storage.addTtsMessage({
        callId: parseInt(callId),
        message,
        voiceId: voiceId || process.env.ELEVENLABS_VOICE_ID
      });

      // Return audio data for WebRTC injection
      const audioBuffer = await response.arrayBuffer();
      
      res.json({ 
        ttsMessage,
        audioData: Buffer.from(audioBuffer).toString('base64'),
        mimeType: 'audio/mpeg'
      });
    } catch (error) {
      console.error("Error generating TTS for injection:", error);
      res.status(500).json({ message: "Failed to generate TTS audio" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  setupSocketHandlers(io, storage);

  return httpServer;
}
