import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const FileList: React.FC = () => {
  const [filters, setFilters] = useState({ fileType: '', minSize: '', maxSize: '', startDate: '', endDate: '', search: '' });
  const queryClient = useQueryClient();

  const { data: files = [], isLoading, error, refetch } = useQuery({
    queryKey: ['files', filters],
    queryFn: ({ queryKey }) => { 
      const [, filterParams] = queryKey;  
      const queryParams = new URLSearchParams(filterParams).toString(); 
      return fileService.getFiles(queryParams);  
    },
  });
 

  // Mutation for deleting files
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // Mutation for downloading files
  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const filteredFiles = files.filter(file => {
  const matchesSearch = filters.search
    ? file.original_filename.toLowerCase().includes(filters.search.toLowerCase())
    : true;

    const matchesFileType = filters.fileType
      ? file.file_type.includes(filters.fileType)
      : true;

    
    const minSize = Number(filters.minSize);
    const maxSize = Number(filters.maxSize);

    const matchesMinSize = minSize ? file.size >= minSize * 1024 : true;
    const matchesMaxSize = maxSize ? file.size <= maxSize * 1024 : true;

    return matchesSearch && matchesFileType && matchesMinSize && matchesMaxSize;
  });


  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <input
          type="text"
          name="search"
          placeholder="Search by filename"
          value={filters.search}
          onChange={handleFilterChange}
          className="border rounded-lg px-3 py-2 w-full"
        />
        <select
          name="fileType"
          value={filters.fileType}
          onChange={handleFilterChange}
          className="border rounded-lg px-3 py-2 w-full"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
          <option value="text">Text Files</option>
          <option value="video">Videos</option>
        </select>
        
          <input
            type="number"
            name="minSize"
            placeholder="Min KB"
            value={filters.minSize}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="number"
            name="maxSize"
            placeholder="Max KB"
            value={filters.maxSize}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 w-full"
          />
        
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 w-full"
          />
        

        <button onClick={() => refetch()} className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto">
          Apply
        </button>
        </div>
      </div>

      {/* 📄 File List */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>

        {isLoading ? (
          <p>Loading files...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load files. Please try again.</p>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded yet</h3>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredFiles.map((file) => (
              <li key={file.id} className="py-4 flex justify-between items-center">
                <div className="p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <DocumentIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.original_filename}</p>
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <button
                    onClick={() => handleDownload(file.file, file.original_filename)}
                    disabled={downloadMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded w-full sm:w-auto"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 inline-block" /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded w-full sm:w-auto"
                  >
                    <TrashIcon className="h-4 w-4 inline-block" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
