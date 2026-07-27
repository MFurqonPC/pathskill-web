export interface LearningPathModuleSummary {
  id: number;
  title: string;
  total_lessons: number;
  total_assignments: number;
  ai_generated: boolean;
  status: "not_started" | "in_progress" | "completed";
  percentage: number;
}

export interface LearningPathResponse {
  overall_progress: {
    completed_modules: number;
    total_modules: number;
  };
  total_lessons: number;
  total_assignments: number;
  estimated_duration_weeks: number;
  modules: LearningPathModuleSummary[];
}

export interface ModuleLesson {
  id: number;
  title: string;
  type: "video" | "reading" | "quiz";
  duration_minutes: number;
  explanation: string | null;
  example: string | null;
  function_context: string | null;
  completed: boolean;
}

export interface ModuleAssignment {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pending" | "submitted" | "successful";
  file_name: string | null;
  file_url: string | null;
}

export interface ModuleDetailResponse {
  id: number;
  title: string;
  description: string | null;
  progress_percentage: number;
  lessons: ModuleLesson[];
  assignments: ModuleAssignment[];
  // Baru: 3-5 objective, di-generate sekali via GroqService::generateLearningObjectives()
  // dan disimpan di kolom modules.learning_objectives — bukan personalisasi per user.
  // Optional karena modul lama yang belum di-backfill belum punya nilai ini.
  learning_objectives?: string[];
}