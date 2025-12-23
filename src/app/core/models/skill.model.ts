export interface Skill {
  name: string;
  level: number; // 1-100
  category: string;
  yearsOfExperience?: number;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface SkillData {
  categories: SkillCategory[];
}

