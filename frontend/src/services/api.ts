/**
 * API Client for SENTINEL AI Backend.
 */

import {
  AnalyzeRequest,
  AnalyzeResponse,
  SampleMessage,
  ModelInfo,
  ModelMetrics,
  ArchiveRecord,
  ForensicRule
} from '../types/forensics';

const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {
        // use fallback status
      }
      throw new ApiError(errorMsg, res.status);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err.message || 'Network connection failed. Verify that the SENTINEL AI backend is running.',
      0
    );
  }
}

export const api = {
  getHealth: () => request<{ status: string; version: string; model_loaded: boolean; uptime_seconds: number }>('/health'),
  
  getModelInfo: () => request<ModelInfo>('/model-info'),
  
  getModelMetrics: () => request<ModelMetrics>('/model-metrics'),
  
  getSamples: () => request<SampleMessage[]>('/samples'),
  
  getRules: () => request<{ total_rules: number; rules: ForensicRule[] }>('/rules'),
  
  analyzeMessage: (data: AnalyzeRequest) =>
    request<AnalyzeResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  getArchive: (params?: { query?: string; verdict?: string; severity?: string; source_type?: string; sort_by?: string }) => {
    const query = new URLSearchParams();
    if (params?.query) query.set('query', params.query);
    if (params?.verdict) query.set('verdict', params.verdict);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.source_type) query.set('source_type', params.source_type);
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ total: number; records: ArchiveRecord[] }>(`/archive${qs}`);
  },

  getArchiveRecord: (id: string) => request<ArchiveRecord>(`/archive/${id}`),

  deleteArchiveRecord: (id: string) =>
    request<{ status: string; id: string }>(`/archive/${id}`, {
      method: 'DELETE',
    }),

  clearArchive: () =>
    request<{ status: string; deleted_count: number }>('/archive?confirm=true', {
      method: 'DELETE',
    }),

  getExportCsvUrl: () => `${BASE_URL}/archive/export/csv`,
  getExportJsonUrl: () => `${BASE_URL}/archive/export/json`,
};
