import { memo, useCallback, useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import type { MediaType } from '../../types/models'

type PistaModalProps = {
  isOpen: boolean
  title?: string
  description?: string
  initialType?: MediaType
  initialDescription?: string
  initialContent?: string | null
  initialMediaUrl?: string
  confirmLabel?: string
  onConfirm: (data: {
    type: MediaType
    description: string
    content: string | null
    mediaUrl?: string
  }) => void
  onCancel: () => void
}

const PistaModal = memo(function PistaModal({
  isOpen,
  title = 'Nova pista',
  description = 'Informe o tipo e o conteúdo da pista.',
  initialType = 'text',
  initialDescription = '',
  initialContent = '',
  initialMediaUrl,
  confirmLabel = 'Criar pista',
  onConfirm,
  onCancel,
}: PistaModalProps) {
  const [type, setType] = useState<MediaType>(initialType)
  const [descriptionText, setDescriptionText] = useState(initialDescription)
  const [content, setContent] = useState(initialContent ?? '')
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(initialMediaUrl)
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    setType(initialType)
    setDescriptionText(initialDescription)
    setContent(initialContent ?? '')
    setMediaUrl(initialMediaUrl)
    setFileError('')
  }, [initialContent, initialDescription, initialMediaUrl, initialType])

  useEffect(() => {
    if (type === 'text') {
      setMediaUrl(undefined)
      setFileError('')
    }
  }, [type])

  const handleConfirm = useCallback(() => {
    if (!descriptionText.trim()) {
      setFileError('Informe uma descrição breve para a pista.')
      return
    }
    if (type !== 'text' && !mediaUrl) {
      setFileError('Selecione um arquivo para este tipo de pista.')
      return
    }

    const confirmData = {
      type,
      description: descriptionText.trim(),
      content: type === 'text' ? content : null,
      mediaUrl,
    }
    onConfirm(confirmData)

    handleClearModal()
  }, [content, descriptionText, mediaUrl, onConfirm, type])

  const handleCancel = () => {
    onCancel()
    handleClearModal()
  }

  const handleClearModal = () => {
    setType('text')
    setDescriptionText('')
    setContent('')
    setMediaUrl(undefined)
    setFileError('')
  }

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        setMediaUrl(undefined)
        return
      }
      const objectUrl = URL.createObjectURL(file)
      setMediaUrl(objectUrl)
      setFileError('')
      if (!descriptionText.trim()) {
        setDescriptionText(file.name)
      }
    },
    [descriptionText],
  )

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={handleCancel}
      classNameModal="w-lg max-w-lg"
    >
      <label className="text-xs text-slate-400">Tipo</label>
      <select
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
        value={type}
        onChange={(event) => setType(event.target.value as MediaType)}
      >
        <option value="text">Texto</option>
        <option value="image">Imagem</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
      </select>

      <label className="mt-4 block text-xs text-slate-400">Descrição</label>
      <input
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
        placeholder="Descrição da pista"
        value={descriptionText}
        onChange={(event) => setDescriptionText(event.target.value)}
      />

      {type !== 'text' && (
        <>
          <label className="mt-4 block text-xs text-slate-400">Arquivo</label>
          <input
            type="file"
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1 file:text-xs file:text-slate-200"
            accept={
              type === 'image'
                ? 'image/*'
                : type === 'video'
                  ? 'video/*'
                  : 'audio/*'
            }
            onChange={handleFileChange}
          />
          {mediaUrl && (
            <p className="mt-2 text-xs text-slate-400">Arquivo anexado.</p>
          )}
          {fileError && (
            <p className="mt-2 text-xs text-rose-300">{fileError}</p>
          )}
        </>
      )}

      {type === 'text' && (
        <>
          <label className="mt-4 block text-xs text-slate-400">
            Conteúdo
          </label>
          <textarea
            className="mt-2 min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
            placeholder={type === 'text' ? 'Conteúdo da pista' : 'Opcional'}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={type !== 'text'}
          />
        </>
      )}


      <div className="mt-4 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
})

export default PistaModal
