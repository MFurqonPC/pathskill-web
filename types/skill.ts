export type SkillCategory = "core" | "tools" | "soft_skills";

export interface Career {
  id: number;
  name: string;
  icon: string;
  description?: string;
}

export interface SkillItem {
  id: number;
  skill_name: string;
  industry_requirement: number;
  current_rating: number | null; // null = "Not rated"
}

export interface SkillAssessmentResponse {
  career: Career;
  skills: {
    core: SkillItem[];
    tools: SkillItem[];
    soft_skills: SkillItem[];
  };
}

export interface SkillMapChartItem {
  skill_name: string;
  current: number | null;
  required: number;
  is_rated: boolean;
  is_confidence_validated: boolean;
  is_quiz_validated: boolean;
}

export interface SkillRecommendation {
  foundation_summary: string;
  priority_areas: string;
  priority_skill_names: string[];
  estimated_weeks: number;
}

export interface SkillMapResponse {
  career: Career;
  summary: {
    current_level: number;
    required_level: number;
    skill_gap: number;
    breakdown: {
      self_rating: number;
      scenario_confidence: number | null;
      quiz_score_percentage: number | null;
    };
  };
  chart_data: SkillMapChartItem[];
  recommendation: SkillRecommendation | null;
}