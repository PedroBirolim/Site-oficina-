# Site — PIT LANE

Landing page responsiva para uma empresa automotiva com mecânica, acessórios, estética automotiva e experiência de simulador. O projeto usa HTML, CSS e JavaScript puros, sem dependências de execução.

## Como executar

Por usar módulos JavaScript, abra o projeto por um servidor local (não diretamente pelo protocolo `file://`).

Opção com Node.js:

```powershell
npx serve .
```

Depois, abra o endereço informado no terminal. Também é possível usar a extensão **Live Server** do VS Code.

## Estrutura

```text
.
├── index.html                 # Estrutura semântica e conteúdo da landing page
├── assets/
│   ├── brand/                 # Logo oficial e arquivo-fonte fornecido
│   └── images/                # Imagens locais otimizadas
├── css/
│   ├── style.css              # Design system, layouts, componentes e animações
│   └── responsive.css         # Adaptações para tablet e celular
└── js/
    ├── config.js              # Dados editáveis da empresa e geradores de links
    ├── configurator.js        # Seleções, resumos, persistência e orçamento por WhatsApp
    ├── before-after-slider.js # Comparador por mouse, touch e teclado
    ├── main.js                # Inicialização e interações gerais
    ├── navigation.js          # Menu mobile, scroll spy e voltar ao topo
    ├── animations.js          # Reveal, parallax e microinterações
    └── simulator.js           # Minigame Canvas, física, pista, HUD e recorde local
```

## Onde editar os dados da empresa

Todos os dados de contato estão em [`js/config.js`](js/config.js), acompanhados por comentários `TODO`:

- `COMPANY_NAME`: nome da empresa;
- `WHATSAPP_NUMBER`: país + DDD + número, somente dígitos;
- `PHONE_DISPLAY` e `PHONE_NUMBER`: telefone visível e linkável;
- `INSTAGRAM_HANDLE` e `INSTAGRAM_URL`: perfil oficial;
- `ADDRESS`: endereço exibido;
- `BUSINESS_HOURS`: horário de atendimento;
- `WAZE_DESTINATION`: endereço pesquisado no Waze;
- `LATITUDE` e `LONGITUDE`: destino preciso, quando disponível;
- `LOGO_URL`: caminho centralizado para a logo oficial da PIT LANE;
- `ACCESSORIES_IMAGE`: imagem principal do catálogo de acessórios;
- `BEFORE_IMAGE` e `AFTER_IMAGE`: imagens do comparador de estética.

Enquanto o WhatsApp não estiver configurado, o botão abre o compartilhamento geral do WhatsApp com a mensagem já preenchida. O Instagram abre a página principal da rede, e o Waze usa o destino provisório definido em `WAZE_DESTINATION`, evitando URLs quebradas.

## Como trocar logo, imagens e textos

- **Logo:** a identidade oficial está em `assets/brand/pit-lane-logo-official.png` e é consumida por loading, cabeçalho/menu mobile, mapa e rodapé através de `LOGO_URL`. O arquivo original fornecido foi preservado na mesma pasta.
- **Imagens:** substitua os arquivos em `assets/images/` mantendo os nomes atuais ou atualize as referências no HTML/CSS. Prefira JPEG/WebP otimizado, com cerca de 1600 px de largura.
- **Antes e depois:** altere `BEFORE_IMAGE` e `AFTER_IMAGE` em `js/config.js`. Use enquadramento e dimensões equivalentes para uma comparação natural.
- **História, missão e indicadores:** edite a seção `#quem-somos`. Os zeros foram mantidos como placeholders para não inventar dados empresariais.
- **Textos e serviços:** o conteúdo está organizado por seções no `index.html`; cada bloco tem um título e identificador fácil de localizar.
- **Cores:** altere as variáveis no início de `css/style.css`, especialmente `--yellow`, `--ink`, `--paper` e `--panel`.

## Configuradores e orçamento

O catálogo de acessórios e o configurador de estética compartilham o módulo `js/configurator.js`.

- Cada item pode ser selecionado ou removido individualmente.
- Os resumos e contadores são atualizados em tempo real.
- Marca, modelo, ano e cor são opcionais e sincronizados entre os dois configuradores.
- O botão **Salvar seleção** grava os dados no `localStorage` com a chave `oficina-selecao-orcamento-v2`.
- O botão **Solicitar orçamento** exige pelo menos uma seleção e prepara uma mensagem organizada para o WhatsApp.
- Enquanto `WHATSAPP_NUMBER` estiver vazio, o compartilhamento geral do WhatsApp é usado, evitando um link inválido.
- Nenhum preço é exibido até que valores reais sejam fornecidos.

## Simulador

O minigame fica isolado em `js/simulator.js` e não usa imagens proprietárias. A pista é um traçado autoral desenhado por Canvas.

- Desktop: `W`/`↑` acelera, `S`/`↓` freia ou dá ré, `A`/`←` e `D`/`→` controlam a direção.
- Celular: use os quatro controles touch exibidos sobre o jogo.
- É necessário passar pelos checkpoints na ordem para completar a volta.
- A corrida possui três voltas, cronômetro, velocidade, pausa, reinício e saída.
- O melhor tempo é salvo no `localStorage` do navegador com a chave `oficina-simulador-melhor-volta`.

## Acessibilidade e performance

- Estrutura semântica, link para pular conteúdo, foco visível e rótulos ARIA;
- menu acessível por teclado e fechamento pela tecla `Esc`;
- animações reduzidas automaticamente com `prefers-reduced-motion`;
- imagens abaixo da dobra com `loading="lazy"`;
- imagens locais em JPEG comprimido, sem dependência de servidores externos;
- nenhuma chave, token ou dado sensível no frontend.

## Checklist antes de publicar

1. Substituir todos os `TODO` de `js/config.js`.
2. Inserir história e indicadores reais.
3. Trocar as imagens demonstrativas pelas fotos autorizadas da empresa.
4. Confirmar disponibilidade e regras comerciais do simulador no FAQ.
5. Revisar os serviços realmente oferecidos.
6. Testar WhatsApp, Waze, telefone e Instagram com os dados finais.
7. Atualizar `title`, descrição, Open Graph e cidade para o SEO local.

## Assets gerados

As sete fotografias demonstrativas foram criadas com a ferramenta integrada de geração de imagens, em direção visual de fotografia automotiva premium, sem logos ou marcas identificáveis, e depois comprimidas localmente para uso no projeto. O par do comparador preserva carro, ângulo e iluminação entre o antes e o depois. Os assets devem ser substituídos por fotografias reais autorizadas quando estiverem disponíveis.
