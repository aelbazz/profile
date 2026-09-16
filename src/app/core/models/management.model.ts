export interface ManagementResponsibility {
  id: string;
  /** The API models all three. Existing data uses 'high' and 'medium'. */
  level: 'high' | 'medium' | 'low';
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  teamSize?: number;
  description: string;
  keyResponsibilities: string[];
  achievements: string[];
}

export interface ManagementData {
  responsibilities: ManagementResponsibility[];
}

