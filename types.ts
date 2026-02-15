export interface ProcessState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}
