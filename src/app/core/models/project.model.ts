export interface Project {
  id: string;
  name: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string | null;
  technologies: string[];
  highlights: string[];
  imageUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
}

export interface ProjectData {
  projects: Project[];
}

