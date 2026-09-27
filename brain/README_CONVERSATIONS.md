# Spectra — Brain & Conversation History

Este diretório contém o snapshot completo do "Brain" da conversa entre o usuário e o Antigravity (Google DeepMind) durante o desenvolvimento e evolução do projeto **Spectra**.

## 📌 Metadados da Conversa
- **Conversation ID Principal**: `bbca0f09-2535-4f26-97c1-b43b75148a4f`
- **Subagente Anti-Proctoring Researcher**: `83954489-8afb-4108-ac2a-ea1b4134a8bf`
- **Subagente UI Visual Researcher**: `eaa457bc-8321-40fa-ae7a-46998891643f`
- **Workspace**: `c:\Users\Arthur Henrique\Documents\GitHub\Spectra`
- **Data do Snapshot**: 27 de Setembro de 2026

---

## 🗂️ Estrutura deste Diretório

- **`.system_generated/logs/`**:
  - `transcript.jsonl`: Linha por linha em JSON Lines de todos os passos, pensamentos e ações da conversa.
  - `transcript_full.jsonl`: Versão completa sem truncamento de outputs ou campos longos.
- **`subagents/`**:
  - `anti_proctoring_researcher/`: Análise aprofundada da stack do Parakeet AI e técnicas de evasão / invisibilidade.
  - `ui_visual_researcher/`: Análise detalhada dos componentes visuais, CSS, temas e design patterns.
- **`.user_uploaded/`**:
  - Todas as capturas de tela e imagens de referência enviadas pelo usuário (Parakeet UI, configurações, etc.).
- **`task.md` & `implementation_plan.md` & `walkthrough.md`**:
  - Planos de ação, tarefas estruturadas e documentação passo a passo criados durante as sessões.

---

## 🚀 Linha do Tempo e Principais Decisões da Conversa

1. **Investigação e Engenharia Reversa do Parakeet AI**:
   - Inspeção da instalação local do Parakeet AI (`%LOCALAPPDATA%\Programs\parakeetai-desktop`).
   - Descoberta das técnicas de camuflagem de processo:
     - O executável é nomeado `⠀.exe` (espaço Unicode Braille `\u2800`), aparecendo no Gerenciador de Tarefas como `⠀ (6)`.
     - O título do documento HTML é `<title>pmodule</title>`.
     - Janela frameless, transparente, `alwaysOnTop: true, 'screen-saver'`, `skipTaskbar: true`.
     - Proteção de hardware contra captura de tela via `SetWindowDisplayAffinity` (`WDA_EXCLUDEFROMCAPTURE` / Electron `setContentProtection(true)`).

2. **Migração Completa de Stack (Python -> Electron + Node.js)**:
   - Substituição do backend Python (`pywebview`, `main.py`) por uma stack 100% nativa em Electron + Node.js 24 (`electron/main.js`, `electron/preload.js`, `electron/server/server.js`).
   - Servidor local Express + WebSocket integrado rodando dentro do processo Electron.
   - LLM Streaming ultra-rápido via Cerebras / Groq / Gemini / OpenRouter e Deepgram Live STT direto no Node.

3. **Compilação de Launcher Nativo Windows (Sem Janelas de Console ou `.bat`)**:
   - Criação do compilador C# `launcher.cs` gerando executáveis GUI nativos (`/target:winexe`): `Spectra.exe`.
   - Eliminação total de telas pretas, popups de prompt de comando ou scripts `.bat`.

4. **Grid de Movimentação em 6 Posições (1:1 Parakeet AI)**:
   - Overlay de tela cheia com opacidade (`web/move-overlay.html`).
   - Acionado via botão `✥` no header ou atalho `Alt + M` / `Ctrl + Shift + M`.
   - 6 quadrantes: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.
   - O Spectra passa a se movimentar exclusivamente por essas zonas.

5. **Reformulação Total da UI (1:1 Parakeet AI)**:
   - Floating card com bordas arredondadas (`24px`) e sombras sutis.
   - Tema Branco (Light) por padrão, com alternância para Dark e System Mode.
   - Dropdown menu com perfil de usuário, updates, "Dashboard" (travado `🔒`), e **chave "Private"** (permite ligar/desligar a invisibilidade para conseguir tirar prints com `Win+Shift+S`).
   - Modal de Criação de Sessão em 2 passos (Stepper):
     - Escolha entre `Interview` e `Regular`.
     - Inclusão de `Company`, `Job Description` e contexto (`CV / Resume` + `Documents`).
     - Exclusão do botão "Paste a job link" a pedido do usuário.
     - Passo 2 com seleção de Provedor de IA, Pills de foco e Microfone.
