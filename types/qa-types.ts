/*
<ai_context>
Types for the Community Q&A Knowledge Base system.
</ai_context>
*/

import { SelectQuestion, SelectAnswer, SelectVote } from "@/db/schema"

// Extended types with vote counts
export interface QuestionWithVotes extends SelectQuestion {
  vote_count: number
}

export interface AnswerWithVotes extends SelectAnswer {
  vote_count: number
}

// API request/response types
export interface CreateQuestionRequest {
  title: string
  body: string
}

export interface CreateAnswerRequest {
  body: string
  question_id: string
}

export interface VoteRequest {
  question_id?: string
  answer_id?: string
}

export interface VoteResponse {
  status: "created" | "deleted"
  message: string
}

export interface QuestionDetailResponse {
  question: QuestionWithVotes
  answers: AnswerWithVotes[]
}

// Vote status for checking if user has voted
export interface UserVoteStatus {
  has_voted: boolean
  vote_id?: string
}
