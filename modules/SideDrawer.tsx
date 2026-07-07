import React, { useContext, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/router';
import ThemeContext from "@/contexts/ThemeContext";
import { useTainPDF } from "@/hooks/useTrainPDF";
import UploadIcon from '@/assets/svgs/UploadIcon';
import FileTextIcon from '@/assets/svgs/FileTextIcon';
import Spinner from '@/components/ui/Spinner';
import { ToastContainer } from 'react-toastify';
import { MoreVertical } from 'lucide-react';
import { SideDrawerProps, UploadDropZoneProps, UploadFileCardProps, UploadsSectionProps, TrainedDocumentsProps, DemoDocsSectionProps } from '@/types/sideDrawer';
import { formatBytes } from '@/utils/formatBytes';
import { FILE_TYPE_GLYPH, DEFAULT_FILE_GLYPH, fileTypeKey } from '@/utils/fileType';
import { FileText, ChevronRight, Wand2, FolderOpen } from 'lucide-react';

const UploadDropZone: React.FC<UploadDropZoneProps> = ({
    styles, dragOver, setDragOver, handleFileDrop, handleFileChange, fileInputRef
}) => {
    const { JSModule } = useContext(ThemeContext);
    return (
    <div className={styles?.['UploadContainer']}>
        <label
            className={`${styles?.['dropZone']} ${dragOver ? styles?.['dropZoneActive'] : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.length) handleFileDrop(e.dataTransfer.files);
            }}
        >
            <input
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
            />
            <div className={styles?.['dropZoneIcon']}>
                <UploadIcon size={20} stroke="#3b82f6" />
            </div>
            <div className={styles?.['dropZoneTitle']}>{JSModule?.uploadDropTitle ?? 'Upload or drag & drop'}</div>
            <div className={styles?.['dropZoneHint']}>PDF, DOCX, TXT (Max 50MB)</div>
        </label>
    </div>
    );
};

const UploadFileCard: React.FC<UploadFileCardProps> = ({
    styles, file, canCancel, cancelUpload, retryUpload, removeUpload
}) => {
    const isDone = file.phase === 'done';
    const isError = file.phase === 'error' || file.phase === 'cancelled';
    const isProcessing = file.phase === 'processing';
    const isCancelling = file.phase === 'cancelling'
    const statusLabel = isDone ? 'Upload complete'
        : isError ? (file.error || 'Failed to upload')
        : isProcessing ? (file.stage || 'Processing...')
        : isCancelling ? 'Cancelling...'
        : 'Uploading...';

    return (
        <div className={styles?.['fileCard']}>
            <div className={styles?.['fileCardTop']}>
                <div className={styles?.['fileIcon']}>
                    <FileTextIcon size={22} stroke={isError ? '#ef4444' : isDone ? '#10b981' : '#6b7280'} />
                </div>
                <div className={styles?.['fileMeta']}>
                    <div className={styles?.['fileName']}>{file.name}</div>
                    <div className={styles?.['fileSub']}>
                        {formatBytes(file.size)}{file.type ? ` • ${file.type}` : ''}
                    </div>
                </div>
                <div className={styles?.['fileStatusRight']}>
                    {isDone ? (
                        <span className={styles?.['fileDoneLabel']}>✓ Done</span>
                    ) : isError ? (
                        <span className={styles?.['fileErrorIcon']}>!</span>
                    ) : (
                        <>
                            <span className={styles?.['filePercent']}>{file.progress}%</span>
                            {(canCancel(file.jobId) && file.phase !== "cancelling") && (
                                <button className={styles?.['fileCancelX']} onClick={() => cancelUpload(file.jobId)}>✕</button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={styles?.['fileProgressBg']}>
                <div
                    className={`${styles?.['fileProgressFill']} ${
                        isError ? styles?.['fileProgressError']
                        : isDone ? styles?.['fileProgressDone']
                        : isProcessing ? styles?.['fileProgressProcessing']
                        : isCancelling ? styles?.['fileProgressCancelling']
                        : ''
                    }`}
                    style={{ width: isError ? '100%' : `${file.progress}%` }}
                />
            </div>

            {isError ? (
                <div className={styles?.['fileErrorActions']}>
                    {/* <button className={styles?.['fileRetryBtn']} onClick={() => retryUpload(file.name)}>↻ Retry</button> */}
                    {
                        file.jobId && (
                            <button className={styles?.['fileRemoveBtn']} onClick={() => removeUpload(file.jobId)}>🗑 Remove</button>
                        )
                    }
                </div>
            ) : (
                <div className={`${styles?.['fileStatusLabel']} ${
                    isDone ? styles?.['fileStatusDone']
                    : isProcessing ? styles?.['fileStatusProcessing']
                    : isCancelling ? styles?.['fileStatusCancelling']
                    : styles?.['fileStatusUploading']
                }`}>
                    {!isDone && <Spinner size={12} />}
                    {statusLabel.toUpperCase()}
                </div>
            )}

            {!isDone && !isError && !canCancel(file.jobId) && file.progress >= 90 && (
                <div className={styles?.['cancelHint']}>Cancel will be disabled soon ⓘ</div>
            )}
        </div>
    );
};

const UploadsSection: React.FC<UploadsSectionProps> = ({
    styles, uploads, canCancel, cancelUpload, retryUpload, removeUpload
}) => {
    const activeUploads = uploads.filter(f => f.phase !== 'done');
    if (activeUploads.length === 0) return null;

    return (
        <div className={styles?.['uploadsSection']}>
            <div className={styles?.['uploadsHeader']}>Uploads ({activeUploads.length})</div>
            {activeUploads.map((file) => (
                <UploadFileCard
                    key={file.jobId}
                    styles={styles}
                    file={file}
                    canCancel={canCancel}
                    cancelUpload={cancelUpload}
                    retryUpload={retryUpload}
                    removeUpload={removeUpload}
                />
            ))}
        </div>
    );
};

const TrainedDocuments: React.FC<TrainedDocumentsProps> = ({ styles, documentList, loading, removeSessionDocument, switchTab }) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const { JSModule } = useContext(ThemeContext);
    return (
        <>
            <div className={styles?.['Divider']} />
            <div className={styles?.['UploaderHeader']}>Trained Documents ({documentList.length})</div>
            <div className={styles?.['DataContainer']}>
                {loading && documentList.length === 0 && (
                    <div className={styles?.['fileStatusLabel']}>Loading documents...</div>
                )}
                {!loading && documentList.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '28px 16px', border: '1px solid #f0f1f3', borderRadius: '12px', background: '#fcfcfd' }}>
                        <div style={{ color: '#cbd5e1', marginBottom: '8px' }}>
                            <FolderOpen size={40} strokeWidth={1.6} aria-hidden="true" />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6b7280' }}>{JSModule?.trainedEmptyTitle ?? 'No documents yet'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>{JSModule?.trainedEmptySubtitle ?? 'Upload a document to get started.'}</div>
                    </div>
                )}
                {documentList.map((document) => (
                    <div key={document.jobId} className={styles?.['fileCard']}>
                        <div className={styles?.['fileCardTop']}>
                            <div className={styles?.['fileIcon']}>
                                <FileTextIcon size={22} stroke="#10b981" />
                            </div>
                            <div className={styles?.['fileMeta']}>
                                <div className={styles?.['fileName']}>{document.fileName || document.jobId}</div>
                                <div className={styles?.['fileSub']}>
                                    {formatBytes(document.fileSize || 0)}{document.fileSize ? ' • ' : ''}Done
                                </div>
                            </div>
                            <div style={{ position: 'relative', marginLeft: '8px' }}>
                                <button
                                    onClick={() => setOpenMenu(openMenu === document.jobId ? null : document.jobId)}
                                    disabled={document.removing}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                                >
                                    {document.removing ? '...' : <MoreVertical size={18} />}
                                </button>

                                {openMenu === document.jobId && (
                                    <div
                                        style={{
                                            position: 'absolute', right: 0, top: '100%', background: '#fff',
                                            border: '1px solid #ddd', borderRadius: '6px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '140px',
                                        }}
                                    >
                                        {document.graphId && (
                                            <button
                                                style={{
                                                    width: '100%', padding: '8px 12px', textAlign: 'left',
                                                    border: 'none', background: 'transparent', cursor: 'pointer',
                                                }}
                                                onClick={() => {
                                                    switchTab('documentTree', document.graphId);
                                                    setOpenMenu(null);
                                                }}
                                            >
                                                View Tree
                                            </button>
                                        )}
                                        <button
                                            style={{
                                                width: '100%', padding: '8px 12px', textAlign: 'left',
                                                border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444',
                                            }}
                                            onClick={() => {
                                                removeSessionDocument(document.jobId);
                                                setOpenMenu(null);
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

// --- Demo (preloaded sample) documents — reuses the drawer's fileCard pattern ---
const DemoFileIcon: React.FC<{ type: string }> = ({ type }) => {
    const { color } = FILE_TYPE_GLYPH[type] || DEFAULT_FILE_GLYPH;
    return <FileText size={26} color={color} strokeWidth={1.75} aria-hidden="true" />;
};

const DemoDocsSection: React.FC<DemoDocsSectionProps> = ({ styles, namespace }) => {
    const { JSModule } = useContext(ThemeContext);
    const themeColor: string = JSModule?.themeColor || '#3b82f6';
    const tryText: string = JSModule?.demoTryButtonText ?? 'Try with a demo document';
    const sectionLabel: string = JSModule?.demoSectionLabel ?? 'Demo documents';
    const orText: string = JSModule?.demoOrText ?? 'or';

    if (!namespace.demoActivated) {
        return (
            <div style={{ padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, color: '#9ca3af', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    {orText}
                    <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>
                <button
                    type="button"
                    onClick={namespace.activateDemo}
                    style={{ width: '100%', marginTop: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${themeColor}`, background: '#fff', color: themeColor, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                    <Wand2 size={16} aria-hidden="true" />
                    {tryText}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={styles?.['Divider']} />
            <div className={styles?.['UploaderHeader']}>{sectionLabel}</div>
            <div className={styles?.['DataContainer']}>
                {namespace.publicDocs.map((doc) => {
                    const type = fileTypeKey(doc);
                    const active = doc.id === namespace.activeDocId;
                    const select = () => namespace.setActiveDoc(doc.id);
                    return (
                        <div
                            key={doc.id}
                            className={styles?.['fileCard']}
                            role="button"
                            tabIndex={0}
                            title={doc.description || undefined}
                            onClick={select}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } }}
                            style={{ cursor: 'pointer', borderColor: active ? themeColor : undefined, boxShadow: active ? `0 0 0 1px ${themeColor} inset` : undefined }}
                        >
                            <div className={styles?.['fileCardTop']}>
                                <div className={styles?.['fileIcon']}>
                                    <DemoFileIcon type={type} />
                                </div>
                                <div className={styles?.['fileMeta']}>
                                    <div className={styles?.['fileName']}>{doc.title || 'Untitled document'}</div>
                                    {doc.pageCount ? <div className={styles?.['fileSub']}>{doc.pageCount} pages</div> : null}
                                </div>
                                <ChevronRight size={18} color={active ? themeColor : '#9ca3af'} aria-hidden="true" style={{ flexShrink: 0 }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export const SidePanel: React.FC<SideDrawerProps> = ({ open, setOpen, namespace, switchTab }) => {
    const { JSModule, styles } = useContext(ThemeContext);
    const {
        uploads, handleFileChange, handleFileDrop, cancelUpload, retryUpload, removeUpload, canCancel,
        documentList, loadingSessionDocuments, removeSessionDocument
    } = useTainPDF();
    const router = useRouter();
    const { 'chat-id': chatId } = router.query;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [drawerWidth, setDrawerWidth] = useState(320);
    const [dragOver, setDragOver] = useState(false);
    const isResizing = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = drawerWidth;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const diff = startX - e.clientX;
            const newWidth = Math.min(Math.max(startWidth + diff, 250), 600);
            setDrawerWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [drawerWidth]);

    if (!JSModule?.drawerEnabled || !open) return null;

    return (
        <div className={styles?.['HamburgerContainer']} style={{ width: drawerWidth, minWidth: 250, maxWidth: 600 }}>
            <div className={styles?.['drawerResizeHandle']} onMouseDown={handleMouseDown} />

            <div className={styles?.['HamburgerHeaderContainer']}>
                <div className={styles?.['HamburgerHeaderTop']}>
                    <div className={styles?.['HamburgerHeader']}>Documents</div>
                    <div className={styles?.['drawerCloseBtn']} onClick={() => setOpen(false)}>✕</div>
                </div>
                <p className={styles?.['drawerSubtitle']}>Upload documents and ask questions based on their content.</p>
            </div>

            <UploadDropZone
                styles={styles}
                dragOver={dragOver}
                setDragOver={setDragOver}
                handleFileDrop={handleFileDrop}
                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
            />

            {/* Demo path —  hidden once the user has any private doc */}
            {namespace?.mode === 'public' && namespace.publicDocs.length > 0 && uploads.length === 0 && documentList.length === 0 && (
                <DemoDocsSection styles={styles} namespace={namespace} />
            )}

            <UploadsSection
                styles={styles}
                uploads={uploads}
                canCancel={canCancel}
                cancelUpload={cancelUpload}
                retryUpload={retryUpload}
                removeUpload={removeUpload}
            />

            <TrainedDocuments
                styles={styles}
                documentList={documentList}
                loading={loadingSessionDocuments}
                removeSessionDocument={removeSessionDocument}
                switchTab={switchTab}
            />
            <ToastContainer />
        </div>
    );
};
