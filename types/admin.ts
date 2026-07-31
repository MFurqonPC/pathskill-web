export interface AdminUserResult {
  id: number;
  name: string;
  email: string;
  plan: "free" | "pro" | "career_mentor";
  plan_expires_at: string | null;
}