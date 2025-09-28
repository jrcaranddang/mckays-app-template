/*
<ai_context>
Database schema for questions in the Community Q&A Knowledge Base.
</ai_context>
*/

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const questionsTable = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertQuestion = typeof questionsTable.$inferInsert
export type SelectQuestion = typeof questionsTable.$inferSelect
