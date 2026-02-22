import { memo, useCallback, useState } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useWorkflowStore } from '../../store/workflowStore'
import Icon from '../../components/Icon'
import PistaModal from './PistaModal'
import { twMerge } from 'tailwind-merge'
import Modal from '../../components/Modal'

type PistaItemProps = {
  pistaId: string
  index: number
  groupId: string
  isActive: boolean
}

const PistaItem = memo(function PistaItem({
  pistaId,
  index,
  groupId,
  isActive,
}: PistaItemProps) {
  const pista = useWorkflowStore((state) => state.pistas[pistaId])
  const updatePista = useWorkflowStore((state) => state.updatePista)
  const [element, setElement] = useState<Element | null>(null)
  const { isDragging } = useSortable({
    id: pistaId,
    index,
    element,
    type: 'pista',
    group: groupId,
    accept: ['pista'],
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMediaOpen, setIsMediaOpen] = useState(false)

  if (!pista) return null

  const handleOpenEdit = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setIsEditOpen(true)
  }, [])

  const handleConfirmEdit = useCallback(
    (data: {
      type: typeof pista.type
      description: string
      content: string | null
      mediaUrl?: string
    }) => {
      const trimmed = data.content?.trim() ?? ''
      if (!data.description.trim()) return
      if (data.type === 'text' && !trimmed) return
      if (data.type !== 'text' && !data.mediaUrl) return
      updatePista(pista.id, {
        type: data.type,
        description: data.description.trim(),
        content: data.type === 'text' ? trimmed : null,
        mediaUrl: data.type === 'text' ? undefined : data.mediaUrl,
      })
      setIsEditOpen(false)
    },
    [pista.id, updatePista],
  )

  const handleCancelEdit = useCallback(() => {
    setIsEditOpen(false)
  }, [])

  const handleOpenMedia = useCallback(() => {
    setIsMediaOpen(true)
  }, [])

  const handleCloseMedia = useCallback(() => {
    setIsMediaOpen(false)
  }, [])

  return (
    <div
      ref={setElement}
      data-shadow={isDragging || undefined}
      style={{ opacity: isDragging ? 0.7 : 1 }}
      className={twMerge(
        "cursor-grab rounded-lg border px-3 py-2 text-xs text-slate-200 active:cursor-grabbing border-slate-800 bg-slate-950/70",
        isActive ? 'opacity-60' : ''
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="mt-1 text-xs font-semibold text-slate-100">{pista.description}</p>
        <button
          type="button"
          className="rounded p-1 text-slate-400 transition hover:text-cyan-200"
          onClick={handleOpenEdit}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Editar pista"
          title="Editar"
        >
          <Icon name="edit" size={12} />
        </button>
      </div>
      
      {pista.type === 'text' && (
        <p className="mt-2 text-xs text-slate-200">{pista.content}</p>
      )}
      {pista.type === 'image' && pista.mediaUrl && (
        <div className="mt-2 space-y-2">
          <img
            src={pista.mediaUrl}
            alt={pista.description || 'Pista imagem'}
            className="max-h-32 w-full cursor-pointer rounded-md object-cover sm:max-h-40"
            onClick={handleOpenMedia}
          />
        </div>
      )}
      {pista.type === 'video' && pista.mediaUrl && (
        <div className="mt-2 space-y-2">
          <video
            controls
            className="w-full rounded-md"
            src={pista.mediaUrl}
          />
        </div>
      )}
      {pista.type === 'audio' && pista.mediaUrl && (
        <div className="mt-2 space-y-2">
          <audio controls className="w-full" src={pista.mediaUrl} />
        </div>
      )}
      {pista.type === 'image' && pista.mediaUrl && (
        <Modal
          title="Imagem"
          description={pista.description}
          onClose={handleCloseMedia}
          isOpen={isMediaOpen}
          classNameModal="w-xl max-w-xl flex flex-col items-center"
        >
          <img
            src={pista.mediaUrl}
            alt={pista.description || 'Imagem ampliada'}
            className="rounded-lg object-contain"
          />
        </Modal>
      )}
      <PistaModal
        isOpen={isEditOpen}
        title="Editar pista"
        description="Atualize o tipo e o conteúdo da pista."
        confirmLabel="Salvar"
        initialType={pista.type}
        initialDescription={pista.description}
        initialContent={pista.content ?? ''}
        initialMediaUrl={pista.mediaUrl}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />
    </div>
  )
})

export default PistaItem
