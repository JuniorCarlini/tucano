# 🦜 Tucano

Componentes de formulário e interface para a web, para quem escreve HTML.
Sem React, sem Vue, sem dependência em runtime.

Funciona com Django, Laravel, Rails ou qualquer back-end que devolve HTML do
servidor, com ou sem HTMX: o valor fica no formulário nativo e os componentes se
montam sozinhos. Os exemplos usam Django; em PHP e Rails, campo múltiplo precisa
de `name` terminado em `[]`, e o upload direto precisa do cabeçalho de CSRF do
framework (`data-csrf="false"` e a opção `headers` do `new Upload`).

**39 KB de JS + 13 KB de CSS** (minificado + gzip).

**[Documentação e exemplos ao vivo →](https://juniorcarlini.github.io/tucano/)**

| Componente | Status |
| --- | --- |
| `DatePicker` — data, período, hora, data+hora | pronto |
| `Select` — busca, multi-seleção com tags, grupos, limite | pronto |
| `ColorPicker` — HSV, hex/rgb/hsl, opacidade, paleta | pronto |
| `Upload` — arrastar e soltar, progresso, validação | pronto |
| `Mask` — CPF, CNPJ, telefone, real, campo sensível | pronto |
| `Toast` — avisos, com integração Django e HTMX | pronto |
| `Tooltip` — dica ancorada, teclado e toque | pronto |
| `Modal` — diálogo sobre `<dialog>` nativo, fundo com brilho | pronto |
| `Drawer` — off-canvas nas quatro bordas, mesmo motor do modal | pronto |
| `Acordeão` — sobre `<details>`, funciona sem JavaScript | pronto |
| `Dropdown` — menu de ações ancorado, navegação por setas | pronto |
| `Table` — ordenação por coluna e seleção em massa | pronto |
| `Pagination` — links de página, feita para o Paginator | pronto |
| `Tabs` — abas com teclado do ARIA APG, e segmentadas | pronto |
| `.tuc-alert` — aviso fixo na página, quatro tons, só classe | pronto |
| `.tuc-spinner` `.tuc-skeleton` — carregando, só classe | pronto |
| `.tuc-timeline` — linha do tempo, só classe | pronto |
| `.tuc-menu` — lista de navegação, só classe | pronto |
| `.tuc-badge` — etiqueta de estado, quatro tons, só classe | pronto |
| `.tuc-check` `.tuc-radio` `.tuc-switch` — caixa, opção e chave, só classe | pronto |
| `.tuc-label` `.tuc-hint` `.tuc-error` — rótulo, ajuda e erro; campo inválido por `aria-invalid` | pronto |
| `Editor` — editor de texto com tabela e bloco de código | pronto |
| `.tuc-prose` — exibição do que o editor salvou, com destaque e copiar | pronto |
| `.tuc-btn` — estilo de botão, só classe | pronto |

---

## Instalação

### CDN, com HTML puro

Dois arquivos e nada mais — sem npm, sem build, sem escrever JavaScript:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/JuniorCarlini/tucano@v0.33.1/dist/tucano.min.css">
<script src="https://cdn.jsdelivr.net/gh/JuniorCarlini/tucano@v0.33.1/dist/tucano.min.js" defer></script>

<input type="text" name="date" data-tuc-datepicker>
<select name="state" data-tuc-select><option>...</option></select>
<input type="text" name="color" value="#4f46e5" data-tuc-color>
```

Funciona junto com o CDN do Tailwind sem conflito: o pacote **não** envia o
preflight, e os elementos internos têm reset próprio para não serem atingidos
pelo preflight do Tailwind nem pelo CSS do projeto.

Prenda sempre a versão (`@0.33.1`). `@latest` quebra sozinho quando você publicar
uma versão nova.

### Estático (Django, Rails, HTML puro)

Copie `dist/` para os arquivos estáticos do projeto:

```html
<link rel="stylesheet" href="{% static 'tucano/tucano.min.css' %}">
<script src="{% static 'tucano/tucano.min.js' %}" defer></script>
```

Não precisa de build no projeto que consome. O CSS já vem compilado e só contém
as classes dos componentes — o preflight do Tailwind **não** é enviado, então
nada do seu projeto é afetado.

### npm

```bash
npm install tucano
```

```js
import { DatePicker } from 'tucano';
import 'tucano/css';
```

---

## Uso

### Por atributo (não precisa escrever JS)

Todo `[data-tuc-datepicker]` é inicializado sozinho no load e depois de cada
swap do HTMX.

```html
<input type="text" name="date" data-tuc-datepicker>
<input type="text" name="when" data-tuc-datepicker data-time="true">
<input type="text" name="period" data-tuc-datepicker data-mode="range">
<input type="text" name="window" data-tuc-datepicker data-mode="range" data-time="true">
```

Atributos disponíveis: `data-mode`, `data-time`, `data-seconds`,
`data-minute-step`, `data-locale`, `data-format`, `data-months`, `data-min`,
`data-max`, `data-presets`, `data-week-numbers`,
`data-iso-name`, `data-placement`.

### Por JavaScript

```js
const dp = new Tucano.DatePicker('#delivery', {
  mode: 'range',
  time: true,
  minuteStep: 15,
  min: '2026-01-01',
  disabledDates: (d) => d.getDay() === 0,   // domingo fechado
  onChange: (value, { iso }) => console.log(value, iso),
});

dp.setValue({ start: '2026-03-01', end: '2026-03-15' });
dp.getValue();   // { start: Date, end: Date }
dp.clear();
dp.destroy();
```

### Textos em outros idiomas

Datas e números seguem o `lang` da página. Os textos que os componentes escrevem
sozinhos — o "Limpar" do calendário, o "Buscar..." do select, o "Fechar" do
modal, os rótulos lidos pelo leitor de tela — vêm em português. Não há
dicionário de idiomas no pacote: `Tucano.setTexts()` troca o que você quiser,
por grupo, e o que não for passado continua como estava.

```html
<script src=".../tucano.min.js" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', () => Tucano.setTexts({
    datepicker: { clear: 'Clear', apply: 'Apply', previousMonth: 'Previous month',
                  nextMonth: 'Next month', placeholderLetters: 'ymdhms' },
    select: { searchPlaceholder: 'Search...', emptyText: 'No results',
              remove: (label) => `Remove ${label}` },
    modal: { close: 'Close' },
    toast: { close: 'Close' },
  }));
</script>
```

Com npm, `import { setTexts } from 'tucano'`, chamado antes de criar os
componentes.

- O texto é lido quando o componente monta: chame antes da inicialização (o
  `DOMContentLoaded` acima roda antes dela, também com `defer`) ou antes do
  `new`. O que já está na tela não muda.
- A opção da instância vence o texto global: `data-placeholder`, `emptyText`,
  `prevText`/`nextText`, `texts` do upload.
- Onde a frase depende de um número ou de um nome, o valor é uma função:
  ``upload: { others: (n) => `At most ${n} files` }``.
- Grupos: `datepicker`, `select`, `colorpicker`, `upload`, `mask`, `toast`,
  `modal`, `drawer`, `table`, `pagination`, `editor`, `prose`.
  `Tucano.getTexts()` devolve uma cópia dos textos atuais, e a lista de chaves
  com o padrão de cada uma está no `llms.txt`, em "Textos (Tucano.setTexts)".

---

## Opções

| Opção | Padrão | O que faz |
| --- | --- | --- |
| `mode` | `'single'` | `'single'` ou `'range'` |
| `time` | `false` | Adiciona seletor de hora |
| `seconds` | `false` | Inclui coluna de segundos |
| `minuteStep` | `5` | Degrau da coluna de minutos |
| `locale` | `<html lang>` | Nomes, ordem dia/mês e início da semana |
| `format` | do locale | Formato de exibição (`dd/MM/yyyy`) |
| `firstDayOfWeek` | do locale | `0` domingo … `6` sábado |
| `months` | `2` em range | Quantos meses lado a lado |
| `min` / `max` | `null` | Limites (Date ou `'yyyy-mm-dd'`) |
| `disabledDates` | `null` | `(date) => boolean` |
| `presets` | `false` | `true` liga os atalhos de período, ou passe um array `{ label, value() }` |
| `autoApply` | `!time` | Fecha ao concluir a seleção |
| `clearable` | `true` | Mostra "Limpar" |
| `weekNumbers` | `false` | Coluna de número da semana |
| `placement` | `'bottom-center'` | Lado e alinhamento do popover. Centraliza no campo; se não couber, desliza para dentro da tela e vira para cima quando falta espaço embaixo. `bottom-start`, `bottom-end`, `top-center`... |
| `isoName` | `name` do input | `name` do input hidden em ISO |
| `native` | `false` | Seletor nativo do sistema: `true` sempre, `'auto'` em tela de toque (só em JS) |

### Eventos

`tucano:change` borbulha a partir do input — use isso em vez de `onChange` quando
não controlar a ordem de inicialização:

```js
document.addEventListener('tucano:change', (e) => {
  console.log(e.detail.value, e.detail.iso);
});
```

O evento sai do elemento que guarda o valor. No select, na máscara e no upload
esse elemento é o próprio campo com `name`. No date picker não: ele move o
`name` para um `<input type="hidden">` com o valor ISO — o campo visível fica
sem `name`, para o servidor receber ISO e não o texto formatado. Ali use
`e.detail.iso`.

Um `change` nativo também é disparado, então validação de formulário e HTMX
enxergam o valor normalmente.

---

## Select

Enriquece um `<select>` nativo. O elemento original continua no DOM guardando o
valor, então `name`, `multiple` e `required` seguem funcionando e o Django recebe
exatamente o que receberia sem o componente — inclusive `getlist()` no múltiplo.

```html
<select name="state" data-tuc-select>
  <option value="">Selecione...</option>
  <option value="SP">São Paulo</option>
</select>

<select name="tags" data-tuc-select multiple data-placeholder="Adicione...">
  <option value="django">Django</option>
</select>
```

```js
const s = new Tucano.Select('#state', { search: true, maxItems: 3 });
s.getValue();          // 'SP'  (array no mode multiple)
s.setValue(['a','b']);
s.refresh();           // releia as <option> depois de um swap do HTMX
```

| Opção | Padrão | O que faz |
| --- | --- | --- |
| `search` | auto a partir de 6 opções | Campo de busca |
| `placeholder` | `<option value="">` ou "Selecione..." | Texto vazio |
| `emptyText` | `'Nenhum resultado'` | Sem correspondência |
| `clearable` | `true` | Botão de limpar |
| `maxItems` | `null` | Limite no modo múltiplo |
| `closeOnSelect` | `true` simples / `false` múltiplo | Fecha ao escolher |
| `wrapTags` | `false` | `true` deixa o campo crescer em várias linhas |

A busca ignora acentos: `sao` encontra "São Paulo". `<optgroup>` vira cabeçalho
de grupo e `<option disabled>` fica desabilitada.

O campo tem **altura fixa e linha única** de propósito — com tags quebrando linha
o campo cresce e desalinha o formulário. O excesso rola na horizontal; use
`wrapTags: true` se preferir o contrário.

Teclado: setas navegam, `Enter` escolhe, `Esc` fecha, `Backspace` com a busca
vazia remove a última tag (no simples, `Backspace` e `Delete` limpam o valor,
como o X), `Home`/`End` vão às pontas.

---

## Color picker

```html
<input type="text" name="color" value="#4f46e5" data-tuc-color>
<input type="text" name="brand" value="#0d9488" data-tuc-color data-alpha="false"
       data-swatches="#0a0a0a,#ea580c,#16a34a">
```

```js
const c = new Tucano.ColorPicker('#color', { format: 'rgb', alpha: false });
c.getValue();   // 'rgb(79, 70, 229)'
c.getRgb();     // { r, g, b, a }
```

| Opção | Padrão | O que faz |
| --- | --- | --- |
| `format` | `'hex'` | `'hex'`, `'rgb'` ou `'hsl'` |
| `alpha` | `true` | Trilha de opacidade (hex vira 8 dígitos) |
| `swatches` | paleta interna | Array de cores, ou `false` para esconder |
| `placement` | `'bottom-center'` | Centralizado no campo, deslizando para dentro da tela nas bordas |

Aceita `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()` e
`hsla()` na entrada. Texto inválido não zera a cor — volta para o valor atual.
Onde o navegador oferece a API `EyeDropper`, aparece um conta-gotas para capturar
cor da tela.

O estado interno é HSVA, não RGB: converter a cada movimento perderia a matiz
quando a saturação chega a zero (todo cinza viraria vermelho ao clarear).

A amostra e o valor vivem num controle só (`.tuc-color-field`), com a mesma
altura, raio e anel de foco do Select — os três componentes leem como a mesma
família. O `<input>` original continua sendo quem guarda o valor e o `name`.

---

## Upload

Dois lugares, escolhidos pela presença de `url`.

**No formulário** (sem `url`): os arquivos ficam no `<input type="file">` e sobem
no submit, então o servidor recebe em `request.FILES` como sempre.

**Direto** (com `url`): cada arquivo sobe na hora, com barra própria, cancelar e
repetir. O formulário posta só os ids devolvidos. Funciona também sem `<form>`.

```html
<input type="file" name="attachments" multiple data-tuc-upload data-max-size="5mb">

<input type="file" name="photos" multiple accept="image/*"
       data-tuc-upload data-url="/upload/">
```

```python
def upload_temp(request):
    uploaded = request.FILES["file"]
    temp = TempUpload.objects.create(file=uploaded)
    return JsonResponse({"id": str(temp.id), "url": temp.file.url})
```

| Atributo | Padrão | O que faz |
| --- | --- | --- |
| `data-url` | — | Liga o modo direto |
| `data-max-size` | — | `5mb`, `500kb` ou bytes |
| `data-max-files` | — | Limite de arquivos |
| `data-field-name` | `file` | Nome do campo no POST |
| `data-response-id` | `id` | Chave do id na resposta JSON |
| `data-response-url` | `url` | Chave da url na resposta |
| `data-delete-url` | — | Remover chama `DELETE` aqui |
| `data-auto-upload` | `true` | `false` espera `uploadAll()` |
| `data-csrf` | `true` | `false` não envia o token |

`accept` e `multiple` são os atributos nativos do input; o componente respeita
os dois, e revalida no arrastar — onde o sistema operacional não filtra.

```html
<input type="file" accept=".pdf,.docx" data-tuc-upload>
<input type="file" accept="image/*" data-tuc-upload>
<input type="file" accept=".pdf,image/*" multiple data-tuc-upload>
```

**Prefira extensão a tipo MIME.** O navegador nem sempre sabe o tipo: um `.csv`
costuma chegar com `type` vazio, e aí `accept="text/csv"` recusa enquanto
`accept=".csv"` aceita. Para imagem e PDF o MIME é confiável.

**Não há progresso por arquivo no modo formulário.** Num submit comum o
navegador envia tudo num bloco só e não reporta o andamento — é como o HTML
funciona, não uma limitação daqui. Progresso exige que cada arquivo suba na
hora, que é o modo direto.

O token CSRF vai em `X-CSRFToken`, lido do cookie. E o modo direto precisa de
limpeza: arquivos enviados por alguém que fechou a aba sem salvar ficam no
servidor.

## Botão

Não é componente com JavaScript, é só classe — um `<button>` continua sendo um
`<button>`. Nasceu do que os componentes precisavam por dentro e ficou
disponível para o projeto.

```html
<button class="tuc-btn is-primary">Salvar</button>
<button class="tuc-btn is-outline is-sm">Cancelar</button>
<button class="tuc-btn is-ghost is-icon" aria-label="Fechar">…</button>
```

Variantes: `is-primary`, `is-outline`, `is-ghost`, `is-danger`, `is-link`.
Tamanhos: `is-sm`, `is-lg`, `is-icon`, `is-block`.

**Botão, select e campo de cor têm a mesma altura**, porque saem do mesmo
`--tuc-control-height` — 38px, ou 44px no layout compacto, onde o alvo de toque
precisa ser maior. Raio e borda vêm de `--tuc-radius-md` e `--tuc-border-width`.

Desabilitado mostra o cursor de bloqueio e não reage ao hover. Sem
`pointer-events: none`: sem receber ponteiro o elemento não troca o cursor, e a
pessoa fica sem sinal de que o botão não responde. Num `<button disabled>` o
navegador já impede o clique.

## Toast

```js
Tucano.toast('Salvo');
Tucano.toast.error('Não foi possível salvar');
Tucano.toast({
  type: 'success', title: 'Contrato excluído', text: 'Ainda dá para voltar atrás.',
  action: { text: 'Desfazer', onClick: () => restore() },
  position: 'bottom-end', duration: null,
});
```

Tipos: `info`, `success`, `warning`, `error`, `loading`. Posições: `top-start`,
`top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end` — o
padrão é `bottom-end`. No celular o toast ocupa a largura da tela e entra pelo
eixo vertical, seja qual for a posição escolhida.

### Operação assíncrona

O tipo `loading` não fecha sozinho: quem o encerra é o fim da operação. E ele
vira o resultado **no mesmo cartão**, em vez de fechar um e abrir outro:

```js
const t = Tucano.toast.loading('Enviando arquivo...');
await send();
t.update({ type: 'success', text: 'Arquivo enviado' });

// ou entregue a promessa e deixe os três estados por conta dela
Tucano.toast.promise(fetch(url), {
  loading: 'Enviando arquivo...',
  success: (r) => `Enviado (${r.status})`,
  error: 'Não deu para enviar',
});
```

### Com o Django, sem JavaScript

```html
{% for m in messages %}
  <div data-tuc-toast data-type="{{ m.tags }}">{{ m }}</div>
{% endfor %}
```

`debug`, `info`, `success`, `warning` e `error` são traduzidos sozinhos.

### Com o HTMX, disparado pelo servidor

```python
return HttpResponse(headers={"HX-Trigger": json.dumps(
    {"tucano:toast": {"type": "success", "text": "Contrato salvo"}})})
```

Os toasts **empilham sobrepostos** e abrem em leque quando o ponteiro entra ou
algo dentro recebe foco. A posição de cada um vem da altura real medida no DOM,
não de um valor fixo: toast com título é mais alto que um sem, e chutar
desalinha a pilha.

O `aria-live` fica no container, criado antes de qualquer mensagem — se a região
nascer junto com o texto, o leitor de tela não anuncia. Erro vai para uma região
`assertive` separada. O relógio pausa quando o ponteiro entra ou algo dentro
recebe foco, senão o aviso some no instante em que a pessoa vai clicar no
"Desfazer".

## Modal

Sobre o `<dialog>` nativo — `showModal()` põe o elemento na *top layer*, acima de
qualquer `z-index` e imune a ancestral com `overflow: hidden` ou `transform`.
Armadilha de foco, devolução do foco e `Escape` vêm junto.

```js
Tucano.modal({
  title: 'Excluir contrato',
  text: 'Esta ação não pode ser desfeita.',
  tone: 'danger',      // default | danger | success | warning — muda o brilho do fundo
  size: 'md',      // sm | md | lg | full
  sheet: true,        // no mobile sobe do rodapé
  actions: [
    { text: 'Cancelar', variant: 'outline' },
    { text: 'Excluir', variant: 'danger', onClick: () => deleteContract() },
  ],
});

// confirmação como promessa; fechar por fora resolve false
if (await Tucano.confirm({ title: 'Excluir contrato?' })) deleteContract();
```

## Baixar só o que se usa

Pelo CDN vem tudo — um arquivo, sem build, e o navegador guarda em cache por um
ano. É a escolha certa para a maioria dos casos.

Quem empacota pode levar menos, importando de `tucano`:

```js
import { DatePicker, Select } from 'tucano';   // 14,5 KB em vez de 39
```

| o que se importa | gzip |
| --- | --- |
| só o date picker | 11,0 KB |
| só o select | 5,9 KB |
| só o toast | 2,7 KB |
| date picker + select | 14,5 KB |
| tudo | 38,6 KB |

Não é linear porque o núcleo — posicionamento, datas, utilidades de DOM — é
compartilhado: o primeiro componente paga por ele e os seguintes saem mais
baratos.

Ao importar de `tucano`, os campos **não** se inicializam sozinhos: chame
`Tucano.init(document)` uma vez, ou importe `tucano/auto`, que faz isso e
também escuta os swaps do HTMX.

```js
import 'tucano/auto';   // comporta-se como o script do CDN
```


## Acordeão

Sobre `<details>`/`<summary>` nativos: teclado, semântica e estado vêm do
elemento, e ele abre e fecha antes de o JavaScript carregar. O componente entra
só onde o nativo não vai — animar.

```html
<div data-tuc-accordion data-single="true">
  <details open>
    <summary>Projetos</summary>
    <p>Listar, criar e acompanhar vistorias.</p>
  </details>
</div>
```

`data-single="true"` recolhe os outros ao abrir um. Para menu lateral,
`.tuc-accordion.is-plain` tira as divisórias e deixa o título com cara de rótulo
de grupo.

## Editor de texto

Mostra o resultado enquanto se escreve, com tabela e bloco de código. O
`<textarea>` continua dono do valor, então `name`, `required` e o POST do Django
funcionam sem nada especial:

```html
<textarea name="description" data-tuc-editor>{{ form.description.value|default:"" }}</textarea>
```

Colar e arrastar entram sempre como texto puro — é o que evita o HTML do Word.
Editor vazio vale `''`, e não um parágrafo em branco, então `required` funciona;
e endereço de link sem esquema ganha `https://`. E a saída
passa por uma peneira de tags a cada leitura: sobrevivem parágrafo, título,
negrito, itálico, sublinhado, listas, citação, código, link e tabela. Atributo
nenhum passa, exceto o `href` com destino aceitável.

**Sanitize no servidor antes de publicar.** O HTML chega por POST e ninguém
garante que veio deste editor.

### Na exibição

O que é salvo é HTML sem classe, para servir a qualquer servidor. Envolver a
saída em `.tuc-prose` devolve a aparência que a pessoa viu ao escrever — são as
mesmas regras de CSS da área de edição:

```html
<div class="tuc-prose">{{ project.description|safe }}</div>
```

O código publicado é colorido pelo `init()`. O destacador não conhece linguagem
nenhuma: reconhece comentário, texto entre aspas, número, tag, atributo e chaves
de template, o que funciona em qualquer linguagem por 2 KB.

## Teclado nos campos que abrem painel

Chegar de `Tab` não abre painel nenhum — quem tabula por um formulário até o
botão de salvar não deveria levar um calendário na cara a cada campo, com o
painel cobrindo o campo seguinte. É a regra do `<select>` nativo e do ARIA APG.

Abrir é sempre explícito:

| | abre com |
|---|---|
| Date picker | `↓`, `Espaço`, clique |
| Select | `↓`, `Enter`, `Espaço`, clique |
| Color picker | `↓`, clique — ou `Enter`/`Espaço` na amostra, que é um `<button>` |

No campo de data o `Enter` fica de fora de propósito: ele é um campo de texto
dentro de um `<form>`, e `Enter` num campo de texto envia o formulário — é o que
se espera depois de digitar a data. Ali quem abre é o `Espaço`, e só com o campo
vazio, porque em modo com hora se digita `07/09/2026 14:30`.

## Utilitários

```js
Tucano.sanitize(html)   // aplica a peneira de tags do editor
Tucano.highlight(code)  // devolve o código com marcação de cor
Tucano.init(node)       // inicializa data-tuc-* num trecho novo de HTML
```

Os três módulos que os componentes usam por dentro também saem prontos, porque
num CRUD eles resolvem o que sempre falta — validar um CPF na tela antes de
mandar pro servidor, formatar uma data, decidir se um texto fica legível sobre
uma cor escolhida pelo usuário.

```js
Tucano.mask.validateCpfCnpj('123.456.789-01')   // false
Tucano.mask.applyCurrency('12345', { currency: 'BRL' })  // 'R$ 123,45'
Tucano.mask.maskEmail('contato@empresa.com.br')  // 'c••••••@empresa.com.br'

Tucano.dates.format(new Date(), 'dd/MM/yyyy')
Tucano.dates.parseUserInput('7/9/26')            // Date
Tucano.dates.addMonths(new Date(), -1)

Tucano.color.parseColor('#4f46e5')               // { h, s, v, a }
Tucano.color.isDark('#4f46e5')                   // true — escolhe texto claro
```

| módulo | serve para |
|---|---|
| `Tucano.mask` | CPF, CNPJ, moeda, telefone; aplicar e tirar máscara; ocultar dado sensível |
| `Tucano.dates` | ler, formatar, comparar e caminhar por datas, respeitando o locale |
| `Tucano.color` | converter entre hex/rgb/hsv, e medir luminância |

Quem instala pelo npm e não usa nada disso não paga nada por eles — importar só
o `Toast` custa 3 KB, com os três módulos fora do pacote.

## Tabela

O `<table>` do template continua sendo a fonte da verdade, e a célula é livre.

```html
<table data-tuc-table data-selectable class="is-striped">
  <thead><tr>
    <th data-sort="text" data-field="customer" style="width:38%">Cliente</th>
    <th data-sort="number" data-field="amount" class="is-number">Valor</th>
    <th data-sort="none" class="tuc-table__actions">Ações</th>
  </tr></thead>
  <tbody>
    <tr data-id="{{ obj.pk }}">
      <td>
        <span class="tuc-table__user">
          <span class="tuc-table__avatar"><img src="{{ obj.photo.url }}" alt=""></span>
          <span>{{ obj.name }}<span class="tuc-table__sub">{{ obj.doc }}</span></span>
        </span>
      </td>
      <td class="is-number" data-sort-value="{{ obj.amount }}">{{ obj.amount|floatformat:2 }}</td>
      <td class="tuc-table__actions">
        <button class="tuc-btn is-outline is-icon is-sm">...</button>
      </td>
    </tr>
  </tbody>
</table>
```

Para a célula: `.tuc-table__user` + `__avatar` + `__sub` (foto ou iniciais, nome e
uma segunda linha), `.tuc-badge` com `is-success`/`is-warning`/`is-danger`/`is-info`,
`.tuc-table__actions` (encosta à direita, com os botões do sistema) e
`.is-number` (alinha à direita com dígitos de largura fixa) e `.tuc-table__empty` para a célula de estado vazio. Para a segunda linha
cortar com reticência, dê largura à coluna. Variantes: `is-striped`,
`is-bordered`, `is-compact`.

Ordenação: `data-sort` aceita `text`, `number`, `date`, `none`;
`data-sort-value` guarda o valor cru quando o texto exibido não ordena bem.

**Ordenar é trabalho do servidor, e esse é o padrão.** Numa lista paginada,
reordenar as vinte linhas da tela produz uma ordem falsa — o maior valor real
pode estar na página 7. Por isso o cabeçalho é um `<a>` para a mesma URL com
`?sort=` e `?dir=`: funciona sem JavaScript, funciona com `hx-boost`, abre em
outra aba, e a seta continua certa depois do reload porque o estado sai da query
string. Trocar a ordem volta para a página 1. Na sua view, `?sort` e `?dir`
entram no `order_by()` antes do `Paginator`.

`data-sort-mode="client"` ordena na própria tela — para tabela pequena e
completa, sem paginação.

A seleção é um formulário de verdade: cada linha ganha um
`<input type="checkbox" name="selected" value="{{ data-id }}">`, então chega como
`request.POST.getlist('selected')`.

## Paginação

```html
<div data-tuc-pagination
     data-page="{{ page_obj.number }}"
     data-pages="{{ page_obj.paginator.num_pages }}"></div>
```

Atributos: `data-param` (o nome na query string, padrão `page`), `data-around` e
`data-edges` para quantos números aparecem ao redor da atual e nas pontas,
`data-prev-text`, `data-next-text`. Alinhamento com `is-center` ou `is-end`.

Os itens são `.tuc-btn` — os mesmos botões do resto da biblioteca, não um
segundo desenho — e são `<a>` com `href` de verdade. O link preserva o resto da
query string, então filtro, busca e ordem não se perdem ao virar a página; e é
isso que faz o botão do meio abrir em outra aba, o voltar do navegador
funcionar e o buscador indexar. Quem precisa interceptar passa `onChange`.

A ponta desativada é `<span>`, não `<a>` sem `href`, que continuaria no caminho
do `Tab` sendo anunciado como link. Com uma página só, nada é renderizado.

## Etiqueta de estado

```html
<span class="tuc-badge is-success">Aprovado</span>
<span class="tuc-badge is-warning">Em análise</span>
<span class="tuc-badge is-danger">Vencido</span>
<span class="tuc-badge">Rascunho</span>
```

Nasceu para a coluna "situação" de uma tabela, mas não depende dela: vale em
card, em lista, ao lado de um título. Tons: `is-success`, `is-warning`,
`is-danger`, `is-info`; sem tom fica neutra, e `is-plain` tira o pontinho.

O fundo é suave com texto forte, e não preenchido: numa lista de vinte linhas,
vinte etiquetas sólidas competem com o conteúdo e a tabela vira um semáforo.

## Formulário

```html
<label class="tuc-label is-required" for="doc">CNPJ</label>
<input id="doc" name="doc" data-tuc-mask="cnpj" aria-invalid="true" aria-describedby="doc-e">
<p class="tuc-error" id="doc-e">CNPJ inválido.</p>

<label class="tuc-label" for="plan">Plano</label>
<select class="tuc-input" id="plan" name="plan"><option>Mensal</option><option>Anual</option></select>
<p class="tuc-hint">Dá para trocar depois.</p>
```

O campo com erro é marcado por `aria-invalid="true"`, e não por uma classe: é o
atributo que o leitor de tela anuncia, e **o Django 5 já o escreve** em todo campo
que voltou com erro. A borda e o anel vermelhos valem para todos os campos da
biblioteca — select, cor, data, máscara, editor, upload, caixa e opção —, mesmo os
que o script troca por um controle próprio, porque o atributo fica no elemento
nativo e o CSS alcança o controle a partir dele.

```django
<label class="tuc-label" for="{{ field.id_for_label }}">{{ field.label }}</label>
{{ field }}
{% if field.help_text %}<p class="tuc-hint" id="{{ field.auto_id }}_helptext">{{ field.help_text }}</p>{% endif %}
{% for error in field.errors %}<p class="tuc-error">{{ error }}</p>{% endfor %}
```

A validação do navegador (`required`, `type="email"`) pinta também, por
`:user-invalid` — só depois que a pessoa mexeu no campo, para o formulário não
nascer vermelho. `.tuc-input` vale em `<input>`, `<textarea>` e `<select>` nativo,
este para a lista curta em que o Select com busca seria exagero.

## Caixa, opção e chave

```html
<label class="tuc-choice">
  <input type="checkbox" class="tuc-check" name="invoice"> Nota fiscal por e-mail
</label>

<fieldset class="tuc-choices">
  <legend>Entrega</legend>
  <label class="tuc-choice">
    <input type="radio" class="tuc-radio" name="shipping" value="standard" checked>
    <span>Normal <span class="tuc-choice__hint">Até 7 dias úteis</span></span>
  </label>
</fieldset>

<label class="tuc-choice is-end">
  <input type="checkbox" role="switch" class="tuc-switch"> Avisos por e-mail
</label>
```

Desenhados, e não `accent-color` — essa entrega o azul do sistema, que muda entre
macOS e Windows, nunca tem o raio do resto dos campos e só pinta a caixa: a opção
ao lado continuaria com o círculo do sistema. Continuam sendo `<input>` de
verdade: valor, `name`, `required` e estado misto são os nativos. A caixa é a que
a tabela usa na seleção em massa.

`.tuc-choice` é o `<label>` que alinha o controle à primeira linha do texto, com
`.tuc-choice__hint` para a descrição e `is-end` para o controle à direita.
`.tuc-choices` empilha um grupo — feito para `<fieldset>`, que dá o nome do grupo
ao leitor de tela — e `is-inline` põe lado a lado.

A chave precisa de `role="switch"` no template, porque CSS não põe papel: é ele
que faz o leitor de tela anunciar "chave, ligada". Use chave para o que tem
efeito na hora e caixa para o que só vale ao salvar.


## Menu suspenso

```html
<button data-tuc-dropdown="#actions">Ações</button>

<div class="tuc-dropdown" id="actions" hidden>
  <div class="tuc-dropdown__label">Contrato</div>
  <button class="tuc-dropdown__item">
    <span class="tuc-dropdown__text">Editar</span>
    <span class="tuc-dropdown__shortcut">⌘E</span>
  </button>
  <hr class="tuc-dropdown__separator">
  <button class="tuc-dropdown__item is-danger">
    <span class="tuc-dropdown__text">Excluir</span>
  </button>
</div>
```

O `hidden` importa: sem ele o menu aparece no meio da página até o script rodar.

Em JavaScript, quando os itens são calculados na hora:

```js
new Tucano.Dropdown('#actions', {
  placement: 'bottom-start',    // as mesmas posições do tooltip
  items: [
    { label: 'Contrato' },
    { text: 'Editar', shortcut: '⌘E', onClick: () => editContract() },
    { text: 'Abrir', href: '/contracts/12/' },
    { separator: true },
    { text: 'Excluir', variant: 'danger', onClick: () => deleteContract() },
  ],
});
```

O item vira `<a>` quando tem `href`, e `<button>` no resto. Abrir leva o foco ao
primeiro item, as setas andam entre eles e fechar devolve o foco ao gatilho; os
itens ficam com `tabindex="-1"` porque dentro de um menu quem navega é a seta, e
não o `Tab`.

## Abas

```html
<div class="tuc-tabs" data-tuc-tabs>
  <div class="tuc-tabs__list">
    <button class="tuc-tabs__tab" aria-selected="true">Dados</button>
    <button class="tuc-tabs__tab">Endereço</button>
  </div>
  <div class="tuc-tabs__panel">Conteúdo</div>
  <div class="tuc-tabs__panel" hidden>Conteúdo</div>
</div>
```

O template traz as classes, a aba inicial com `aria-selected="true"` e os outros
painéis com `hidden`, então a página nasce desenhada antes do script. O JavaScript
põe `role="tab"`, `aria-controls` e o teclado do ARIA APG: a lista é uma parada só
do `Tab`, e dentro dela andam `←` `→` `Home` `End`, pulando aba desativada.
`is-segmented` tem a altura de um campo, para ficar ao lado de um filtro.

| Opção | Padrão | Para quê |
| --- | --- | --- |
| `selected` | `null` | Índice da aba inicial; sem ele, a marcada ou a primeira |
| `manual` | `false` | Setas só movem o foco; `Enter`/`Espaço` abrem — para painel que carrega por HTMX |
| `onChange` | `null` | `(index, detail)` a cada troca |

```js
const tabs = new Tucano.Tabs('#customer', { manual: true });
tabs.select(2);
```

Cada troca dispara `tucano:change` no elemento, com `{ value, tab, panel, instance }`.

## Aviso

```html
<div class="tuc-alert is-warning">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>
  <div class="tuc-alert__body">
    <p class="tuc-alert__title">Assinatura vence em 3 dias</p>
    <p>Renove para não perder o acesso.</p>
  </div>
  <div class="tuc-alert__actions"><a class="tuc-btn is-outline is-sm" href="/subscription/">Renovar</a></div>
</div>
```

Para o que continua valendo enquanto a pessoa está na tela — o toast é para o que
acabou de acontecer, e some. Tons: `is-info`, `is-success`, `is-warning`,
`is-danger`; sem tom, neutro. As ações são os botões do sistema. Use
`role="alert"` só no aviso que aparece depois do carregamento; o que já vem no
HTML é lido com a página.

## Carregando

```html
<button class="tuc-btn is-primary" aria-busy="true" disabled>
  <span class="tuc-spinner"></span> Salvando
</button>

<span class="tuc-spinner htmx-indicator"></span>

<div class="tuc-skeleton" style="width:60%"></div>
```

Spinner para a ação que a pessoa espera; esqueleto para o conteúdo que vai
chegar, com o espaço já reservado. O spinner mede em `em` e pinta com
`currentColor`, então dentro de um botão sai do tamanho do ícone e da cor do texto.
`is-lg` aumenta; `.tuc-skeleton.is-circle` faz o avatar. Com o HTMX,
`htmx-indicator` junto do spinner já o mostra só durante a requisição.

## Linha do tempo

```html
<ol class="tuc-timeline">
  <li class="tuc-timeline__item is-success is-filled">
    <div class="tuc-timeline__head">
      <p class="tuc-timeline__title">Contrato assinado</p>
      <time class="tuc-timeline__time" datetime="2026-09-12">12/09/2026</time>
    </div>
    <div class="tuc-timeline__body">As duas partes assinaram.</div>
  </li>
  <li class="tuc-timeline__item">
    <div class="tuc-timeline__head">
      <p class="tuc-timeline__title">Enviado para assinatura</p>
      <time class="tuc-timeline__time" datetime="2026-09-10">10/09/2026</time>
    </div>
  </li>
</ol>
```

Histórico em ordem — andamento de um pedido, o que aconteceu com um contrato,
versões de um changelog. É um `<ol>`, então o leitor de tela anuncia a posição de
cada item. Ponto e trilho são desenhados pela classe; o template só traz o
conteúdo. Tons no item: `is-accent`, `is-success`, `is-warning`, `is-danger`,
`is-info`; `is-filled` enche o ponto. Para um ícone no lugar do ponto, ponha
`<span class="tuc-timeline__icon"><svg>…</svg></span>` como primeiro filho do item.

## Gaveta (off-canvas)

Painel que entra por uma borda e ocupa o eixo inteiro dela. Divide com o modal a
mecânica do `<dialog>` — *top layer*, foco preso, `Esc`, foco devolvido — então
uma correção num deles vale para o outro:

```js
Tucano.drawer({ title: 'Filtros', side: 'right' })  // left | right | top | bottom
  .content(form);
```

Nas laterais o `size` é largura de coluna (18, 24 ou 34rem) e no celular ela
para em 85% da tela. Do servidor, `<dialog class="tuc-drawer is-right">` no
template com `data-tuc-drawer="#id"` no gatilho.

Com conteúdo do servidor, o `<dialog>` mora no template e o Tucano só abre,
fecha e anima:

```html
<dialog class="tuc-modal is-md" id="delete">
  <div class="tuc-modal__panel">
    <form method="post">{% csrf_token %} ... </form>
    <button data-tuc-modal-close>Cancelar</button>
  </div>
</dialog>
<button data-tuc-modal="#delete">Excluir</button>
```

## Tooltip

Lados `top`, `right`, `bottom`, `left` e alinhamentos `start`, `center`, `end` —
as mesmas do shadcn, e o padrão também é o dele, `top-center`. Quando o lado
pedido não cabe, a dica vira para o oposto e a seta acompanha. Se o gatilho sai
da viewport, a dica fecha em vez de ficar presa na tela.

A cor sai por duas variáveis, e a seta lê as mesmas:

```css
.tip-accent { --tuc-tip-bg: #4f46e5; --tuc-tip-fg: #fff; }
```

```html
<button data-tuc-tip="Gera o PDF com o layout atual">Exportar</button>
<button data-tuc-tip title="Vem do title">Do title</button>
<button data-tuc-tip="..." data-placement="right-center" data-delay="600">
<button data-tuc-tip="..." data-tip-class="tip-accent">
```

Aparece no ponteiro **e** no foco do teclado. No celular não existe hover, então
o toque abre e o toque fora fecha — tooltip que só escuta `mouseover`
simplesmente nunca aparece no telefone. `Escape` fecha mesmo com o ponteiro
parado em cima, como pede a WCAG 1.4.13.

O texto vai em `aria-describedby`. Um `title` é aproveitado quando o elemento
tem `data-tuc-tip` vazio, e removido para a dica nativa não aparecer por cima.

## Máscaras

Formata enquanto se digita, valida documento e esconde dado sensível. Não
envolve nem substitui o input — é comportamento puro.

```html
<input name="cpf"       data-tuc-mask="cpf" data-validate="true">
<input name="cnpj"      data-tuc-mask="cnpj">
<input name="document"   data-tuc-mask="cpf-cnpj">
<input name="phone"      data-tuc-mask="phone">
<input name="amount"     data-tuc-mask="brl">
<input name="cep"       data-tuc-mask="cep">
<input                  data-tuc-mask="##/##">   <!-- template livre -->
```

Formatos: `cpf`, `cnpj`, `cnpj-numeric`, `cpf-cnpj`, `phone`, `mobile`,
`cep`, `brl`, `currency`, `date`, `time`, `card`. No gabarito livre, `#` é
dígito, `A` é letra e `*` aceita os dois.

**CNPJ alfanumérico.** O formato novo mantém as 14 posições e a mesma máscara:
as 12 primeiras aceitam letras, as 2 últimas seguem numéricas, e o dígito
verificador usa o código ASCII menos 48. `cnpj` já aceita os dois formatos;
`cnpj-numeric` recusa letras. Confirme a vigência na Nota Técnica da Receita
antes de exigir em produção.

### Validação

Com `data-validate`, o dígito verificador é conferido ao sair do campo e o
navegador barra o submit sozinho via `setCustomValidity` — sem escrever nada.

### Campo sensível

```html
<input name="cpf" value="111.444.777-35" data-tuc-mask="cpf" data-tuc-reveal>
<input type="password" name="password" data-tuc-reveal>
```

Nasce oculto quando já tem conteúdo, mostrando `•••.•••.•••-35`. O valor real
vai num `<input type="hidden">` com o mesmo `name`, então o servidor recebe o
dado completo — o que fica escondido é só a tela. Print, gravação de suporte e
quem olha por cima do ombro deixam de expor o dado por padrão.

Em `type="password"` o olho apenas alterna o `type`, como se espera, e a senha
nasce sempre oculta, mesmo vazia.

Funciona em qualquer campo, não só documento. O modo de esconder muda o que
fica à mostra:

| Modo | Quando | Resultado |
| --- | --- | --- |
| `end` (padrão) | Documento, cartão, conta, telefone | `•••• •••• •••• 1234` |
| `email` | Automático em `type="email"` | `j•••••••••@empresa.com.br` |
| `all` | Senha, token, chave de API | `••••••••••••••••` |

```html
<input data-tuc-reveal data-reveal-visible="4">
<input data-tuc-reveal="all">
<input type="email" data-tuc-reveal>
```

O e-mail esconde ao contrário do resto de propósito: o domínio reconhece a
conta, a parte local identifica a pessoa. Guardar o fim revelaria `om.br` e
esconderia o útil.

Também vale em texto solto na tela, fora de campo — o CPF num perfil, o cartão
numa tabela —, nos mesmos modos e junto com `data-tuc-format`:

```html
<td><span data-tuc-format="cpf" data-tuc-reveal>11144477735</span></td>
<span data-tuc-reveal="all">sk_live_a1b2c3d4e5f6</span>
```

Na tela, esconder é só visual: o valor inteiro continua no HTML. O que não pode
chegar ao navegador precisa ser escondido no servidor.

### Só para exibir

```html
<span data-tuc-format="cpf">12345678901</span>      <!-- 123.456.789-01 -->
<span data-tuc-format="brl">1234.5</span>          <!-- R$ 1.234,50 -->
```

Pela API: `Tucano.mask.validateCPF()`, `validateCNPJ()`, `format(v, 'cpf')`.

## Máscara do campo

O campo digitável tem máscara, derivada do próprio formato de exibição — então
ela acompanha o locale sozinha, sem configuração:

| Modo | Máscara |
| --- | --- |
| data | `dd/mm/aaaa` |
| data + hora | `dd/mm/aaaa hh:mm` |
| período | `dd/mm/aaaa — dd/mm/aaaa` |
| período + hora | `dd/mm/aaaa hh:mm — dd/mm/aaaa hh:mm` |

Você digita só números; barras, dois-pontos e o travessão do período entram
sozinhos. Colar `abc25xx12--2026zz` resulta em `25/12/2026` — o lixo é
descartado e sobram os dígitos. Apagar em cima de um separador remove o dígito
vizinho, em vez de travar.

Com a máscara completa o calendário já pula para a data digitada e a marca, sem
fechar. O valor é confirmado no `Enter` ou ao sair do campo.

Formatos com nome de mês (`MMMM`) ou `AM/PM` não são mascaráveis; nesses casos o
campo fica como texto livre e vale o parse tolerante, que aceita `25/12/26`,
`25-12-2026`, `2512` e `12/25/2026 2:05 pm`.

---

## Celular

O painel é o mesmo do desktop, adaptado ao toque: texto de 16px, células
maiores e, no modo período, os dois meses empilhados.

Os 16px não são estética: **o Safari do iOS aplica zoom automático ao focar
qualquer campo com menos de 16px**, e a página inteira salta.

O seletor do sistema (a roda do iOS, o diálogo do Android) é opt-in:

```js
native: false     // padrão: o painel em todo lugar
native: 'auto'    // seletor do sistema onde o ponteiro é de toque
native: true      // sempre o seletor do sistema
```

Por atributo: `data-native="true"`.

Ele **não altera o `type` do seu input** — um input nativo transparente fica
por cima do campo, então o estilo que você aplicou continua valendo. Período
nunca usa nativo: não existe seletor de intervalo em HTML.

---

## Django

O input visível mostra a data no formato do locale; um `<input type="hidden">`
com o mesmo `name` carrega o valor em ISO. É esse que chega no `request.POST`:

```html
<input type="text" name="event_date" data-tuc-datepicker data-time="true">
```

```
POST  event_date = 2026-12-25T09:30
```

`DateField` e `DateTimeField` do Django fazem o parse disso sem configuração.
Em modo `range` o valor sai como `2026-03-01,2026-03-15` — separe no form:

```python
class BookingForm(forms.Form):
    period = forms.CharField()

    def clean_period(self):
        start, _, end = self.cleaned_data['period'].partition(',')
        return date.fromisoformat(start), date.fromisoformat(end)
```

---

## Tema

Toda cor, raio e sombra é variável CSS, e todas vivem em `:root`. Para mudar o
visual, sobrescreva — não precisa recompilar:

```css
:root {
  --tuc-accent: #0d9488;
  --tuc-accent-hover: #0f766e;
  --tuc-radius: 1rem;
  --tuc-cell: 2.5rem;      /* tamanho do dia no calendário */
}
```

Como são variáveis, o escopo é seu: em `:root` valem para a página inteira, e
declaradas num contêiner valem só ali dentro — útil para um painel com cor
própria.

Modo escuro segue a classe `.dark` no `<html>` (convenção do Tailwind). Para
seguir o sistema operacional, use `<html data-tuc-theme="auto">` — é opt-in de
propósito, para o componente não escurecer sozinho numa página clara.

Variáveis, agrupadas:

**Cor** — `--tuc-accent`, `--tuc-accent-hover`, `--tuc-accent-fg`,
`--tuc-accent-text` (destaque usado como cor de texto), `--tuc-thumb` (botão da
chave), `--tuc-accent-soft`, `--tuc-accent-ring`, `--tuc-bg`, `--tuc-fg`,
`--tuc-muted`, `--tuc-subtle`, `--tuc-border`, `--tuc-hover`, `--tuc-elevated`

**Tons** — `--tuc-success`, `--tuc-warning`, `--tuc-danger`, `--tuc-info` e seus `-soft`,
usados pelo toast e pela etiqueta de estado. `--tuc-danger-fill` é separado de
propósito: no tema escuro o vermelho de texto é mais claro para ter contraste, e
um botão pintado com ele ficaria pastel — o preenchimento é o mesmo nos dois
temas.

**Forma e tamanho** — `--tuc-radius`, `--tuc-radius-md`, `--tuc-radius-sm`,
`--tuc-radius-xs`, `--tuc-border-width`, `--tuc-control-height`, `--tuc-cell`,
`--tuc-swatch`, `--tuc-text`, `--tuc-font`

**Profundidade e movimento** — `--tuc-shadow`, `--tuc-ring`, `--tuc-duration`,
`--tuc-duration-lg`, `--tuc-duration-out`, `--tuc-ease`, `--tuc-ease-in`

Nenhum valor de cor, raio, borda ou altura está fixo no CSS dos componentes:
todos saem dessas variáveis.

---

## Teclado e acessibilidade

| Tecla | Ação |
| --- | --- |
| `↑ ↓ ← →` | Move o dia focado |
| `Enter` / `Espaço` | Seleciona |
| `PageUp` / `PageDown` | Mês anterior / próximo (com `Shift`: ano) |
| `Home` / `End` | Início / fim da semana |
| `Esc` | Fecha |

O painel é `role="dialog"`, a grade é `role="grid"`, cada dia tem
`aria-selected` e rótulo por extenso, e o foco fica preso no painel enquanto
aberto — voltando ao input ao fechar. `prefers-reduced-motion` desliga a
animação.

---

## Para agentes de IA

[`llms.txt`](llms.txt) tem a API completa em texto puro — aponte a IA para
`https://juniorcarlini.github.io/tucano/llms.txt`.

[`AGENTS.md`](AGENTS.md) é para quem for mexer no código da própria Tucano.

Nos projetos que **usam** a biblioteca, um `AGENTS.md` de três linhas evita que
a IA escreva um date picker do zero — o modelo está na
[documentação](https://juniorcarlini.github.io/tucano/ai/).

## Desenvolvimento

```bash
npm install
npm run build       # gera dist/
npm run serve       # build + servidor local em http://127.0.0.1:4322
```

```
src/js/core/         datas, cores, máscara, DOM, popover, diálogo, sanitize
src/js/components/   um arquivo por componente com JavaScript
src/styles/core/     reset e tokens
src/styles/components/
dist/                versionado, para o uso estático e o CDN funcionarem sem build
site/                fonte do site de documentação; index.html e <componente>/index.html são gerados
```

As classes e variáveis usam o prefixo `tuc-` para não colidir com o CSS do
projeto que consome.
