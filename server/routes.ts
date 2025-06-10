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

  // Twilio webhook for call status updates
  app.post('/api/twilio/status', (req, res) => {
    try {
      const { CallSid, CallStatus, Duration } = req.body;
      console.log(`Twilio call ${CallSid} status: ${CallStatus}, duration: ${Duration}`);
      // Update call status in database
      res.status(200).send('OK');
    } catch (error) {
      console.error("Error handling Twilio webhook:", error);
      res.status(500).json({ message: "Failed to handle webhook" });
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
