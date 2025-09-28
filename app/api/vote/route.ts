/*
<ai_context>
API route for toggling votes in the Community Q&A Knowledge Base.
</ai_context>
*/

import { NextRequest, NextResponse } from "next/server"
import { toggleVoteAction } from "@/actions/db/votes-actions"
import { getUserIdFromRequest } from "@/lib/whop-auth"
import { VoteRequest } from "@/types"

// POST /api/vote - Toggle vote on a question or answer
export async function POST(request: NextRequest) {
  try {
    // Get user ID from Whop authentication
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse request body
    const body: VoteRequest = await request.json()

    // Validate that exactly one of question_id or answer_id is provided
    const hasQuestionId = !!body.question_id
    const hasAnswerId = !!body.answer_id

    if (!hasQuestionId && !hasAnswerId) {
      return NextResponse.json(
        { error: "Either question_id or answer_id is required" },
        { status: 400 }
      )
    }

    if (hasQuestionId && hasAnswerId) {
      return NextResponse.json(
        { error: "Cannot vote on both question and answer simultaneously" },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (hasQuestionId && !uuidRegex.test(body.question_id!)) {
      return NextResponse.json(
        { error: "Invalid question ID format" },
        { status: 400 }
      )
    }

    if (hasAnswerId && !uuidRegex.test(body.answer_id!)) {
      return NextResponse.json(
        { error: "Invalid answer ID format" },
        { status: 400 }
      )
    }

    // Toggle the vote
    const result = await toggleVoteAction({
      userId,
      questionId: body.question_id || null,
      answerId: body.answer_id || null
    })

    if (!result.isSuccess) {
      // Check for foreign key constraint error (question/answer doesn't exist)
      if (
        result.message.includes("foreign key") ||
        result.message.includes("violates")
      ) {
        const itemType = hasQuestionId ? "Question" : "Answer"
        return NextResponse.json(
          { error: `${itemType} not found` },
          { status: 404 }
        )
      }

      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      ...result.data,
      message: result.message
    })
  } catch (error) {
    console.error("Error in POST /api/vote:", error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
