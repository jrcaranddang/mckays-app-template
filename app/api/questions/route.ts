/*
<ai_context>
API routes for questions in the Community Q&A Knowledge Base.
Handles both GET (list questions) and POST (create question) requests.
</ai_context>
*/

import { NextRequest, NextResponse } from "next/server"
import {
  createQuestionAction,
  getQuestionsWithVotesAction
} from "@/actions/db/questions-actions"
import { getUserIdFromRequest } from "@/lib/whop-auth"
import { CreateQuestionRequest } from "@/types"

// GET /api/questions - Get all questions with vote counts
export async function GET(request: NextRequest) {
  try {
    const result = await getQuestionsWithVotesAction()

    if (!result.isSuccess) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      questions: result.data,
      message: result.message
    })
  } catch (error) {
    console.error("Error in GET /api/questions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/questions - Create a new question
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
    const body: CreateQuestionRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      )
    }

    // Validate field lengths (matching database constraints)
    if (body.title.length <= 5) {
      return NextResponse.json(
        { error: "Title must be more than 5 characters" },
        { status: 400 }
      )
    }

    if (body.body.length <= 10) {
      return NextResponse.json(
        { error: "Body must be more than 10 characters" },
        { status: 400 }
      )
    }

    // Create the question
    const result = await createQuestionAction({
      userId,
      title: body.title,
      body: body.body
    })

    if (!result.isSuccess) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        question: result.data,
        message: result.message
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error in POST /api/questions:", error)

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
