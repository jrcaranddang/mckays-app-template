/*
<ai_context>
Server actions for votes in the Community Q&A Knowledge Base.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import { InsertVote, SelectVote, votesTable } from "@/db/schema"
import { ActionState, VoteResponse, UserVoteStatus } from "@/types"
import { eq, and } from "drizzle-orm"

export async function toggleVoteAction(
  vote: InsertVote
): Promise<ActionState<VoteResponse>> {
  try {
    // Check if user has already voted on this item
    let existingVote: SelectVote | undefined

    if (vote.questionId) {
      existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votesTable.userId, vote.userId),
          eq(votesTable.questionId, vote.questionId)
        )
      })
    } else if (vote.answerId) {
      existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votesTable.userId, vote.userId),
          eq(votesTable.answerId, vote.answerId)
        )
      })
    }

    if (existingVote) {
      // Delete existing vote
      await db.delete(votesTable).where(eq(votesTable.id, existingVote.id))
      return {
        isSuccess: true,
        message: "Vote removed successfully",
        data: { status: "deleted", message: "Vote removed successfully" }
      }
    } else {
      // Create new vote
      await db.insert(votesTable).values(vote)
      return {
        isSuccess: true,
        message: "Vote created successfully",
        data: { status: "created", message: "Vote created successfully" }
      }
    }
  } catch (error) {
    console.error("Error toggling vote:", error)
    return { isSuccess: false, message: "Failed to toggle vote" }
  }
}

export async function getUserVoteStatusAction(
  userId: string,
  questionId?: string,
  answerId?: string
): Promise<ActionState<UserVoteStatus>> {
  try {
    let existingVote: SelectVote | undefined

    if (questionId) {
      existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votesTable.userId, userId),
          eq(votesTable.questionId, questionId)
        )
      })
    } else if (answerId) {
      existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votesTable.userId, userId),
          eq(votesTable.answerId, answerId)
        )
      })
    }

    return {
      isSuccess: true,
      message: "Vote status retrieved successfully",
      data: {
        has_voted: !!existingVote,
        vote_id: existingVote?.id
      }
    }
  } catch (error) {
    console.error("Error getting vote status:", error)
    return { isSuccess: false, message: "Failed to get vote status" }
  }
}

export async function getVoteCountAction(
  questionId?: string,
  answerId?: string
): Promise<ActionState<number>> {
  try {
    let voteCount = 0

    if (questionId) {
      const votes = await db.query.votes.findMany({
        where: eq(votesTable.questionId, questionId)
      })
      voteCount = votes.length
    } else if (answerId) {
      const votes = await db.query.votes.findMany({
        where: eq(votesTable.answerId, answerId)
      })
      voteCount = votes.length
    }

    return {
      isSuccess: true,
      message: "Vote count retrieved successfully",
      data: voteCount
    }
  } catch (error) {
    console.error("Error getting vote count:", error)
    return { isSuccess: false, message: "Failed to get vote count" }
  }
}