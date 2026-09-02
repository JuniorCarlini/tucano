# 🦜 Tucano

Date picker, select com busca e color picker para formulários. Sem React, sem
Alpine, sem dependência em runtime. Os estilos são escritos em Tailwind e
distribuídos já compilados — o projeto que consome não precisa de build.

**15 KB de JS + 4 KB de CSS** (minificado + gzip).

**[Documentação e exemplos ao vivo →](https://juniorcarlini.github.io/tucano/)**

| Componente | Status |
| --- | --- |
| `DatePicker` — data, período, hora, data+hora | pronto |
| `Select` — busca, multi-seleção com tags, grupos, limite | pronto |
| `ColorPicker` — HSV, hex/rgb/hsl, opacidade, paleta | pronto |

---

## Instalação

### CDN, com HTML puro

Dois arquivos e nada mais — sem npm, sem build, sem escrever JavaScript:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tucano@0.2.0/dist/tucano.min.css">
<script src="https://cdn.jsdelivr.net/npm/tucano@0.2.0/dist/tucano.min.js" defer></script>

<input type="text" name="data" data-tuc-datepicker>
<select name="uf" data-tuc-select><option>...</option></select>
<input type="text" name="cor" value="#4f46e5" data-tuc-color>
```

Funciona junto com o CDN do Tailwind sem conflito: o pacote **não** envia o
preflight, e os elementos internos têm reset próprio para não serem atingidos
pelo preflight do Tailwind nem pelo CSS do projeto.

Sem publicar no npm, o jsDelivr também serve direto do GitHub:

```html
<script src="https://cdn.jsdelivr.net/gh/SEU-USUARIO/tucano@v0.2.0/dist/tucano.min.js" defer></script>
```

Prenda sempre a versão (`@0.2.0`). `@latest` quebra sozinho quando você publicar
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
<input type="text" name="data" data-tuc-datepicker>
<input type="text" name="quando" data-tuc-datepicker data-time="true">
<input type="text" name="periodo" data-tuc-datepicker data-mode="range">
<input type="text" name="janela" data-tuc-datepicker data-mode="range" data-time="true">
```

Atributos disponíveis: `data-mode`, `data-time`, `data-seconds`,
`data-minute-step`, `data-locale`, `data-format`, `data-months`, `data-min`,
`data-max`, `data-presets`, `data-week-numbers`,
`data-iso-name`, `data-placement`.

### Por JavaScript

```js
const dp = new Tucano.DatePicker('#entrega', {
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
| `native` | `'auto'` | Seletor nativo do sistema em telas de toque (veja abaixo) |

### Eventos

`tucano:change` borbulha a partir do input — use isso em vez de `onChange` quando
não controlar a ordem de inicialização:

```js
document.addEventListener('tucano:change', (e) => {
  console.log(e.target.name, e.detail.iso, e.detail.value);
});
```

Um `change` nativo também é disparado, então validação de formulário e HTMX
enxergam o valor normalmente.

---

## Select

Enriquece um `<select>` nativo. O elemento original continua no DOM guardando o
valor, então `name`, `multiple` e `required` seguem funcionando e o Django recebe
exatamente o que receberia sem o componente — inclusive `getlist()` no múltiplo.

```html
<select name="uf" data-tuc-select>
  <option value="">Selecione...</option>
  <option value="SP">São Paulo</option>
</select>

<select name="tags" data-tuc-select multiple data-placeholder="Adicione...">
  <option value="django">Django</option>
</select>
```

```js
const s = new Tucano.Select('#uf', { search: true, maxItems: 3 });
s.getValue();          // 'SP'  (array no modo multiplo)
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
vazia remove a última tag, `Home`/`End` vão às pontas.

---

## Color picker

```html
<input type="text" name="cor" value="#4f46e5" data-tuc-color>
<input type="text" name="marca" value="#0d9488" data-tuc-color data-alpha="false"
       data-swatches="#0a0a0a,#ea580c,#16a34a">
```

```js
const c = new Tucano.ColorPicker('#cor', { format: 'rgb', alpha: false });
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

## Celular: seletor nativo

Em telas de toque (`pointer: coarse`) o componente troca sozinho para o seletor
do próprio sistema — a roda do iOS, o diálogo do Android. É melhor que qualquer
painel em tela pequena: roda fora da página, é feito para o dedo e o usuário já
conhece.

| Modo | Celular | Desktop |
| --- | --- | --- |
| data única | `<input type="date">` nativo | painel |
| data + hora | `<input type="datetime-local">` nativo | painel |
| **período** | **painel** (um mês por vez) | painel |

Período fica no painel nos dois casos porque **não existe seletor de intervalo
nativo em HTML** — `type="date"` só aceita uma data.

O que chega no servidor é idêntico nos dois caminhos: no modo nativo o próprio
input carrega o ISO e mantém o `name`, então nem hidden é criado.

```js
native: 'auto'   // padrão: nativo onde o ponteiro é de toque
native: true     // força nativo
native: false    // força o painel sempre
```

Por atributo: `data-native="false"`.

---

## Django

O input visível mostra a data no formato do locale; um `<input type="hidden">`
com o mesmo `name` carrega o valor em ISO. É esse que chega no `request.POST`:

```html
<input type="text" name="data_evento" data-tuc-datepicker data-time="true">
```

```
POST  data_evento = 2026-12-25T09:30
```

`DateField` e `DateTimeField` do Django fazem o parse disso sem configuração.
Em modo `range` o valor sai como `2026-03-01,2026-03-15` — separe no form:

```python
class ReservaForm(forms.Form):
    periodo = forms.CharField()

    def clean_periodo(self):
        inicio, _, fim = self.cleaned_data['periodo'].partition(',')
        return date.fromisoformat(inicio), date.fromisoformat(fim)
```

---

## Tema

Toda cor, raio e sombra é variável CSS. Para mudar o visual, sobrescreva —
não precisa recompilar:

```css
.tuc-dp {
  --tuc-accent: #0d9488;
  --tuc-accent-hover: #0f766e;
  --tuc-radius: 1rem;
  --tuc-cell: 2.5rem;      /* tamanho do dia */
}
```

Modo escuro segue a classe `.dark` no `<html>` (convenção do Tailwind). Para
seguir o sistema operacional, use `<html data-tuc-theme="auto">` — é opt-in de
propósito, para o componente não escurecer sozinho numa página clara.

Variáveis: `--tuc-accent`, `--tuc-accent-hover`, `--tuc-accent-fg`,
`--tuc-accent-soft`, `--tuc-bg`, `--tuc-fg`, `--tuc-muted`, `--tuc-subtle`,
`--tuc-border`, `--tuc-hover`, `--tuc-elevated`, `--tuc-ring`, `--tuc-shadow`,
`--tuc-radius`, `--tuc-cell`, `--tuc-text`, `--tuc-duration`, `--tuc-ease`.

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

## Desenvolvimento

```bash
npm install
npm run build       # gera dist/
npm run dev         # build + servidor da demo
```

```
src/js/core/         datas, cores, DOM, posicionamento do popover
src/js/components/   datepicker, select, colorpicker
src/styles/core/     reset e tokens
src/styles/components/
dist/                versionado, para o uso estático e o CDN funcionarem sem build
index.html           a documentação (também é a página do GitHub Pages)
```

As classes e variáveis usam o prefixo `tuc-` para não colidir com o CSS do
projeto que consome.
