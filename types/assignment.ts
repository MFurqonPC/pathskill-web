export interface EvaluationRubric {
  criteria: string;
  weight: number; // persentase, contoh: 20 untuk "20%"
}

export interface AssignmentDetailResponse {
  id: number;
  learning_module_id: number;
  module_title: string;
  title: string;
  description: string | null;
  due_date: string | null;
  learning_outcomes: string[];
  skills_learned: string[];
  prerequisites: string[];
  tools: string[];
  evaluation_rubrics: EvaluationRubric[];
  has_quiz: boolean;
  has_coding_exercise: boolean;
  coding_exercise_completed: boolean;
  has_mini_project: boolean;
  quiz_completed: boolean;
  status: "pending" | "submitted" | "successful";
  file_name: string | null;
  file_url: string | null;
}