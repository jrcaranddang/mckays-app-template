/*
<ai_context>
API route for getting a single question with its answers and vote counts.
</ai_context>
*/

import { NextRequest, NextResponse } from "next/server"
import { getQuestionDetailAction } from "@/actions/db/qa-actions"

// GET /api/questions/[id] - Get question with answers and vote counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid question ID format" },
        { status: 400 }
      )
    }

    const result = await getQuestionDetailAction(id)

    if (!result.isSuccess) {
      if (result.message === "Question not found") {
        return NextResponse.json({ error: result.message }, { status: 404 })
      }

      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      ...result.data,
      message: result.message
    })
  } catch (error) {
    console.error("Error in GET /api/questions/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
