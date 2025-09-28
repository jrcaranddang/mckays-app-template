/*
<ai_context>
Combined server actions for Q&A functionality in the Community Q&A Knowledge Base.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import { questionsTable, answersTable, votesTable } from "@/db/schema"
import { ActionState, QuestionDetailResponse, QuestionWithVotes, AnswerWithVotes } from "@/types"
import { eq, sql } from "drizzle-orm"

export async function getQuestionDetailAction(
  questionId: string
): Promise<ActionState<QuestionDetailResponse>> {
  try {
    // Get question with vote count
    const questionWithVotes = await db
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
      .where(eq(questionsTable.id, questionId))
      .groupBy(questionsTable.id)

    if (questionWithVotes.length === 0) {
      return { isSuccess: false, message: "Question not found" }
    }

    const question = questionWithVotes[0] as QuestionWithVotes

    // Get answers with vote counts
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
      .orderBy(answersTable.createdAt)

    const answers = answersWithVotes as AnswerWithVotes[]

    return {
      isSuccess: true,
      message: "Question detail retrieved successfully",
      data: {
        question,
        answers
      }
    }
  } catch (error) {
    console.error("Error getting question detail:", error)
    return { isSuccess: false, message: "Failed to get question detail" }
  }
}