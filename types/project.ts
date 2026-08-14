export interface Project {
  project_id: string;
  name: string;
  logo_url?: string | null;
  document_count: number;
  last_interaction_at?: string | null;
}

export interface ManageProjectsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Bump to force a reload — e.g. after an upload completes. */
  reloadToken?: number;
}

export interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  activeProjectId: string;
  showAll: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadError: string;
  onSelect: (project: Project) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onRename: (project: Project, name: string) => Promise<string | null>;
}
