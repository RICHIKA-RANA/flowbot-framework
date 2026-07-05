import { useContext, useEffect, useState, useRef } from 'react';
import { uploadDocument, getJobProgress, cancelDocumentProcessing } from '@/apiRequests/ttt';
import ThemeContext from '@/contexts/ThemeContext';
import { useRouter } from 'next/router';
import { usePolling } from '@/hooks/usePolling';
import { UploadPhase, FileUploadStatus } from '@/types/fileUploadStatus';
import { addGraphId, getCurrentSessionId } from '@/utils/sessionJobs';
import { toast } from 'react-toastify';

/**
 * Notify the server that a document has been processed and linked to this session.
 * Called once per file when polling confirms COMPLETED + a valid graphId is present.
 * Non-fatal — failure is logged but does not affect the upload UI.
 */
async function recordDocumentInHistory(
    file: FileUploadStatus,
    graphId: string,
    chatbotId: string
): Promise<void> {
    const sessionId = getCurrentSessionId();
    if (!sessionId || !graphId) return;

    try {
        await fetch('/api/history/document', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                chatbotId,
                graphId,
                name:  file.name,
                size:  file.size,
                type:  file.type,
                jobId: file.jobId,
            }),
        });
    } catch (err) {
        console.error('recordDocumentInHistory failed (non-fatal):', err);
    }
}

const pollProgress = async (
    uploads: FileUploadStatus[],
    cancelledRef: React.MutableRefObject<Set<string>>,
    chatbotId: string
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
                }

                if (currentState === 'FAILED') {
                    return { ...f, phase: 'error', progress: progressPercentage };
                }

                if (currentState === 'COMPLETED') {
                    const graphId = response?.result_graph_id;

                    // Only record when we have a real graphId — guards against the
                    // race where COMPLETED fires but result_graph_id isn't set yet,
                    // which would otherwise push an empty string into sessionStorage.
                    if (graphId) {
                        addGraphId(graphId);

                        // Tell the server to persist this document in user_histories.
                        // Fire-and-forget — UI does not wait for this.
                        recordDocumentInHistory(f, graphId, chatbotId);
                    }

                    return {
                        ...f,
                        graphId: graphId || f.graphId,
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

export const useTainPDF = () => {
    const router = useRouter();
    const { JSModule } = useContext(ThemeContext);
    const [documentList, setDocumentList] = useState<FileUploadStatus[]>([]);
    const [selectedFileType, setSelectedFileType] = useState<string>('PDF');
    const [trainingInProgress, setTrainingInProgress] = useState(false);
    const [uploads, setUploads] = useState<FileUploadStatus[]>([]);
    const cancelledRef = useRef<Set<string>>(new Set());
    const uploadsRef = useRef<FileUploadStatus[]>([]);
    const { 'chat-id': chatId } = router.query;

    // chatbotId needed to record documents under the right chatbot in user_histories
    const chatbotId = (chatId as string) || process.env.NEXT_PUBLIC_DEFAULT_CHAT_ID || '';

    uploadsRef.current = uploads;
    const hasActiveFiles = uploads.some(
        (f: FileUploadStatus) => f.phase === 'uploading' || f.phase === 'processing' || f.phase === 'cancelling'
    );

    usePolling<void>({
        fn: async () => {
            const updated = await pollProgress(uploadsRef.current, cancelledRef);
            setUploads(updated);
            // Mark newly completed files as trained
            const updatedDocumentList = updated.map((item) => item.phase === "done"? { ...item, progress: 100}: item)
            setDocumentList(updatedDocumentList)
        },
        interval: JSModule?.pollingInterval || 400, // configurable polling interval from backend config
        enabled: hasActiveFiles,
        shouldStop: () => !uploadsRef.current.some((f: FileUploadStatus) => f.phase === 'uploading' || f.phase === 'processing' || f.phase === 'cancelling'),
        onComplete: () => {
            setTrainingInProgress(false);
        },
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
            const {job_id} = await uploadDocument(file);
            setDocumentList((prev: FileUploadStatus[]) => [...prev,{ ...entry, jobId: job_id }]);
            setUploads((prev: FileUploadStatus[]) =>
                prev.map((f) =>
                    f.name === file.name && !f.jobId
                        ? { ...f, jobId: job_id, phase: f.phase === 'uploading' ? 'processing' : f.phase }
                        : f
                )
            );

        } catch {
            // a unique jobId to differentiate the file
            const tempId = crypto.randomUUID();
            setUploads((prev: FileUploadStatus[]) =>
                prev.map((f) =>
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

    // TODO: extend this function once the retry upload option is added
    const retryUpload = (fileName: string) => {};

    const removeUpload = (jobId: string) => {
        cancelledRef.current.delete(jobId);
        setUploads((prev: FileUploadStatus[]) => prev.filter((f) => f.jobId !== jobId));
        setDocumentList((prev: FileUploadStatus[]) => prev.filter((item) => item.jobId !== jobId));
    };

    const canCancel = (jobId: string) => {
        const f = uploads.find((f: FileUploadStatus) => f.jobId === jobId);
        return f ? f.progress < 90 && f.phase === 'processing' : false;
    };

    return {
        documentList,
        setDocumentList,
        selectedFileType,
        uploads,
        trainingInProgress,
        setTrainingInProgress,
        handleFileChange,
        handleFileDrop,
        cancelUpload,
        retryUpload,
        removeUpload,
        canCancel,
    };
}