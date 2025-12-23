export interface Skill {
  name: string;
  level: number; // 1-9 (1-3: Beginner, 4-6: Intermediate, 7-9: Expert)
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

