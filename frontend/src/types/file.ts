export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  file_hash?: string;
}

export interface UploadResponse {
  id?: string;
  file_id?: string; // Exists when a duplicate file is found
  original_filename?: string;
  message?: string; // Exists when a duplicate file is detected
}
