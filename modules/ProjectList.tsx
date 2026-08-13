import React, { useState } from 'react';
import { MoreVertical, Pencil, Check, X, Building2 } from 'lucide-react';
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
  onRename,
}: ProjectListProps) {
  const [menuId, setMenuId] = useState<string>('');
  const [editingId, setEditingId] = useState<string>('');
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const startRename = (project: Project) => {
    setMenuId('');
    setEditingId(project.project_id);
    setDraft(project.name);
  };

  const cancelRename = () => {
    setEditingId('');
    setDraft('');
  };

  const commitRename = async (project: Project) => {
    const name = draft.trim();
    if (!name || saving) return;
    if (name === project.name) return cancelRename();

    setSaving(true);
    // error surfaces as a toast from the parent; keep edit mode open on failure
    const error = await onRename(project, name);
    setSaving(false);
    if (!error) cancelRename();
  };

  const renderRow = (project: Project) => {
    const isActive = project.project_id === activeProjectId;
    const isEditing = project.project_id === editingId;
    const isMenuOpen = project.project_id === menuId;

    return (
      <div
        key={project.project_id}
        onClick={() => !isEditing && onSelect(project)}
        className={`relative mb-2 flex items-center gap-3 rounded-[10px] border p-3 ${
          isEditing ? 'cursor-default' : 'cursor-pointer'
        } ${
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
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              maxLength={120}
              disabled={saving}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(project);
                if (e.key === 'Escape') cancelRename();
              }}
              className="w-full rounded border border-blue-500 px-2 py-1 text-sm font-semibold text-gray-900 outline-none disabled:opacity-60"
            />
          ) : (
            <div className="truncate text-sm font-semibold text-gray-900">
              {project.name}
            </div>
          )}
          <div className="mt-0.5 text-xs text-gray-500">
            {project.document_count}{' '}
            {project.document_count === 1 ? 'document' : 'documents'}
          </div>
          <div className="text-[11px] text-gray-500">
            Last updated {formatRelativeTime(project.last_interaction_at)}
          </div>
        </div>

        {isEditing ? (
          <div className="flex shrink-0 items-center gap-1 self-start">
            <button
              aria-label="Save name"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation();
                commitRename(project);
              }}
              className="rounded-full p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <Check size={18} />
            </button>
            <button
              aria-label="Cancel rename"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation();
                cancelRename();
              }}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            aria-label="Project actions"
            onClick={(e) => {
              e.stopPropagation();
              setMenuId((id) =>
                id === project.project_id ? '' : project.project_id,
              );
            }}
            className={`shrink-0 rounded-full p-1 hover:bg-gray-100 ${
              isActive ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <MoreVertical size={18} />
          </button>
        )}

        {isMenuOpen && (
          <>
            {/* click-catcher to close the menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setMenuId('');
              }}
            />
            <div className="absolute right-3 top-11 z-20 min-w-[140px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-blue-600 hover:bg-gray-50"
              >
                <Pencil size={15} />
                Rename
              </button>
            </div>
          </>
        )}
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
