export interface DashboardResponse {
  user: {
    name: string;
    email: string;
    education_background: string | null;
    career_goal: string | null;
  };
  summary: {
    overall_progress: number;
    completed_modules: number;
    total_modules: number;
    pending_assignments: number;
    weeks_remaining: number;
  };
  active_learning_path: {
    locked: boolean;
    modules_completed: number;
    total_modules: number;
    progress_percentage: number;
    modules: {
      id: number;
      title: string;
      total_lessons: number;
      total_assignments: number;
      ai_generated: boolean;
    }[];
  };
  assignments_to_complete: {
    id: number;
    module_id: number;
    title: string;
    module_title: string;
    due_date: string | null;
    status: "pending" | "submitted" | "successful";
  }[];
}
