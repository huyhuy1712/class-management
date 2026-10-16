import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import examService from '../../../../../services/examService'
import useResourceQuery from '../../../../../query/useResourceQuery'
import { getSessionVersion } from '../../../../../query/queryClient'
import { validatePdfImport } from '../helpers/pdfImportAdapter'

export const pdfPollInterval = (query) =>
  ['QUEUED', 'PROCESSING'].includes(query.state.data?.status)
    ? Math.max(1000, Math.min(15000, query.state.data.pollAfterMs || 3000))
    : false

export default function usePdfExamImport() {
  const [importId, setImportId] = useState('')
  const request = useRef(null)
  const lock = useRef(false)
  const client = useQueryClient()
  const query = useResourceQuery(
    'pdfExamImport',
    [importId],
    {
      enabled: Boolean(importId),
      refetchInterval: pdfPollInterval,
      staleTime: 0,
    }
  )
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ file, examNumber }) => {
      const error = validatePdfImport(file, examNumber)
      if (error) throw new Error(error)

      const version = getSessionVersion()
      if (
        !request.current ||
        request.current.file !== file ||
        request.current.examNumber !== examNumber
      ) {
        request.current = {
          file,
          examNumber,
          requestId: crypto.randomUUID(),
        }
      }

      const response = await examService.importPdf(
        file,
        Number(examNumber),
        request.current.requestId
      )
      if (version !== getSessionVersion()) return
      if (!response?.importId) {
        throw new Error('BE không trả mã tác vụ import.')
      }

      setImportId(response.importId)
      client.setQueryData(
        [...query.queryKey.slice(0, 3), response.importId],
        response
      )
    },
  })

  const upload = async (values) => {
    if (lock.current) return
    lock.current = true
    try {
      await mutation.mutateAsync(values)
    } finally {
      lock.current = false
    }
  }

  const reset = () => {
    if (lock.current) return

    request.current = null
    setImportId('')
    mutation.reset()
  }

  return { query, upload, uploading: mutation.isPending, uploadError: mutation.error, importId, reset }
}
