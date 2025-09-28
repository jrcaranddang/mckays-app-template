/*
<ai_context>
Server actions for answers in the Community Q&A Knowledge Base.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import { InsertAnswer, SelectAnswer, answersTable, votesTable } from "@/db/schema"
import { ActionState, AnswerWithVotes } from "@/types"
import { eq, asc, sql } from "drizzle-orm"

export async function createAnswerAction(
  answer: InsertAnswer
): Promise<ActionState<SelectAnswer>> {
  try {
    const [newAnswer] = await db.insert(answersTable).values(answer).returning()
    return {
      isSuccess: true,
      message: "Answer created successfully",
      data: newAnswer
    }
  } catch (error) {
    console.error("Error creating answer:", error)
    return { isSuccess: false, message: "Failed to create answer" }
  }
}

export async function getAnswersByQuestionIdAction(
  questionId: string
): Promise<ActionState<AnswerWithVotes[]>> {
  try {
    const answersWithVotes = await db
      .select({
        id: answersTable.id,
        userId: answersTable.userId,
        questionId: answersTable.questionId,
        body: answersTable.body,
        createdAt: answersTable.createdAt,
        updatedAt: answersTable.updatedAt,
        vote_count: sql<number>`COALESCE(COUNT(${votesTable.id}), 0)`
      })
      .from(answersTable)
      .leftJoin(votesTable, eq(answersTable.id, votesTable.answerId))
      .where(eq(answersTable.questionId, questionId))
      .groupBy(answersTable.id)
      .orderBy(asc(answersTable.createdAt))

    return {
      isSuccess: true,
      message: "Answers retrieved successfully",
      data: answersWithVotes
    }
  } catch (error) {
    console.error("Error getting answers:", error)
    return { isSuccess: false, message: "Failed to get answers" }
  }
}

export async function getAnswerByIdAction(
  id: string
): Promise<ActionState<SelectAnswer>> {
  try {
    const answer = await db.query.answers.findFirst({
      where: eq(answersTable.id, id)
    })

    if (!answer) {
      return { isSuccess: false, message: "Answer not found" }
    }

    return {
      isSuccess: true,
      message: "Answer retrieved successfully",
      data: answer
    }
  } catch (error) {
    console.error("Error getting answer:", error)
    return { isSuccess: false, message: "Failed to get answer" }
  }
}

export async function updateAnswerAction(
  id: string,
  data: Partial<InsertAnswer>
): Promise<ActionState<SelectAnswer>> {
  try {
    const [updatedAnswer] = await db
      .update(answersTable)
      .set(data)
      .where(eq(answersTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Answer updated successfully",
      data: updatedAnswer
    }
  } catch (error) {
    console.error("Error updating answer:", error)
    return { isSuccess: false, message: "Failed to update answer" }
  }
}

export async function deleteAnswerAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(answersTable).where(eq(answersTable.id, id))
    return {
      isSuccess: true,
      message: "Answer deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting answer:", error)
    return { isSuccess: false, message: "Failed to delete answer" }
  }
}