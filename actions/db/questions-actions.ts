/*
<ai_context>
Server actions for questions in the Community Q&A Knowledge Base.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import { InsertQuestion, SelectQuestion, questionsTable, votesTable } from "@/db/schema"
import { ActionState, QuestionWithVotes } from "@/types"
import { eq, desc, sql } from "drizzle-orm"

export async function createQuestionAction(
  question: InsertQuestion
): Promise<ActionState<SelectQuestion>> {
  try {
    const [newQuestion] = await db.insert(questionsTable).values(question).returning()
    return {
      isSuccess: true,
      message: "Question created successfully",
      data: newQuestion
    }
  } catch (error) {
    console.error("Error creating question:", error)
    return { isSuccess: false, message: "Failed to create question" }
  }
}

export async function getQuestionsWithVotesAction(): Promise<ActionState<QuestionWithVotes[]>> {
  try {
    const questionsWithVotes = await db
      .select({
        id: questionsTable.id,
        userId: questionsTable.userId,
        title: questionsTable.title,
        body: questionsTable.body,
        createdAt: questionsTable.createdAt,
        updatedAt: questionsTable.updatedAt,
        vote_count: sql<number>`COALESCE(COUNT(${votesTable.id}), 0)`
      })
      .from(questionsTable)
      .leftJoin(votesTable, eq(questionsTable.id, votesTable.questionId))
      .groupBy(questionsTable.id)
      .orderBy(desc(questionsTable.createdAt))

    return {
      isSuccess: true,
      message: "Questions retrieved successfully",
      data: questionsWithVotes
    }
  } catch (error) {
    console.error("Error getting questions with votes:", error)
    return { isSuccess: false, message: "Failed to get questions" }
  }
}

export async function getQuestionByIdAction(
  id: string
): Promise<ActionState<SelectQuestion>> {
  try {
    const question = await db.query.questions.findFirst({
      where: eq(questionsTable.id, id)
    })

    if (!question) {
      return { isSuccess: false, message: "Question not found" }
    }

    return {
      isSuccess: true,
      message: "Question retrieved successfully",
      data: question
    }
  } catch (error) {
    console.error("Error getting question:", error)
    return { isSuccess: false, message: "Failed to get question" }
  }
}

export async function updateQuestionAction(
  id: string,
  data: Partial<InsertQuestion>
): Promise<ActionState<SelectQuestion>> {
  try {
    const [updatedQuestion] = await db
      .update(questionsTable)
      .set(data)
      .where(eq(questionsTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Question updated successfully",
      data: updatedQuestion
    }
  } catch (error) {
    console.error("Error updating question:", error)
    return { isSuccess: false, message: "Failed to update question" }
  }
}

export async function deleteQuestionAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(questionsTable).where(eq(questionsTable.id, id))
    return {
      isSuccess: true,
      message: "Question deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting question:", error)
    return { isSuccess: false, message: "Failed to delete question" }
  }
}