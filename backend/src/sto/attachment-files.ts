import { mkdir, unlink } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import type { AttachmentType } from '../generated/prisma/enums'
import { AppError } from '../http/errors'

const maxAttachmentBytes = 25 * 1024 * 1024
const uploadRoot = resolve(fileURLToPath(new URL('../../.uploads', import.meta.url)))

const documentMimeTypes = new Set([
  'application/msword',
  'application/pdf',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'text/plain',
])

export type AttachmentUploadFile = {
  bytes: Uint8Array
  mimeType: string
  originalFilename: string
  size: number
}

export function validateUploadFile(file: AttachmentUploadFile, type: AttachmentType) {
  if (!file.mimeType) {
    throw new AppError(400, 'BAD_REQUEST', 'File MIME type is required')
  }

  if (file.size <= 0) {
    throw new AppError(400, 'BAD_REQUEST', 'File is empty')
  }

  if (file.size > maxAttachmentBytes) {
    throw new AppError(400, 'BAD_REQUEST', 'File is larger than 25 MB')
  }

  if (!isAllowedMime(file.mimeType)) {
    throw new AppError(400, 'BAD_REQUEST', `Unsupported file MIME type: ${file.mimeType}`)
  }

  if (type === 'PHOTO' && !isImageMime(file.mimeType)) {
    throw new AppError(400, 'BAD_REQUEST', 'PHOTO attachments must use an image MIME type')
  }

  if (type === 'VIDEO' && !isVideoMime(file.mimeType)) {
    throw new AppError(400, 'BAD_REQUEST', 'VIDEO attachments must use a video MIME type')
  }

  if (type === 'DOCUMENT' && (isVideoMime(file.mimeType) || !isDocumentMime(file.mimeType))) {
    throw new AppError(400, 'BAD_REQUEST', 'DOCUMENT attachments must use a supported document MIME type')
  }
}

export function createAttachmentStorageKey(input: {
  organizationId: string
  workOrderId: string
  originalFilename: string
}) {
  return [
    'sto',
    sanitizePathSegment(input.organizationId),
    sanitizePathSegment(input.workOrderId),
    `${randomUUID()}-${sanitizeFilename(input.originalFilename)}`,
  ].join('/')
}

export async function writeAttachmentFile(storageKey: string, bytes: Uint8Array) {
  const path = attachmentPath(storageKey)
  await mkdir(dirname(path), { recursive: true })
  await Bun.write(path, bytes)
}

export async function removeAttachmentFile(storageKey: string) {
  await unlink(attachmentPath(storageKey)).catch(() => undefined)
}

export async function attachmentFileResponse(input: {
  filename: string | null
  mimeType: string | null
  storageKey: string
}) {
  const path = attachmentPath(input.storageKey)
  const file = Bun.file(path, { type: input.mimeType ?? 'application/octet-stream' })

  if (!(await file.exists())) {
    throw new AppError(404, 'NOT_FOUND', 'Attachment file is missing from local storage')
  }

  return new Response(file, {
    headers: {
      'Cache-Control': 'private, max-age=60',
      'Content-Disposition': `inline; filename="${contentDispositionFilename(input.filename)}"`,
      'Content-Length': String(file.size),
      'Content-Type': input.mimeType ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function attachmentPath(storageKey: string) {
  const normalizedStorageKey = storageKey.replaceAll('\\', '/')
  if (normalizedStorageKey.includes('..') || normalizedStorageKey.startsWith('/')) {
    throw new AppError(400, 'BAD_REQUEST', 'Invalid attachment storage key')
  }

  const path = resolve(uploadRoot, normalizedStorageKey)
  if (path !== uploadRoot && !path.startsWith(`${uploadRoot}${sep}`)) {
    throw new AppError(400, 'BAD_REQUEST', 'Invalid attachment storage path')
  }

  return path
}

function isAllowedMime(mimeType: string) {
  return isImageMime(mimeType) || isVideoMime(mimeType) || isDocumentMime(mimeType)
}

function isImageMime(mimeType: string) {
  return mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp'
}

function isVideoMime(mimeType: string) {
  return mimeType.startsWith('video/')
}

function isDocumentMime(mimeType: string) {
  return documentMimeTypes.has(mimeType)
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function sanitizeFilename(filename: string) {
  const safe = filename.trim().replace(/[/\\:*?"<>|#%{}^~[\]`]/g, '-')
  return safe || 'attachment'
}

function contentDispositionFilename(filename: string | null) {
  return sanitizeFilename(filename ?? 'attachment').replace(/"/g, '')
}
