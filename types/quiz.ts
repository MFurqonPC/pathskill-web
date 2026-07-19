export interface QuizOption {
  id: number;
  option_text: string;
  order: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  order: number;
  options: QuizOption[];
  answered_option_id: number | null;
  is_correct: boolean | null;
  explanation: string | null;
  correct_option_id: number | null;
}

export interface QuizResponse {
  id: number;
  assignment_id: number;
  title: string;
  total_questions: number;
  questions: QuizQuestion[];
}

export interface QuizAnswerResponse {
  is_correct: boolean;
  correct_option_id: number;
  explanation: string | null;
}
