export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Project {
  id: string;
  teamId: string;
  categoryId?: string;
  category?: CategoryInfo;
  projectName: string;
  brandName?: string;
  productName?: string;
  industry?: string;
  description?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  taskCount?: number;
}

export interface ProjectCreateInput {
  teamId: string;
  categoryId?: string;
  projectName: string;
  brandName?: string;
  productName?: string;
  industry?: string;
  description?: string;
}
