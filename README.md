# 🧟‍♂️ Zombie Gate Blitz 3D - Campanha de Sobrevivência & Exploração

Um jogo 3D de ação e sobrevivência completo e polido desenvolvido com **Three.js**, **WebGL**, e **Vite**, combinando a mecânica viciante de portões multiplicadores com **level design extenso**, **gestão de recursos de sobrevivência**, **zonas de exploração pacífica** e **curva de dificuldade progressiva com hordas acionadas por gatilhos de distância**.

## Publicação

Depois que o GitHub Pages terminar o deploy, acesse: https://joseluizgo.github.io/NaveGame/

Na primeira publicação, em **Settings → Pages**, selecione **GitHub Actions** como origem. Depois, cada atualização da branch `main` publica o jogo automaticamente.

---

## 🎮 Como Jogar & Executar

### 1. Iniciar o Servidor de Desenvolvimento
No terminal do projeto, execute:
```bash
npm run dev
```
O jogo estará disponível imediatamente em `http://localhost:5173/` (e na sua rede local para testes em smartphones no mesmo Wi-Fi!).

### 2. Gerar a Versão de Produção (Build)
```bash
npm run build
```
Os arquivos otimizados prontos para publicação estarão na pasta `dist/`.

---

## 🕹️ Controles
- **Mobile (Toque/Swipe):** Toque e arraste o dedo lateralmente na tela para desviar, coletar itens e mirar nos portões.
- **Desktop (Mouse):** Clique e arraste o mouse para os lados.
- **Teclado:** Teclas `←` / `→` ou `A` / `D` para movimentação lateral.

---

## 🗺️ As 4 Fases da Campanha (Estrutura & Level Design)

O jogo possui uma campanha completa estruturada em **4 fases consideravelmente mais longas e distintas**:

### 🏙️ Fase 1: Subúrbios Abandonados (Ato I: O Silêncio)
- **Comprimento:** 540 metros de extensão.
- **Pacing & Exploração:** Primeiros 215 metros completamente livres de inimigos. Atmosfera sombria e silenciosa com neblina crepuscular.
- **Elementos Iniciais:** Data-pads com diários de sobreviventes, kits de cura e caixas de munição espalhados pelo asfalto.
- **Encontros com Zumbis:** Apenas na segunda metade da fase, introduzindo *Walkers* lentos em pares e pequenos grupos de 3 a 4, culminando em um mini-chefe mutante nos subúrbios.

### 🧪 Fase 2: Via Expressa Tóxica (Ato II: A Infecção se Alastra)
- **Comprimento:** 740 metros de extensão.
- **Atmosfera & Desafios:** Névoa química verde e chuva ácida. Poças tóxicas no asfalto que corroem a blindagem do veículo.
- **Nova Variante de Inimigo:** Introdução dos **Runners (Zumbis Corredores)** — ágeis, agressivos, com olhos vermelhos brilhantes e investida rápida.
- **Clímax:** Chefe químico mutante com resistência ampliada.

### 🏭 Fase 3: Setor Subterrâneo 7 (Ato III: O Labirinto Industrial)
- **Comprimento:** 940 metros de extensão.
- **Level Design Labiríntico:** Pista mais larga (13.5m) dividida por **muros de concreto** e barreiras que criam caminhos bifurcados, exigindo navegação tática.
- **Novas Variantes:**
  - **Patrollers (Zumbis Patrulheiros):** Movem-se lateralmente de um lado ao outro da pista em rotas de patrulha.
  - **Armored Tanks (Zumbis Blindados):** Equipados com armadura pesada e capacetes de aço (alto HP).
- **Clímax:** Capitão de segurança cibernético blindado.

### 🚁 Fase 4: A Cidadela & A Grande Fuga (Ato IV: O Clímax Apocalíptico)
- **Comprimento:** 1180 metros de extensão (pista colossal).
- **Ritmo de Tensão Máxima:** Começa com uma calmaria perturbadora nos primeiros 165m para estocagem máxima de kits de cura e munição.
- **Clímax com Chefe Duplo:** O despertar do colossal **Titã Alpha** (modelo gigante com mais de 500 HP e ombreiras de magma).
- **Evento de Fuga (Climax Escape):** Após derrotar o Titã, sirenes ecoam e o jogador ganha aceleração máxima para cruzar a pista de pouso até o **Helicóptero de Resgate Alpha-1**, finalizando a campanha com chave de ouro!

---

## ⚙️ Sistemas de Gameplay & Mecânicas

### 1. Gestão de Recursos (Health & Ammo)
- **Barra de Vida (100 HP):** O jogador agora possui vida. Colisões com zumbis ou armadilhas ambientais reduzem o HP proporcionalmente.
- **Kits Médicos (Medkits 3D):** Caixas brancas flutuantes com cruzes verdes holográficas que recuperam +35 a +50 HP.
- **Sistema de Munição:** Os canhões de plasma consomem munição do pente. Se a munição esgotar, o veículo entra em *Modo de Emergência* (cadência reduzida), recompensando os jogadores que coletam **Caixas de Munição** no cenário.

### 2. Spawns Baseados em Gatilhos de Distância (Trigger-Based Spawning)
- Elimina o problema de zumbis atacando o jogador de surpresa no início.
- Os inimigos emergem da névoa e do asfalto apenas quando o jogador cruza coordenadas específicas de checkpoint (`triggerZ`), com alertas cinemáticos na tela (*"⚠️ MOVIMENTO DETECTADO!"*).

### 3. Terminais de Lore & Exploração
- Data-pads holográficos 3D espalhados pelas zonas de exploração inicial.
- Ao coletar, exibem trechos narrativos imersivos da história da infecção e concedem bônus de moedas para melhorias na oficina.

### 4. Armadilhas Ambientais (Hazards)
- **Barricadas de Madeira/Metal:** Destrutíveis com tiros ou contornáveis.
- **Poças Ácidas:** Causam dano contínuo caso o jogador passe por cima.
- **Espinhos & Paredes de Concreto:** Guiam o fluxo de navegação nas rotas labirínticas da Fase 3.
