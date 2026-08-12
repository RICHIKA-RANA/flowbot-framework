import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  ImagePlus,
  Building2,
  Folder,
} from 'lucide-react';
import { CustomModal, Drawer } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar/Avatar';
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
import { formatRelativeTime, generateDefaultLogo } from '@/utils/formatBytes';
import { ManageProjectsDrawerProps, Project } from '@/types/project';


const MAX_LOGO_BYTES = 1_000_000;
const RECENT_LIMIT = 3;
const PAGE_SIZE = 20;

const EMPTY_STATE = 'px-4 py-5 text-center text-[13px] text-gray-500';
const CTA_BUTTON ='flex w-full items-center gap-3 px-4 py-3 text-[15px] font-semibold text-blue-600 hover:bg-gray-50';
const CTA_DIVIDER = 'border-t border-gray-200';
const CTA_GROUP = '-m-[14px] flex flex-col';
const FIELD = 'w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] outline-none focus:border-blue-500';

// `detail` is either a string or { error_code, message }
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
  const [retryOffset, setRetryOffset] = useState<number>(0);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [logoDataUri, setLogoDataUri] = useState<string>('');
  const [useDefaultLogo, setUseDefaultLogo] = useState<boolean>(false);
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

  // mirror sessionStorage into the highlight; New Chat clears it
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
    setUseDefaultLogo(false);
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
      setUseDefaultLogo(false);
      setCreateError('');
    } catch {
      setCreateError('Could not read the selected image');
    }
  };

  // recomputed so editing the name updates the initials
  const defaultLogo = useMemo(
    () => (useDefaultLogo ? generateDefaultLogo(name) : ''),
    [useDefaultLogo, name],
  );
  const logoToSend = logoDataUri || defaultLogo;

  const hasLogo = !!logoToSend;
  const canSubmit = !!name.trim() && hasLogo && !submitting;

  const handleCreate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    const result = await createProject(name.trim(), logoToSend);
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

  const renderBody = () => {
    if (loading && !projects.length) {
      return <div className={EMPTY_STATE}>Loading projects…</div>;
    }
    // with a list on screen the banner below is used instead
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
                  src={logoToSend}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded object-cover"
                />
                {defaultLogo
                  ? 'Default logo - or choose your own'
                  : 'Logo selected - change'}
              </>
            ) : (
              <>
                <ImagePlus size={16} className="text-blue-500" />
                Choose a logo
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

          <label
            className={`flex select-none items-center gap-2 self-start text-[12px] ${
              name.trim()
                ? 'cursor-pointer text-gray-600'
                : 'cursor-not-allowed text-gray-400'
            }`}
          >
            <input
              type="checkbox"
              checked={useDefaultLogo}
              disabled={!name.trim()}
              onChange={(e) => {
                setUseDefaultLogo(e.target.checked);
                if (e.target.checked) setLogoDataUri('');
              }}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            Use default logo from the project name
          </label>

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
