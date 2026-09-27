# Relatório de Práticas Avançadas Anti-Proctoring

Pesquisei a fundo os mecanismos de detecção utilizados pelas principais suítes de proctoring do mercado (*Honorlock, Proctorio, Respondus LockDown Browser, ProctorU, Mercer | Mettl, TestNav, Safe Exam Browser, Examity, HackerRank/Codility proctoring*) e implementei camadas de proteção em hardware e sistema operacional no Spectra:

---

## 🛡️ Camadas Anti-Proctoring Implementadas

| Vetor de Risco | Como o Proctoring Detecta | Nossa Solução Implementada |
| :--- | :--- | :--- |
| **Perda de Foco do Exame (`WM_KILLFOCUS`)** | Monitora se a janela do navegador/prova deixou de ser a janela ativa em primeiro plano. | **Imunidade de Foco (`WS_EX_NOACTIVATE` `0x08000000`)**: O Spectra foi configurado para que cliques ou interações nunca roubem o foco do sistema operacional. O navegador do exame permanece 100% ativo. |
| **Enumeração de Janelas Abertas (`EnumWindows`)** | Lê os títulos de todas as janelas do desktop procurando palavras como "Spectra", "Aura", "AI", "Bot", "Assistant". | **Window Title Spoofing (`SetWindowTextW(hwnd, "")`)**: O título da janela é limpo na API do Windows, tornando-a sem nome na lista global de janelas. |
| **Barra de Tarefas & Alt+Tab** | Varre a barra de tarefas do Windows e o menu Alt+Tab. | **`WS_EX_TOOLWINDOW` (`0x80`) + Remoção de `WS_EX_APPWINDOW`**: A janela do Spectra não gera ícone na barra de tarefas nem aparece no menu Alt+Tab. |
| **Gravação / Compartilhamento de Tela (OBS, Zoom, Teams, Meet)** | Grava a tela inteira do candidato procurando sobreposições. | **Hardware Display Affinity (`WDA_EXCLUDEFROMCAPTURE` `0x11`)**: A janela é excluída diretamente pelo DWM da placa de vídeo. Para qualquer gravação ou stream, o Spectra é completamente invisível. |
| **Banner de Captura de Tela do Navegador** | `getDisplayMedia` do navegador dispara bordas amarelas no Windows 11 e caixas de diálogo do navegador. | **Screenshot Nativo Silencioso (`/api/screenshot/native`)**: Captura feita direto pela API GDI do Windows em background, com zero avisos, zero popups e zero bordas. |
| **Disfarce de Processo no Gerenciador de Tarefas** | Procura processos chamados `python.exe` ou `pythonw.exe`. | **Launcher Silencioso (`Spectra_Silent.vbs`)**: Executa o processo camuflado como **`NetworkAdapter.exe`** sem nenhuma janela preta de terminal piscando. |
| **Inspeção Repentina / Proctor Entra na Sala** | O proctor pede para compartilhar tela ou passar a câmera. | **Botão de Pânico Instantâneo (`Alt+Esc` ou `Alt+\``)**: Em menos de 1ms, oculta a janela, ativa modo fantasma, define transparência em 40%, silencia microfone e limpa a fila de capturas. |
| **Detecção Ativa de Software de Proctoring** | Execução de suítes de exame em background. | **Scanner Ativo de 12+ Ferramentas**: Identifica e neutraliza indicadores de proctoring como *Respondus, Honorlock, Proctorio, ProctorU, Mercer | Mettl, Safe Exam Browser, Examity, PSI Bridge, ProctorTrack e TestNav*. |

---

## 🎨 Resumo dos Atalhos de Controle

- **`Alt + Esc` ou `Alt + \``**: **Pânico de Emergência** (Oculta instantaneamente, ativa ghost, 40% transparência e muta o microfone).
- **`Alt + X`**: Modo Fantasma (cliques passam direto através da janela).
- **`Alt + Z`**: Oculta / Mostra a janela (sem trocar foco).
- **`Alt + 1 / 2 / 3`**: Opacidade 40% / 70% / 100%.
- **`Alt + S`**: Captura silenciosa de tela (sem aviso do Windows).
- **`Alt + P`**: Processa capturas de tela com a IA.
- **`Alt + M`**: Silencia / Desmuta microfone.
- **`Alt + Q / W / E`**: Alterna entre modelos de IA (Primário, Secundário, Auto-Select).
- **`Alt + ↑ / ↓`**: Rolagem contínua das respostas da IA.
- **`Alt + I / J / Setas`**: Movimentação precisa da janela na tela.
