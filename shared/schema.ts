import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts/Friends table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  contactUserId: varchar("contact_user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// Call records table
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  initiatorId: varchar("initiator_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").references(() => users.id),
  recipientNumber: varchar("recipient_number"),
  type: varchar("type").notNull(), // webrtc, twilio
  status: varchar("status").notNull().default("initiated"), // initiated, ringing, active, ended, failed
  voiceId: varchar("voice_id"),
  recordingEnabled: boolean("recording_enabled").default(false),
  recordingUrl: varchar("recording_url"),
  duration: integer("duration").default(0), // in seconds
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("text"), // text, audio, file
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// TTS messages during calls
export const ttsMessages = pgTable("tts_messages", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => calls.id),
  message: text("message").notNull(),
  voiceId: varchar("voice_id"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const insertTtsMessageSchema = createInsertSchema(ttsMessages).omit({
  id: true,
  sentAt: true,
});
export type InsertTtsMessage = z.infer<typeof insertTtsMessageSchema>;
export type TtsMessage = typeof ttsMessages.$inferSelect;
