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
  current: number;
  required: number;
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
}