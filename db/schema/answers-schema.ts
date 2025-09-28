/*
<ai_context>
Database schema for answers in the Community Q&A Knowledge Base.
</ai_context>
*/

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { questionsTable } from "./questions-schema"

export const answersTable = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  questionId: uuid("question_id")
    .references(() => questionsTable.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertAnswer = typeof answersTable.$inferInsert
export type SelectAnswer = typeof answersTable.$inferSelect
