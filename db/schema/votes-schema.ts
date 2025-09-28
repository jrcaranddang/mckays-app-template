/*
<ai_context>
Database schema for votes in the Community Q&A Knowledge Base.
</ai_context>
*/

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { questionsTable } from "./questions-schema"
import { answersTable } from "./answers-schema"

export const votesTable = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  questionId: uuid("question_id").references(() => questionsTable.id, {
    onDelete: "cascade"
  }),
  answerId: uuid("answer_id").references(() => answersTable.id, {
    onDelete: "cascade"
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertVote = typeof votesTable.$inferInsert
export type SelectVote = typeof votesTable.$inferSelect
