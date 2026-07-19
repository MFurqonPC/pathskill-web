export interface ChecklistItem {
  id: number;
  statement: string;
  checked: boolean;
}

export interface ScenarioItem {
  id: number;
  scenario_text: string;
  confidence_level: number; // 1-5
}

export interface SafeQuizQuestion {
  id: number;
  question_text: string;
  code_snippet: string | null;
  options: string[];
}

export interface Step2ContentResponse {
  checklist: ChecklistItem[];
  scenarios: ScenarioItem[];
  warmup_question: SafeQuizQuestion | null;
  
  // --- INI TEMPAT YANG BENAR ---
  warmup_completed?: boolean;
  warmup_previous_answer?: {
    selected_option_index: number;
    is_correct: boolean;
    correct_option_index: number;
    explanation: string | null;
  } | null;
  // -----------------------------
}

export interface QuizQuestionsResponse {
  questions: SafeQuizQuestion[];
}

export interface QuizAnswerResponse {
  correct: boolean;
  correct_option_index: number;
  explanation: string | null;
}

export interface QuizResultResponse {
  total_questions: number;
  answered: number;
  correct: number;
  score_percentage: number;
}