export interface Skill {
  name: string;
  level: number; // 1-100
  proficiency?: 'Expert' | 'Intermediate' | 'Beginner';
  category: string;
  yearsOfExperience?: number;
  endorsements?: number;
  since?: number;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface SkillData {
  categories: SkillCategory[];
}

