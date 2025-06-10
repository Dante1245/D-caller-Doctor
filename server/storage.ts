import {
  users,
  contacts,
  calls,
  messages,
  ttsMessages,
  type User,
  type UpsertUser,
  type Contact,
  type InsertContact,
  type Call,
  type InsertCall,
  type Message,
  type InsertMessage,
  type TtsMessage,
  type InsertTtsMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Contact operations
  getContacts(userId: string): Promise<Contact[]>;
  addContact(contact: InsertContact): Promise<Contact>;
  updateContactStatus(id: number, status: string): Promise<Contact>;
  
  // Call operations
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: number, updates: Partial<Call>): Promise<Call>;
  getCall(id: number): Promise<Call | undefined>;
  getCallHistory(userId: string): Promise<Call[]>;
  
  // Message operations
  getMessages(userId: string, contactId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  getRecentMessages(userId: string): Promise<Message[]>;
  
  // TTS operations
  addTtsMessage(ttsMessage: InsertTtsMessage): Promise<TtsMessage>;
  getTtsMessages(callId: number): Promise<TtsMessage[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Contact operations
  async getContacts(userId: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
  }

  async addContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateContactStatus(id: number, status: string): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({ status })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  // Call operations
  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db
      .insert(calls)
      .values(call)
      .returning();
    return newCall;
  }

  async updateCall(id: number, updates: Partial<Call>): Promise<Call> {
    const [call] = await db
      .update(calls)
      .set(updates)
      .where(eq(calls.id, id))
      .returning();
    return call;
  }

  async getCall(id: number): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }

  async getCallHistory(userId: string): Promise<Call[]> {
    return await db
      .select()
      .from(calls)
      .where(
        or(
          eq(calls.initiatorId, userId),
          eq(calls.recipientId, userId)
        )
      )
      .orderBy(desc(calls.createdAt));
  }

  // Message operations
  async getMessages(userId: string, contactId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.recipientId, contactId)
          ),
          and(
            eq(messages.senderId, contactId),
            eq(messages.recipientId, userId)
          )
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async getRecentMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.recipientId, userId)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);
  }

  // TTS operations
  async addTtsMessage(ttsMessage: InsertTtsMessage): Promise<TtsMessage> {
    const [newTtsMessage] = await db
      .insert(ttsMessages)
      .values(ttsMessage)
      .returning();
    return newTtsMessage;
  }

  async getTtsMessages(callId: number): Promise<TtsMessage[]> {
    return await db
      .select()
      .from(ttsMessages)
      .where(eq(ttsMessages.callId, callId))
      .orderBy(desc(ttsMessages.sentAt));
  }
}

export const storage = new DatabaseStorage();
