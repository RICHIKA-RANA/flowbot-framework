import { useContext, useEffect, useState, useRef } from 'react';
import { uploadDocument, getJobProgress, cancelDocumentProcessing, listSessionDocuments, removeDocument } from '@/apiRequests/ttt';
import ThemeContext from '@/contexts/ThemeContext';
import { useRouter } from 'next/router';
import { usePolling } from '@/hooks/usePolling';
import { FileUploadStatus, SessionDocument } from '@/types/fileUploadStatus';
import { getJobSessionId, notifyGraphIdsChanged } from '@/utils/sessionJobs';
import { toast } from 'react-toastify';

const pollProgress = async (
    uploads: FileUploadStatus[],
    cancelledRef: React.MutableRefObject<Set<string>>
): Promise<FileUploadStatus[]> => {
    return Promise.all(
        uploads.map(async (f) => {
            if (f.phase === 'done' || f.phase === 'cancelled' || f.phase === 'error' || !f.jobId || cancelledRef.current.has(f.jobId)) {
                return f;
            }

            try {
                const response = await getJobProgress(f?.jobId);
                const progressPercentage = response?.progress ?? f.progress ?? 0;

                const currentState = response?.state
                if (currentState == "CANCELLED") {
                    cancelledRef.current.add(f.jobId);
                    return {
                        ...f,
                        phase: "cancelled",
                        error: 'Upload cancelled',
                        progress: 0
                    };
                } else if (currentState == "FAILED" || currentState == "COMPLETED") {
                    return {
                        ...f,
                        graphId: response?.result_graph_id,
                        phase: currentState == "FAILED"? "error": "done",
                        progress: progressPercentage
                    };
                }

                // still in progress: update percentage and surface the backend stage label
                return {
                    ...f,
                    phase: currentState === "CANCELLING"? "cancelling": "processing",
                    progress: progressPercentage,
                    stage: response?.stage
                };
            } catch (error: any) {
                console.error(`something went wrong in polling progress`, {
                    message: error?.message,
                    status: error?.response?.status,
                    responseData: error?.response?.data
                });

                return {
                    ...f,
                    phase: 'error',
                    error: 'Failed to fetch status',
                };
            }
        })
    );
};

const toCompletedDocs = (data: any[]): SessionDocument[] =>
    data
        .filter((raw: any) => raw?.state === 'COMPLETED')
        .map((raw: any) => ({
            jobId: raw?.job_id, fileName: raw?.file_name,
            fileSize: raw?.file_size, graphId: raw?.result_graph_id,
        }));

export const useTainPDF = () => {
    const router = useRouter();
    const { JSModule } = useContext(ThemeContext);
    const [trainingInProgress, setTrainingInProgress] = useState(false);
    const [uploads, setUploads] = useState<FileUploadStatus[]>([]);
    const cancelledRef = useRef<Set<string>>(new Set());
    const uploadsRef = useRef<FileUploadStatus[]>([]);
    const jobSessionIdRef = useRef<string>('');
    const [documentList, setDocumentList] = useState<SessionDocument[]>([]);
    const [loadingSessionDocuments, setLoadingSessionDocuments] = useState(false);
    const { 'chat-id': chatId } = router.query;

    uploadsRef.current = uploads;

    useEffect(() => {
        jobSessionIdRef.current = getJobSessionId();
        rehydrateSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // completed docs -> Trained; still-processing -> Uploads (polling resumes them)
    const rehydrateSession = async () => {
        const jobSessionId = jobSessionIdRef.current;
        if (!jobSessionId) return;

        setLoadingSessionDocuments(true);
        const data = await listSessionDocuments(jobSessionId);
        setLoadingSessionDocuments(false);

        if (!Array.isArray(data)) return;
        setDocumentList(toCompletedDocs(data));

        const inProgressStates = ['QUEUED', 'ONGOING', 'CANCELLING'];
        const seeded: FileUploadStatus[] = data
            .filter((raw: any) => inProgressStates.includes(raw?.state))
            .map((raw: any) => ({
                name: raw?.file_name || raw?.job_id,
                size: raw?.file_size || 0,
                type: '',
                progress: 0,
                phase: raw?.state === 'CANCELLING' ? 'cancelling' : 'processing',
                jobId: raw?.job_id,
                graphId: raw?.result_graph_id || '',
            }));

        if (seeded.length) {
            setUploads((prev) => {
                const existing = new Set(prev.map((f) => f.jobId));
                return [...prev, ...seeded.filter((s) => !existing.has(s.jobId))];
            });
            setTrainingInProgress(true);
        }
    };
    const hasActiveFiles = uploads.some(
        (f: FileUploadStatus) => f.phase === 'uploading' || f.phase === 'processing' || f.phase === 'cancelling'
    );

    // move finished uploads into Trained using their polling data (/v1/documents lags)
    const mergeCompletedIntoTrained = (list: FileUploadStatus[]) => {
        const completed = list.filter((f) => f.phase === 'done' && f.jobId);
        if (!completed.length) return;
        setDocumentList((prev) => {
            const existing = new Set(prev.map((d) => d.jobId));
            const added: SessionDocument[] = completed
                .filter((f) => !existing.has(f.jobId as string))
                .map((f) => ({
                    jobId: f.jobId as string,
                    fileName: f.name,
                    fileSize: f.size,
                    graphId: f.graphId,
                }));
            if (!added.length) return prev;
            notifyGraphIdsChanged(); // let the namespace gate know private docs exist now
            return [...prev, ...added];
        });
    };

    usePolling<void>({
        fn: async () => {
            const updated = await pollProgress(uploadsRef.current, cancelledRef);
            setUploads(updated);
            mergeCompletedIntoTrained(updated);
        },
        interval: JSModule?.pollingInterval || 400, // configurable polling interval from backend config
        enabled: hasActiveFiles,
        shouldStop: () => !uploadsRef.current.some((f: FileUploadStatus) => f.phase === 'uploading' || f.phase === 'processing' || f.phase === 'cancelling'),
        onComplete: () => setTrainingInProgress(false),
    });

    const handleFileChange = (e: any) => {
        const files = e.target.files;
        if (files) {
            Array.from(files as FileList).forEach((file) => addFile(file));
        }
        // resetting the file input value after processing
        e.target.value = '';
    };

    const handleFileDrop = (files: FileList) => {
        Array.from(files).forEach((file) => addFile(file));
    };

    const addFile = async (file: File) => {
        const entry: FileUploadStatus = {
            name: file.name,
            size: file.size,
            type: file.name.split('.').pop()?.toUpperCase() || '',
            progress: 0,
            phase: 'uploading',
            jobId: '',
            graphId: ''
        };
        setUploads((prev: FileUploadStatus[]) => [...prev, entry]);
        setTrainingInProgress(true);
        
        try {
            const jobSessionId = jobSessionIdRef.current || getJobSessionId();
            jobSessionIdRef.current = jobSessionId;
            const res = await uploadDocument(file, jobSessionId);
            if (!res?.job_id) throw new Error('upload failed');
            const { job_id } = res;
            setUploads((prev: FileUploadStatus[]) =>
                prev.map(f =>
                    f.name === file.name && !f.jobId
                        ? {
                              ...f,
                              jobId: job_id,
                              phase: f.phase === "uploading"? "processing": f.phase
                          }
                        : f
                )
            );
        } catch {
            // a unique jobId to differentiate the file
            const tempId = crypto.randomUUID();
            setUploads((prev: FileUploadStatus[]) =>
                prev.map(f =>
                    f.name === file.name && !f.jobId
                        ? {
                              ...f,
                              jobId: tempId,
                              phase: 'error',
                          }
                        : f
                )
            );
        }
    };

    const cancelUpload = async (jobId: string) => {
        // const file = uploadsRef.current.find((f: FileUploadStatus) => f.name === fileName);
        if (!jobId) return
        
        // here we are not changing the UI status directly, instead it is handled in pollprogress function;
        const response = await cancelDocumentProcessing(jobId)
        if (!response) {
            toast("Document processing cancellation failed", { type: "error" })
        } else {
            // if cancellation is successful
            setUploads((prev: FileUploadStatus[]) =>
                prev.map((f) => f.jobId === jobId ? { ...f, phase: 'cancelling', progress: 0} : f)
            );
        }
    };

    // TODO: extend this function, once the retry upload option is there;
    const retryUpload = (fileName: string) => {};

    const removeUpload = (jobId: string) => {
        cancelledRef.current.delete(jobId);
        setUploads((prev: FileUploadStatus[]) => prev.filter((f) => f.jobId !== jobId));
    };

    // delete a trained document; completed docs are terminal so the backend removes them
    const removeSessionDocument = async (jobId: string) => {
        if (!jobId) return;

        setDocumentList((prev) =>
            prev.map((d) => (d.jobId === jobId ? { ...d, removing: true } : d))
        );

        const result = await removeDocument(jobId);
        if (!result) {
            toast('Failed to remove document', { type: 'error' });
            setDocumentList((prev) =>
                prev.map((d) => (d.jobId === jobId ? { ...d, removing: false } : d))
            );
            return;
        }

        setDocumentList((prev) => prev.filter((d) => d.jobId !== jobId));
        setUploads((prev) => prev.filter((f) => f.jobId !== jobId));
        cancelledRef.current.delete(jobId);
        notifyGraphIdsChanged();
        toast('Document removed', { type: 'success' });
    };

    const canCancel = (jobId: string) => {
        const f = uploads.find((f: FileUploadStatus) => f.jobId === jobId);
        return f ? f.progress < 90 && f.phase === 'processing' : false;
    };

    return {
        documentList,
        uploads,
        trainingInProgress,
        handleFileChange,
        handleFileDrop,
        cancelUpload,
        retryUpload,
        removeUpload,
        canCancel,
        loadingSessionDocuments,
        removeSessionDocument,
    };
}