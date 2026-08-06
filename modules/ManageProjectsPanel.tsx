import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
ArrowLeftRight,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  ImagePlus,
  Building2,
} from 'lucide-react';
import { CustomModal, Drawer } from '@/components/ui';
import {
  createProject,
  fetchProjectLogoObjectUrl,
  listProjectTree,
} from '@/apiRequests/ttt';
import {getActiveProjectId,setActiveProjectId as persistActiveProjectId} from '@/utils/sessionJobs';
import { formatRelativeTime } from '@/utils/formatBytes';
import {
  ManageProjectsButtonProps,
  ManageProjectsDrawerProps,
  Project,
} from '@/types/project';

// POST /v1/projects carries the logo inline as a base64 data URI, so keep the
// source file small enough to survive ~33% base64 inflation.
const MAX_LOGO_BYTES = 1_000_000;

const EMPTY_STATE = 'px-4 py-5 text-center text-[13px] text-gray-500';
const CTA_BUTTON ='flex w-full items-center gap-2.5 px-1 py-3 text-[15px] font-semibold text-blue-600 hover:text-blue-700';
const FIELD = 'w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] outline-none focus:border-blue-500';

const readAsDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected image'));
    reader.readAsDataURL(file);
  });

export const ManageProjectsButton: React.FC<ManageProjectsButtonProps> = ({
  open,
  onToggle,
}) => (
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

// Kept for the page's lifetime: the rows unmount every time the drawer closes,
// and there is no endpoint to change a logo, so a fetched one stays valid.
const logoCache = new Map<string, string>();

const ProjectLogo: React.FC<{ project: Project }> = ({ project }) => {
  const [logoUrl, setLogoUrl] = useState(
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
};

export const ManageProjectsDrawer: React.FC<ManageProjectsDrawerProps> = ({
  open,
  onClose,
  reloadToken,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeProjectId, setActiveProjectId] = useState('');
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [name, setName] = useState('');
  const [logoDataUri, setLogoDataUri] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadTree = useCallback(async () => {
    setLoading(true);
    const data = await listProjectTree();
    setLoading(false);
    if (!data) {
      setLoadError('Could not load projects. Please try again.');
      return;
    }
    setLoadError('');
    setProjects(data.projects || []);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadTree();
  }, [open, reloadToken, loadTree]);

  // sessionStorage still scopes uploads after a reload, so mirror it back into
  // the highlight — otherwise nothing looks selected while uploads keep
  // landing in that project. Effect, not lazy init: no sessionStorage on SSR.
  useEffect(() => {
    setActiveProjectId(getActiveProjectId());
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
        result.status === 409
          ? 'A project with that name already exists.'
          : result.message,
      );
      return;
    }

    setCreating(false);
    handleSelect(result.project);
    await loadTree();
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
    if (loadError) {
      return <div className={`${EMPTY_STATE} text-red-600`}>{loadError}</div>;
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
        <div className="mx-0.5 mb-2 mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">
          Recent projects
        </div>
        {projects.map(renderProjectRow)}
      </>
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        footer={
          <button onClick={openCreateModal} className={CTA_BUTTON}>
            <Plus size={18} />
            New Project
          </button>
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
