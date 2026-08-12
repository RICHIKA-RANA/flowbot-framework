import React from 'react';
import { ChevronRight, Building2 } from 'lucide-react';
import { Loader } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { fetchProjectLogoObjectUrl } from '@/apiRequests/ttt';
import { formatRelativeTime } from '@/utils/formatBytes';
import { Project, ProjectListProps } from '@/types/project';

const RECENT_LIMIT = 3;
const EMPTY_STATE = 'px-4 py-5 text-center text-[13px] text-gray-500';

export function ProjectList({
  projects,
  loading,
  activeProjectId,
  showAll,
  hasMore,
  loadingMore,
  loadError,
  onSelect,
  onRetry,
  onLoadMore,
}: ProjectListProps) {
  const renderRow = (project: Project) => {
    const isActive = project.project_id === activeProjectId;
    return (
      <div
        key={project.project_id}
        onClick={() => onSelect(project)}
        className={`mb-2 flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 ${
          isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <Avatar
          id={project.project_id}
          hasImage={!!project.logo_url}
          fetchImage={fetchProjectLogoObjectUrl}
          fallback={<Building2 size={18} />}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">
            {project.name}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {project.document_count}{' '}
            {project.document_count === 1 ? 'document' : 'documents'}
          </div>
          <div className="text-[11px] text-gray-500">
            Last updated {formatRelativeTime(project.last_interaction_at)}
          </div>
        </div>
        <ChevronRight
          size={18}
          className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}
        />
      </div>
    );
  };

  if (loading && !projects.length) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-20 w-20">
          <Loader />
        </div>
      </div>
    );
  }
  // with a list on screen the banner below is used instead
  if (loadError && !projects.length) {
    return (
      <div className={`${EMPTY_STATE} text-red-600`}>
        {loadError}
        <button
          onClick={onRetry}
          className="mt-2 block w-full font-semibold text-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!projects.length) {
    return (
      <div className={EMPTY_STATE}>
        No projects yet. Create your first one below.
      </div>
    );
  }

  return (
    <>
      {loadError && (
        <div className="mx-0.5 mb-2 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-[12px] text-red-600">
          {loadError}
          <button
            onClick={onRetry}
            className="shrink-0 font-semibold text-blue-600"
          >
            Retry
          </button>
        </div>
      )}
      <div className="mx-0.5 mb-2 mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
        {showAll
          ? `All projects (${projects.length}${hasMore ? '+' : ''})`
          : 'Recent projects'}
      </div>
      {(showAll ? projects : projects.slice(0, RECENT_LIMIT)).map(renderRow)}
      {showAll && hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mx-0.5 mt-1 w-full rounded-lg py-2 text-[13px] font-semibold text-blue-600 hover:bg-gray-50 disabled:text-gray-400"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
      <div className="-mx-3 mt-1 border-t border-gray-200" />
    </>
  );
}
