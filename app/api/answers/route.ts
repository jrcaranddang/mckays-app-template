/*
<ai_context>
API route for creating answers in the Community Q&A Knowledge Base.
</ai_context>
*/

import { NextRequest, NextResponse } from "next/server"
import { createAnswerAction } from "@/actions/db/answers-actions"
import { getUserIdFromRequest } from "@/lib/whop-auth"
import { CreateAnswerRequest } from "@/types"

// POST /api/answers - Create a new answer
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
    const body: CreateAnswerRequest = await request.json()

    // Validate required fields
    if (!body.body || !body.question_id) {
      return NextResponse.json(
        { error: "Body and question_id are required" },
        { status: 400 }
      )
    }

    // Validate field length (matching database constraint)
    if (body.body.length <= 10) {
      return NextResponse.json(
        { error: "Body must be more than 10 characters" },
        { status: 400 }
      )
    }

    // Validate UUID format for question_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(body.question_id)) {
      return NextResponse.json(
        { error: "Invalid question ID format" },
        { status: 400 }
      )
    }

    // Create the answer
    const result = await createAnswerAction({
      userId,
      questionId: body.question_id,
      body: body.body
    })

    if (!result.isSuccess) {
      // Check for foreign key constraint error (question doesn't exist)
      if (
        result.message.includes("foreign key") ||
        result.message.includes("violates")
      ) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        answer: result.data,
        message: result.message
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error in POST /api/answers:", error)

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
