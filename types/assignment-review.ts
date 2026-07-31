export interface AssignmentReviewResponse {
  assignment: {
    id: number;
    title: string;
    skills: { id: number; name: string }[];
  };
  progress: {
    status: string;
    file_name: string | null;
    file_path: string | null;
    submitted_at: string | null;
  };
  review: {
    mentor_score: number;
    mentor_feedback: string | null;
    reviewed_at: string;
    reviewed_by: { id: number; name: string } | null;
  } | null;
}