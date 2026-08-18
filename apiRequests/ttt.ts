import { axiosTTTInstance } from "@/utils/axiosInstance"

export const uploadDocument = async (file: File, jobSessionId?: string, projectId?: string) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        if (jobSessionId) {
            formData.append('session_id', jobSessionId);
        }
        if (projectId) {
            formData.append('project_id', projectId);
        }
        const response = await axiosTTTInstance.post(`/v1/documents`, formData, {
            timeout: 5 * 60 * 1000,
        });
        return response?.data;
    } catch (error: any) {
        console.log(`something went wrong during uploading document`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const listSessionDocuments = async (jobSessionId: string) => {
    try {
        const response = await axiosTTTInstance.get(`/v1/documents`, {
            params: { session_id: jobSessionId },
            timeout: 8000,
        });
        return response?.data;
    } catch (error: any) {
        console.log(`something went wrong while listing session documents`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const removeDocument = async (jobId: string) => {
    try {
        const response = await axiosTTTInstance.delete(`/v1/documents/${encodeURIComponent(jobId)}`);
        return response?.status >= 200 && response?.status < 300;
    } catch (error: any) {
        console.log(`something went wrong while removing document with jobid: ${jobId}`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const getJobProgress = async (jobId: string) => {
    try {
        const response = await axiosTTTInstance.get(`/v1/jobs/${encodeURIComponent(jobId)}`);
        return response?.data;
    } catch (error: any) {
        console.log(`Error fetching job progress for ${jobId}`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const cancelDocumentProcessing = async (jobId: string) => {
    try {
        const response = await axiosTTTInstance.post(`/v1/jobs/${encodeURIComponent(jobId)}/cancel`);
        return response?.data;
    } catch (error: any) {
        console.log(`Error in cancelling the document processing with jobid: ${jobId}`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const getDocumentTreeJSon = async (graphId: string) => {
    try {
        const response = await axiosTTTInstance.get('/v1/tree/json', {
            params: {
                graph_id: graphId,
            },
        });
        return response?.data;
    } catch (error: any) {
        console.log(`Error in fetching document tree json with graphId: ${graphId}`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const getDocumentFile = async (graphId: string): Promise<{ blob: Blob | null; status?: number }> => {
    try {
        const response = await axiosTTTInstance.get(`/v1/documents/${encodeURIComponent(graphId)}/file`, {
            responseType: 'blob',
        });
        return { blob: response?.data ?? null };
    } catch (error: any) {
        const status = error?.response?.status;
        console.log(`Error in fetching document file with graphId: ${graphId}`, {
            message: error?.message,
            status,
            responseData: error?.response?.data
        });
        return { blob: null, status };
    }
}

export const listPublicNamespaces = async () => {
    try {
        const response = await axiosTTTInstance.get(`/public/namespaces`);
        return response?.data;
    } catch (error: any) {
        console.log(`something went wrong while listing public namespaces`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const listPublicNamespaceDocuments = async (namespace: string, limit = 50, offset = 0) => {
    try {
        const response = await axiosTTTInstance.get(`/public/namespaces/${encodeURIComponent(namespace)}/documents`, {
            params: { limit, offset }
        });
        return response?.data;
    } catch (error: any) {
        console.log(`something went wrong while listing documents for namespace ${namespace}`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const listProjectTree = async (limit = 50, offset = 0) => {
    try {
        const response = await axiosTTTInstance.get(`/v1/projects/tree`, {
            params: { limit, offset }
        });
        return response?.data;
    } catch (error: any) {
        console.log(`something went wrong while listing the project tree`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return false;
    }
}

export const createProject = async (name: string, logoDataUri: string) => {
    try {
        const response = await axiosTTTInstance.post(`/v1/projects`, { name, logo: logoDataUri });
        return { ok: true, project: response?.data };
    } catch (error: any) {
        console.log(`something went wrong while creating project`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return {
            ok: false,
            status: error?.response?.status,
            detail: error?.response?.data?.detail,
        };
    }
}

export const renameProject = async (projectId: string, name: string) => {
    try {
        const response = await axiosTTTInstance.patch(`/v1/projects/${encodeURIComponent(projectId)}`, { name }, { timeout: 10000 });
        return { ok: true, project: response?.data };
    } catch (error: any) {
        console.log(`something went wrong while renaming project`, {
            message: error?.message,
            status: error?.response?.status,
            responseData: error?.response?.data
        });
        return {
            ok: false,
            status: error?.response?.status,
            detail: error?.response?.data?.detail,
        };
    }
}

export const fetchProjectLogoObjectUrl = async (projectId: string) => {
    try {
        const response = await axiosTTTInstance.get(`/v1/projects/${encodeURIComponent(projectId)}/logo`, {
            responseType: 'blob',
        });
        return URL.createObjectURL(response?.data);
    } catch (error: any) {
        return false;
    }
}
