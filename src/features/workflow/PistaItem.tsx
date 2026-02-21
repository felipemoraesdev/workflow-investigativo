import { memo, useCallback, useState } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useWorkflowStore } from '../../store/workflowStore'
import Icon from '../../components/Icon'
import PistaModal from './PistaModal'
import { twMerge } from 'tailwind-merge'

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
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">
          {pista.type}
        </span>
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
      <p className="mt-2 text-xs font-semibold text-slate-100">{pista.description}</p>
      {pista.type === 'text' && (
        <p className="mt-2 text-xs text-slate-200">{pista.content}</p>
      )}
      {pista.type === 'image' && pista.mediaUrl && (
        <div className="mt-2 space-y-2">
          <img
            src={pista.mediaUrl}
            alt={pista.description || 'Pista imagem'}
            className="max-h-40 w-full rounded-md object-cover"
          />
          <a
            href={pista.mediaUrl}
            download
            className="text-[10px] uppercase tracking-[0.2em] text-cyan-200"
          >
            Baixar imagem
          </a>
        </div>
      )}
      {pista.type === 'video' && pista.mediaUrl && (
        <div className="mt-2 space-y-2">
          <video
            controls
            className="w-full rounded-md"
            src={pista.mediaUrl}
          />
          <a
            href={pista.mediaUrl}
            download
            className="text-[10px] uppercase tracking-[0.2em] text-cyan-200"
          >
            Baixar vídeo
          </a>
        </div>
      )}
      {pista.type === 'audio' && pista.mediaUrl && (
        <div className="mt-2 space-y-2">
          <audio controls className="w-full" src={pista.mediaUrl} />
          <a
            href={pista.mediaUrl}
            download
            className="text-[10px] uppercase tracking-[0.2em] text-cyan-200"
          >
            Baixar áudio
          </a>
        </div>
      )}
      {isEditOpen && (
        <PistaModal
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
      )}
    </div>
  )
})

export default PistaItem
