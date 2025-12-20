'use client';

import { useState } from 'react';

const AdminDocumentsClient = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            return;
        }

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        const response = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const newFiles = await response.json();
            setUploadedFiles([...uploadedFiles, ...newFiles]);
            setFiles([]);
        }
    };

    return (
        <div className="space-y-8">
            <div className="rounded-xl bg-gray-800 border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Upload leases, receipts, applications, or any property-related documents. We'll automatically extract and classify the information.
                </p>
                <div className="mt-4">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer"
                    >
                        <div className="space-y-1 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-500"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="flex text-sm text-gray-400">
                                <p className="pl-1">Drag & drop documents here, or click to select</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                Supports PDF, JPG, PNG (max 10MB per file)
                            </p>
                        </div>
                    </label>
                </div>
                {files.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={handleUpload}
                            className="w-full bg-blue-600 text-white py-2 rounded-md"
                        >
                            Upload {files.length} file(s)
                        </button>
                    </div>
                )}
            </div>
            <div className="rounded-xl bg-gray-800 border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white">Uploaded Documents</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Review, classify, and convert your documents to digital records.
                </p>
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-4">
                            <button className="text-sm font-medium text-white">All ({uploadedFiles.length})</button>
                            <button className="text-sm font-medium text-gray-400">Pending (0)</button>
                            <button className="text-sm font-medium text-gray-400">Classified (0)</button>
                            <button className="text-sm font-medium text-gray-400">Digitized (0)</button>
                        </div>
                        <button className="text-sm font-medium text-white">Refresh</button>
                    </div>
                    <div className="mt-4">
                        {uploadedFiles.length === 0 ? (
                            <p className="text-sm text-gray-400">No documents found</p>
                        ) : (
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            File Name
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploadedFiles.map((file) => (
                                        <tr key={file.id} className="bg-gray-800 border-b border-gray-700">
                                            <td className="px-6 py-4">{file.name}</td>
                                            <td className="px-6 py-4">Pending</td>
                                            <td className="px-6 py-4">
                                                <button className="text-sm font-medium text-blue-500">Classify</button>
                                                <button className="ml-4 text-sm font-medium text-green-500">Digitize</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDocumentsClient;
