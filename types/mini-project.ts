export interface MiniProjectResponse {
  id: number;
  assignment_id: number;
  title: string;
  brief: string | null;
  objectives: string[];
  acceptance_criteria: string[];
  deliverables: string[];
}
