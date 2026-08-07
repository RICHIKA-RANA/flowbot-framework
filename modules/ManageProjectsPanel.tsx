import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  ImagePlus,
  Building2,
  Folder,
} from 'lucide-react';
import { CustomModal, Drawer } from '@/components/ui';
import {
  createProject,
  fetchProjectLogoObjectUrl,
  listProjectTree,
} from '@/apiRequests/ttt';
import {
  getActiveProjectId,
  setActiveProjectId as persistActiveProjectId,
  SESSION_CHANGED_EVENT,
} from '@/utils/sessionJobs';
import { formatRelativeTime } from '@/utils/formatBytes';
import {
  ManageProjectsButtonProps,
  ManageProjectsDrawerProps,
  Project,
} from '@/types/project';


const MAX_LOGO_BYTES = 1_000_000;
const RECENT_LIMIT = 3;
const PAGE_SIZE = 20;

const EMPTY_STATE = 'px-4 py-5 text-center text-[13px] text-gray-500';
const CTA_BUTTON ='flex w-full items-center gap-3 px-4 py-3 text-[15px] font-semibold text-blue-600 hover:bg-gray-50';
const CTA_DIVIDER = 'border-t border-gray-200';
const CTA_GROUP = '-m-[14px] flex flex-col';
const FIELD = 'w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] outline-none focus:border-blue-500';

// The service names project-level failures itself — "You already have a project
// named: x", "name is required", "logo must be a base64 data URI" — so show that
// verbatim instead of restating it here and drifting from it. `detail` arrives as
// a plain string or as { error_code, message }; anything else gets the fallback.
const projectErrorMessage = (detail: unknown, fallback: string): string => {
  if (typeof detail === 'string' && detail) return detail;
  const message = (detail as { message?: unknown })?.message;
  return typeof message === 'string' && message ? message : fallback;
};

const readAsDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected image'));
    reader.readAsDataURL(file);
  });

export function ManageProjectsButton({
  open,
  onToggle,
}: ManageProjectsButtonProps) {
  return (
  <button
    onClick={onToggle}
    aria-expanded={open}
    className={`flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 ${
      open ? 'border-blue-500' : 'border-gray-200'
    }`}
  >
    <ArrowLeftRight size={16} className="text-blue-500" />
    Manage Projects
    {open ? (
      <ChevronUp size={16} className="text-gray-500" />
    ) : (
      <ChevronDown size={16} className="text-gray-500" />
    )}
  </button>
  );
}
const logoCache = new Map<string, string>();

function ProjectLogo({ project }: { project: Project }) {
  const [logoUrl, setLogoUrl] = useState<string>(
    () => logoCache.get(project.project_id) || '',
  );

  useEffect(() => {
    if (!project.logo_url || logoCache.has(project.project_id)) return;
    let cancelled = false;

    fetchProjectLogoObjectUrl(project.project_id).then((url) => {
      if (!url) return;
      logoCache.set(project.project_id, url);
      if (!cancelled) setLogoUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [project.project_id, project.logo_url]);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-blue-50 text-blue-500">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      ) : (
        <Building2 size={18} />
      )}
    </div>
  );
}

export const ManageProjectsDrawer: React.FC<ManageProjectsDrawerProps> = ({
  open,
  onClose,
  reloadToken,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  // The page that failed, so Retry re-fetches it instead of restarting at 0 and
  // throwing away the pages already loaded.
  const [retryOffset, setRetryOffset] = useState<number>(0);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [logoDataUri, setLogoDataUri] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const requestRef = useRef<number>(0);

  const loadPage = useCallback(async (offset: number) => {
    const requestId = ++requestRef.current;
    const isFirstPage = offset === 0;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);

    const data = await listProjectTree(PAGE_SIZE, offset);
    if (requestId !== requestRef.current) return;
    setLoading(false);
    setLoadingMore(false);
    if (!data) {
      // Set for a failed "Load more" too — that used to fail silently.
      setLoadError('Could not load projects. Please try again.');
      setRetryOffset(offset);
      return;
    }

    const batch: Project[] = data.projects || [];
    setLoadError('');
    setProjects((prev) => {
      if (isFirstPage) return batch;
      const seen = new Set(prev.map((p) => p.project_id));
      return [...prev, ...batch.filter((p) => !seen.has(p.project_id))];
    });
    setHasMore(batch.length === PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadPage(0);
  }, [open, reloadToken, loadPage]);

  // sessionStorage still scopes uploads after a reload, so mirror it back into
  // the highlight — otherwise nothing looks selected while uploads keep
  // landing in that project. Effect, not lazy init: no sessionStorage on SSR.
  // Re-read on SESSION_CHANGED_EVENT too: New Chat clears the active project,
  // and the highlight would otherwise keep pointing at the cleared one.
  useEffect(() => {
    const syncActiveProject = () => setActiveProjectId(getActiveProjectId());
    syncActiveProject();
    window.addEventListener(SESSION_CHANGED_EVENT, syncActiveProject);
    return () =>
      window.removeEventListener(SESSION_CHANGED_EVENT, syncActiveProject);
  }, []);

  const handleSelect = (project: Project) => {
    setActiveProjectId(project.project_id);
    // persisted so every upload path files its document under this project
    persistActiveProjectId(project.project_id);
  };

  const openCreateModal = () => {
    setName('');
    setLogoDataUri('');
    setCreateError('');
    setCreating(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setCreating(false);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCreateError('Choose an image file');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setCreateError('Image must be under 1 MB');
      return;
    }

    try {
      setLogoDataUri(await readAsDataUri(file));
      setCreateError('');
    } catch {
      setCreateError('Could not read the selected image');
    }
  };

  const hasLogo = !!logoDataUri;
  const canSubmit = !!name.trim() && hasLogo && !submitting;

  const handleCreate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    const result = await createProject(name.trim(), logoDataUri);
    setSubmitting(false);

    if (!result.ok) {
      setCreateError(
        projectErrorMessage(
          result.detail,
          'Could not create the project. Please try again.',
        ),
      );
      return;
    }

    setCreating(false);
    handleSelect(result.project);
    await loadPage(0);
  };

  const renderProjectRow = (project: Project) => {
    const isActive = project.project_id === activeProjectId;
    return (
      <div
        key={project.project_id}
        onClick={() => handleSelect(project)}
        className={`mb-2 flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 ${
          isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <ProjectLogo project={project} />
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

  const renderBody = () => {
    if (loading && !projects.length) {
      return <div className={EMPTY_STATE}>Loading projects…</div>;
    }
    // Only take over the panel when there is nothing else to show. A refresh
    // that fails while a good list is on screen gets the banner below instead,
    // so we never replace real projects with an error.
    if (loadError && !projects.length) {
      return (
        <div className={`${EMPTY_STATE} text-red-600`}>
          {loadError}
          <button
            onClick={() => loadPage(retryOffset)}
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
              onClick={() => loadPage(retryOffset)}
              className="shrink-0 font-semibold text-blue-600"
            >
              Retry
            </button>
          </div>
        )}
        <div className="mx-0.5 mb-2 mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
          {showAll
            ?
              `All projects (${projects.length}${hasMore ? '+' : ''})`
            : 'Recent projects'}
        </div>
        {(showAll ? projects : projects.slice(0, RECENT_LIMIT)).map(
          renderProjectRow,
        )}
        {showAll && hasMore && (
          <button
            onClick={() => loadPage(projects.length)}
            disabled={loadingMore}
            className="mx-0.5 mt-1 w-full rounded-lg py-2 text-[13px] font-semibold text-blue-600 hover:bg-gray-50 disabled:text-gray-400"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        )}
        <div className="-mx-3 mt-1 border-t border-gray-200" />
      </>
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        footer={
          <div className={CTA_GROUP}>
            <button onClick={openCreateModal} className={CTA_BUTTON}>
              <Plus size={18} />
              New Project
            </button>
            <div className={CTA_DIVIDER} />
            <button
              onClick={() => setShowAll((v) => !v)}
              className={CTA_BUTTON}
            >
              {showAll ? (
                <>
                  <ArrowLeft size={18} />
                  Back
                </>
              ) : (
                <>
                  <Folder size={18} />
                  View All Projects
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        }
      >
        {renderBody()}
      </Drawer>

      <CustomModal
        title="New Project"
        status={creating}
        onClose={closeCreateModal}
        showOptionsButton={false}
      >
        <div className="flex w-80 max-w-[80vw] flex-col gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') closeCreateModal();
            }}
            placeholder="Project name"
            className={FIELD}
          />

          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className={`${FIELD} flex items-center gap-2 text-left ${
              hasLogo ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {hasLogo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoDataUri}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded object-cover"
                />
                Logo selected — change
              </>
            ) : (
              <>
                <ImagePlus size={16} className="text-blue-500" />
                Choose a logo (required)
              </>
            )}
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />

          {createError && (
            <div className="text-xs text-red-600">{createError}</div>
          )}

          <div className="flex gap-1.5">
            <button
              onClick={handleCreate}
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={closeCreateModal}
              disabled={submitting}
              className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-semibold text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </CustomModal>
    </>
  );
};
