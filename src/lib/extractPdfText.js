import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const SUCCESS_MESSAGE = 'PDF text extracted. Review suggestions below.'
const LOW_QUALITY_MESSAGE = 'This PDF did not produce clean readable text. You can still enter items manually.'
const UNAVAILABLE_MESSAGE = 'Automatic extraction was not available for this file. You can still enter items manually.'
const LINE_BREAK_TOLERANCE = 3

function collapseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function isMostlyUpperSymbolCode(line) {
  return /^(?:[A-Z0-9]{1,3}[\s._-]?){5,}$/.test(line)
}

function looksLikePdfNoise(line) {
  const normalized = line.trim()

  if (!normalized) return true
  if (/^(%PDF-|%%EOF|xref|trailer|startxref)$/i.test(normalized)) return true
  if (/^(obj|endobj|stream|endstream)$/i.test(normalized)) return true
  if (/^<<.*>>$/.test(normalized)) return true
  if (/^\/(?:BaseFont|Font|FontDescriptor|Encoding|Filter|Length|Type|Subtype|Producer|Creator|MediaBox|Contents)\b/.test(normalized)) return true
  if (/^https?:\/\/\S+$/i.test(normalized)) return true
  if (/[{}[\]<>]{3,}/.test(normalized)) return true
  if (/(?:\x00|\ufffd)/.test(normalized)) return true
  if (isMostlyUpperSymbolCode(normalized)) return true

  const printableCharacters = normalized.match(/[A-Za-z0-9]/g)?.length ?? 0
  const oddCharacters = normalized.match(/[^A-Za-z0-9\s,.;:!?'"()&/%+-]/g)?.length ?? 0
  if (printableCharacters < 3) return true
  if (oddCharacters > printableCharacters * 0.45) return true

  return false
}

function cleanExtractedLines(lines) {
  const seen = new Set()

  return lines
    .map(collapseWhitespace)
    .filter((line) => !looksLikePdfNoise(line))
    .filter((line) => {
      const dedupeKey = line.toLowerCase()
      if (seen.has(dedupeKey)) return false
      seen.add(dedupeKey)
      return true
    })
}

function formatPageText(items) {
  const lines = []
  let currentLine = []
  let lastY = null

  items.forEach((item) => {
    const value = collapseWhitespace(item.str ?? '')
    if (!value) {
      if (item.hasEOL && currentLine.length > 0) {
        lines.push(currentLine.join(' '))
        currentLine = []
        lastY = null
      }
      return
    }

    const y = Number(item.transform?.[5] ?? 0)
    const shouldBreakLine = lastY !== null && Math.abs(y - lastY) > LINE_BREAK_TOLERANCE

    if (shouldBreakLine && currentLine.length > 0) {
      lines.push(currentLine.join(' '))
      currentLine = []
    }

    currentLine.push(value)
    lastY = y

    if (item.hasEOL) {
      lines.push(currentLine.join(' '))
      currentLine = []
      lastY = null
    }
  })

  if (currentLine.length > 0) lines.push(currentLine.join(' '))

  return cleanExtractedLines(lines)
}

async function extractDocumentText(buffer) {
  const loadingTask = getDocument({
    data: buffer,
    useWorkerFetch: false,
    isEvalSupported: false,
  })

  const document = await loadingTask.promise

  try {
    const pageTexts = []

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageLines = formatPageText(textContent.items)
      if (pageLines.length > 0) pageTexts.push(pageLines.join('\n'))
    }

    return pageTexts.join('\n\n').trim()
  } finally {
    await document.destroy()
  }
}

export async function extractPdfText(file) {
  const fileName = file?.name?.toLowerCase() ?? ''
  const mimeType = file?.type ?? ''
  const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf')

  if (!file || !isPdf) {
    return {
      text: '',
      status: 'unavailable',
      message: UNAVAILABLE_MESSAGE,
    }
  }

  try {
    const buffer = await file.arrayBuffer()
    const text = await extractDocumentText(buffer)

    if (!text) {
      return {
        text: '',
        status: 'low-quality',
        message: LOW_QUALITY_MESSAGE,
      }
    }

    return {
      text,
      status: 'success',
      message: SUCCESS_MESSAGE,
    }
  } catch {
    return {
      text: '',
      status: 'low-quality',
      message: LOW_QUALITY_MESSAGE,
    }
  }
}
