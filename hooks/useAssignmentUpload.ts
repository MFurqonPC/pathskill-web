import { useState } from "react";
import api from "@/lib/api";

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png";
const UPLOAD_ERROR_FALLBACK =
  "Gagal upload file. Pastikan format pdf/doc/docx/zip/jpg/png dan ukuran maksimal 10MB.";

/**
 * Hook upload assignment bersama — dipakai di ModuleDetailPage dan
 * AssignmentDetailPage supaya format file yang diterima & pesan error
 * hanya didefinisikan di satu tempat.
 *
 * `busyId` sengaja generic (number | string | null) supaya bisa dipakai
 * untuk single-assignment page (busyId = assignmentId saat itu juga)
 * maupun list-assignment page (busyId = id yang sedang diupload).
 */
export function useAssignmentUpload(onSuccess: () => Promise<void>) {
  const [busyId, setBusyId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(assignmentId: number | string, file: File) {
    setBusyId(assignmentId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // JANGAN set Content-Type manual — axios otomatis menyertakan
      // boundary multipart yang benar untuk FormData.
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      await onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? UPLOAD_ERROR_FALLBACK);
    } finally {
      setBusyId(null);
    }
  }

  return {
    upload,
    busyId,
    isUploading: (id: number | string) => busyId === id,
    error,
    setError,
    acceptedFileTypes: ACCEPTED_FILE_TYPES,
  };
}