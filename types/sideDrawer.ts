import React from 'react';
import { NamespaceState } from '@/types/namespace';
import { SessionDocument } from '@/types/fileUploadStatus';

export interface SideDrawerProps {
    open: boolean;
    setOpen: (val: boolean) => void;
    switchTab: (tabName: string, graphId?: string) => Promise<void>;
    namespace?: NamespaceState;
}

export interface DemoDocsSectionProps {
    styles: any;
    namespace: NamespaceState;
}

export interface UploadDropZoneProps {
    styles: any;
    dragOver: boolean;
    setDragOver: (val: boolean) => void;
    handleFileDrop: (files: FileList) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export interface UploadFileCardProps {
    styles: any;
    file: any;
    canCancel: (name: string) => boolean;
    cancelUpload: (name: string) => void;
    retryUpload: (name: string) => void;
    removeUpload: (name: string) => void;
}

export interface UploadsSectionProps {
    styles: any;
    uploads: any[];
    canCancel: (name: string) => boolean;
    cancelUpload: (name: string) => void;
    retryUpload: (name: string) => void;
    removeUpload: (name: string) => void;
}

export interface TrainedDocumentsProps {
    styles: any;
    documentList: SessionDocument[];
    loading: boolean;
    removeSessionDocument: (jobId: string) => void;
    switchTab: (tabName: string, graphId?: string) => Promise<void>;
}
