export type UploadPhase = 'uploading' | 'processing' | 'done' | 'error' | 'cancelling' | 'cancelled';

export type FileUploadStatus = {
    name: string;
    size: number;
    type: string;
    progress: number;
    phase: UploadPhase;
    jobId?: string;
    graphId?: string;
    error?: string;
    stage?: string;
};

export type SessionDocument = {
    jobId: string;
    fileName?: string;
    fileSize?: number;
    graphId?: string;
    removing?: boolean;
};
