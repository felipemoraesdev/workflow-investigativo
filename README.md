# Workflow Investigativo

SPA para organizar workflows de investigação criminal em um canvas visual.

## Como rodar
1. `npm install`
2. `npm run dev`

## Stack
- Vite + React + TypeScript (SPA)
- TanStack Router
- Tailwind CSS
- Zustand
- dnd kit
- React Modal
- Phosphor Icons

## Arquitetura
- `src/pages`: rotas/páginas da aplicação (TanStack Router)
- `src/features`: funcionalidades por domínio (canvas, groups, pistas)
- `src/components`: componentes compartilhados (Modal, Button, Icon, etc)
- `src/store`: Zustand (slices + selectors)
- `src/types`: modelos de domínio

## Fluxos principais
- Criar workflows.
- Canvas com pan/zoom e grupos arrastáveis.
- Pistas por tipo (texto, imagem, vídeo, áudio).
- Reordenação e movimentação de pistas entre grupos com DnD.
- Conexões entre grupos e seleção para exclusão.
- Exportação de workflow em JSON.

## Outros
- Persistência apenas em memória (sem backend);
- Exportação gera arquivo local;
- Imagens não são salvas externamente, apenas em memória;