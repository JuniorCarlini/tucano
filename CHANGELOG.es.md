# Changelog

Qué cambió en cada versión de Tucano, de la más reciente a la más antigua. Revisa
primero la sección "Antes de actualizar" de cada versión: ahí está lo que exige
cambios en tu proyecto.

## 0.34.0 — 2026-09-18

### Antes de actualizar

- El valor de un editor vacío pasó de `<p><br></p>` a `''`, en `getValue()` y en
  el `<textarea>` que va en el POST. Quien reconocía el vacío comparando con
  `<p><br></p>`, en JavaScript o en el servidor, pasa a recibir una cadena vacía
  — y un campo `required` ahora bloquea el envío, como debía.
- Con el script cargado con `defer`, la inicialización automática ahora espera
  a `DOMContentLoaded`, en lugar de ejecutarse en el instante en que corre el
  script. Es lo que da tiempo a llamar a `Tucano.setTexts()` antes de que los
  componentes se monten. Un script tuyo, también con `defer`, que leía
  `elemento._tucano` nada más ejecutarse pasa a encontrar `undefined`: léelo
  dentro de un listener de `DOMContentLoaded`.
- El formato de moneda en reales pasó de `real` a `brl`, en inglés como los
  demás nombres de código: `data-tuc-mask="brl"`, `data-tuc-format="brl"`,
  `format: 'brl'` y `Tucano.FORMATS.brl`. `real` dejó de funcionar: el campo
  queda sin máscara y el texto de visualización aparece crudo.
- `Tucano.mask.format(valor, 'document')`, alias no documentado de
  `'cpf-cnpj'`, fue eliminado. Usa `'cpf-cnpj'`.
- Los eventos de la tabla ganaron el prefijo de los demás: `tuc:sort` ahora es
  `tucano:sort`, y `tuc:select` es `tucano:select`. Los nombres antiguos ya no
  se disparan.
- Se eliminó la opción `openOnFocus` del date picker. Existía solo para mantener
  el comportamiento anterior de abrir el calendario al llegar con `Tab`; abrir
  sigue siendo `↓`, `Espacio` con el campo vacío o clic.
- La búsqueda en el servidor del select lee solo los formatos de respuesta
  documentados: `[{value, label}]`, `["a", "b"]`, `{results: [...]}` de DRF y
  `{id, text}` de Select2, con `next` para saber si hay otra página. `{items}`,
  `{data}`, `pk`, `name` y `has_more` dejaron de leerse: responde en uno de los
  formatos anteriores o usa `loadOptions`.
- Nombres en portugués que quedaban en el código: `Popover` pasa a `onDismiss`
  los motivos `'focus'` y `'detached'` (eran `'foco'` y `'solto'`), y la custom
  property del área del color picker es `--hue` (era `--matiz`).
- Se quitaron clases de estado que ninguna regla de CSS leía — `is-multiple` e
  `is-empty` del select, `is-empty` del upload, `is-range` e `is-timed` del date
  picker — y la propiedad `id` de la instancia de `Table`, que nada usaba. Si tu
  proyecto dependía de ellas, usa `.tuc-select-native[multiple] + .tuc-select`,
  `.tuc-select:not(.has-value)`, `instancia.isRange`, `instancia.opts.time` y el
  `id` de la propia `<table>`.
- El CSS quedó casi 1 KB más pequeño (gzip) sin los fallbacks que Tailwind
  inyectaba para navegadores antiguos. Por debajo de Chrome 111, Safari 16.2 y
  Firefox 113 — la base del propio Tailwind 4 —, los fondos suaves, los anillos
  de foco y el riel del interruptor apagado, que usan `color-mix`, dejan de
  verse. Y los pesos de fuente de los componentes quedan fijos en 500 y 600, sin
  leer el tema de Tailwind de tu proyecto.
- Date picker con el botón Aplicar (el predeterminado con `time`, o
  `autoApply: false`): elegir día, hora o atajo ya no dispara `tucano:change`,
  `change` ni `onChange`. El evento sale una vez, en Aplicar, y cerrar con
  `Escape` o un clic fuera descarta la elección. Antes cada clic ya emitía,
  Aplicar emitía otra vez y cerrar fuera mantenía el cambio. Con
  `autoApply: true` nada cambia. Quien guardaba en cada evento pasa a recibir
  solo el valor confirmado.
- Una fecha fuera de `min` y `max` ya no se lleva al límite. Escrita, se
  rechaza y queda el valor anterior; en `setValue()` y en el `value` inicial,
  el campo queda vacío, como ya pasaba con `disabledDates`. Antes `2027-01-15`
  con `max` en `2026-12-31` se convertía en 31/12/2026 en silencio. Un rango
  escrito sin un fin válido también se rechaza entero, en lugar de quedarse solo
  con el inicio.
- `Tucano.dates.parseISO()` lee solo ISO (`aaaa-mm-dd`, con hora opcional) y
  `Date`. Un texto en otro formato caía en `new Date(texto)`, que lee
  `07/09/2026` como 9 de julio, y ahora devuelve `null`. Para lo que la persona
  escribe, use `Tucano.dates.parseUserInput()`.
- En el color picker, el `change` nativo sale una sola vez, cuando termina el
  arrastre en el área o en las barras, como en el `<input type="range">`. El
  `tucano:change` y el `onChange` siguen saliendo en cada movimiento. Antes el
  nativo salía en cada píxel, y un `hx-trigger="change"` enviaba una petición
  por movimiento del ratón; quien usaba el `change` para una vista previa en vivo
  pasa a escuchar el `tucano:change`.
- El tono del color picker se detiene en 360 con el teclado, en lugar de dar la
  vuelta a 0: `→` al final de la barra ya no hace nada. `Home` y `End` van a
  los extremos.
- La subida directa solo envía el `X-CSRFToken` leído de la cookie al mismo
  origen de la página, como en la receta de Django. Antes iba junto al archivo a
  cualquier `url`, incluso de otro dominio. Si subes a otro origen y necesitas
  el token, pasa `headers: { 'X-CSRFToken': ... }`.
- En la subida directa de un input con `name`, una respuesta 2xx sin el id
  (`responseId`) deja el archivo en error, con "O servidor não devolveu o id".
  Antes quedaba listo, con la marca, y el formulario no enviaba nada.

- El campo de color sin `value` nace vacío, en lugar de venir con un color que
  el componente elegía solo. Ahora `required` bloquea el envío mientras nadie
  elige, y el formulario ya no envía un color que nadie pidió. `getValue()`
  devuelve `null` en ese estado, y `setValue(null)` o `setValue('')` lo limpia.
  Quien contaba con el color de fábrica pone `value="#4f46e5"` en el campo.
- En el select, `setValue(valor, { silent: true })` y `clear({ silent: true })`
  pasan a contener también el `change` del elemento nativo, y no solo el
  `onChange` y el `tucano:change`. Es lo que hace el DOM cuando un script
  escribe en `select.value`. Un `hx-trigger="change"` dejaba de ser silencioso y
  mandaba una petición en cada cambio por código. Llama sin `silent` para
  avisar; elegir con el ratón o el teclado sigue disparando.

### Nuevo

- `data-tuc-reveal` también en texto suelto en la pantalla, y no solo en campos:
  un CPF en un perfil, la tarjeta en una celda de tabla, una clave de API en un
  párrafo. El texto aparece oculto, con el ojo al lado, en los mismos modos
  (`end`, `email`, `all`) y junto con `data-tuc-format`. Es solo visual: el valor
  completo sigue en el HTML, así que lo que no puede llegar al navegador debe
  ocultarse en el servidor.
- `Tucano.setTexts()` reemplaza cualquier texto que los componentes muestran o
  anuncian: el "Limpar" y el "Aplicar" del date picker, los atajos de período, el
  "Buscar..." y el "Nenhum resultado" del select, el "Fechar" del modal, del
  panel lateral y del toast, los botones del editor, el "Mostrar"/"Ocultar" de la
  máscara y las etiquetas que lee el lector de pantalla. En un proyecto en inglés
  o español ya no aparece nada en portugués. El cambio es por grupo
  (`Tucano.setTexts({ datepicker: { clear: 'Clear' } })`), vale para lo que se
  monte después, y la opción de la instancia (`data-placeholder`, `emptyText`,
  `prevText`, `texts` del upload) sigue ganando. El portugués sigue como
  predeterminado, sin diccionarios de idiomas en el paquete, y
  `Tucano.getTexts()` devuelve los textos actuales. El nombre del día que el
  lector de pantalla lee en el calendario ahora viene del idioma de la página.
- Tipos de TypeScript en el paquete, en `dist/tucano.d.ts`, generados a partir
  del código en cada build y sin ningún peso en el bundle.
  `import { DatePicker } from 'tucano'` y el `Tucano` global del `<script>` (con
  `checkJs`) pasan a tener autocompletado y verificación de opciones, métodos, lo
  que `getValue()` devuelve en cada modo, el `detail` de los eventos
  `tucano:*`, los grupos y claves de `Tucano.setTexts()` y las utilidades
  `Tucano.mask`, `Tucano.dates` y `Tucano.color`.

### Cambió

- El icono de `.tuc-alert` queda en el medio de la altura del aviso, y ya no
  pegado a la primera línea. Con título y texto subía solo, mientras que los
  botones de acción al lado ya quedaban centrados.

### Corregido

- El select no disparaba `input` en el `<select>` nativo, solo `change`. El del
  navegador dispara los dos, en ese orden: un `hx-trigger="input"` nunca se
  ejecutaba, y en Firefox el globo de validación de un envío inválido no se
  cerraba cuando la persona elegía la opción.
- `data-tuc-reveal` en un campo sin `data-tuc-mask`, como contraseña y token,
  lanzaba un error en cada tecla.
- Un campo de contraseña vacío con `data-tuc-reveal` nacía visible, cambiado a
  `type="text"`, y mostraba lo que se escribía. Ahora nace siempre oculto.
- Un campo solo con el ojo recibía `inputmode="numeric"`, y el móvil abría el
  teclado de números para contraseñas y tokens. Y el campo de contraseña perdía
  el `autocomplete` del navegador, lo que estorbaba al gestor de contraseñas.
- Algunos textos predeterminados en portugués no tenían tilde: "Mês anterior",
  "Próximo mês", "Próximo" y "Selecionar período" en el date picker, "Limpar
  seleção" en el select y "Saturação e brilho" en el color picker. Si un test de
  tu proyecto compara esos textos, actualízalo.
- `Escape` en un select, calendario o color picker abierto dentro de un modal
  cerraba también el modal. Ahora cierra solo el panel.
- `Escape` en el color picker dejaba el foco en `<body>`, y el siguiente `Tab`
  volvía a empezar desde arriba de la página. El foco vuelve a la muestra, como
  en los demás campos.
- El tablero de ajedrez detrás de un color translúcido — en la muestra, la
  vista previa y la pista de transparencia del color picker — no aparecía.
- Select, date picker, color picker, menú y tooltip salían del DOM en el instante
  exacto en que terminaría la animación de salida, y el final podía verse
  cortado.
- Período escrito en el date picker: `25-12-2025 a 31-12-2025` se cortaba en los
  guiones de la fecha, `aa` y `aé` valían como separador, y el "AM" de una hora
  de 12 horas partía el texto. Los separadores ahora son `a`, `até` y `-` entre
  espacios, y `–` o `—`.
- Quitar un archivo en la subida directa pisaba el `X-CSRFToken` indicado en
  `headers`; el envío ya lo respetaba.
- Volver a abrir un modal o un panel lateral menos de 200 ms después de cerrarlo
  hacía que el diálogo se cerrara solo enseguida: el cierre programado no se
  cancelaba. Ahora volver a abrir cancela el cierre pendiente.
- El date picker leía fechas ambiguas en formato estadounidense en el `value`
  inicial y en `setValue()`: `07/09/2026` se convertía en 9 de julio en un campo
  en portugués, también con hora. El texto ahora pasa por la lectura del idioma,
  y un `Date` entra tal cual.
- Una fecha escrita en el date picker no disparaba `tucano:change` ni
  `onChange`, `Enter` con el panel abierto no confirmaba ni cerraba y `Escape`
  no descartaba el texto: la vista previa grababa el valor mientras se escribía.
- Empezar un rango nuevo y cerrar con `Escape` o un clic fuera borraba el rango
  que ya estaba elegido. Ahora vuelve.
- Cerrar y volver a abrir en menos de 200 ms el date picker, el select, el color
  picker, el menú o la ayuda sacaba el panel del DOM con el componente todavía
  abierto.
- Foco con el teclado en el calendario: la flecha sobre un día desactivado
  mandaba el foco al `<body>`; abrir con `↓` enfocaba el día 1, desactivado
  cuando `min` cae a mitad de mes, en lugar del día elegido o de hoy; y con dos
  meses el día repetido del mes vecino recibía el foco, con dos paradas de Tab
  en la cuadrícula.
- Hacer clic o pulsar `Enter` en las flechas, la etiqueta del mes, las celdas de
  mes y año, los atajos y las horas del calendario mandaba el foco al `<body>`.
- Número de semana incorrecto en el calendario cuando la semana empieza en
  domingo, como en pt-BR y en-US: salía el de la semana anterior.
- Columnas de hora del date picker: cada botón era una parada de Tab (194 con
  segundos) y las flechas no hacían nada. Ahora cada columna es una sola parada,
  `↑`, `↓`, `Home` y `End` se mueven en ella, y `Enter` o `Espacio` eligen.
- `destroy()` del date picker dejaba el campo sin `name`, y el formulario dejaba
  de enviarlo, además de los atributos, la clase y `data-tuc-ready`, que impedía
  a `Tucano.init` montarlo de nuevo; en modo nativo quedaban el envoltorio y el
  overlay. Y `new DatePicker` dos veces en el mismo campo creaba dos instancias:
  la segunda ahora reemplaza a la primera.
- `form.reset()` dejaba el date picker desincronizado: el campo mostraba el texto
  crudo del `value` y el hidden seguía con el valor anterior.
- Date picker: en modo nativo con hora, `max` bloqueaba todas las horas del
  último día; los atajos de rango con hora terminaban a medianoche ("Hoje" era
  00:00 — 00:00); en un idioma de 12 horas la hora del panel salía en 24; y
  `data-native="auto"` no se leía.
- Las vistas de mes y de año del calendario ignoraban `min` y `max`. Ahora lo
  que queda fuera está desactivado, y las flechas también.
- El diseño compacto del date picker se decidía solo al montar: ensanchar la
  pantalla o girar la tableta dejaba el campo sin escritura y sin máscara.
- La cuadrícula del calendario no tenía `role="row"`, y la región que anuncia el
  cambio de mes se recreaba en cada render, así que el lector de pantalla no la
  anunciaba.
- Arrastrar un fragmento de otra página dentro del editor traía el HTML consigo —
  título, color, estilo e `<img>`, que el navegador llegaba a descargar. Soltar
  ahora entra como texto plano, como pegar.
- El filtro del editor aceptaba `//sitio.com` y `/\sitio.com` como ruta local, y
  el enlace guardado apuntaba a otro dominio.
- Caja de enlace del editor: un `javascript:` escrito se volvía un enlace
  clicable en el área (el valor guardado salía limpio); una dirección sin
  esquema, como `ejemplo.com`, desaparecía en silencio al guardar y ahora recibe
  `https://`; y cambiar la dirección con el cursor dentro del enlace lo partía
  en dos.
- `Enter` y pegar dentro de un bloque de código del editor perdían los saltos de
  línea al repintar, y las líneas se juntaban en una sola.
- `Tab` en una tabla del editor avanzaba una sola celda y no salía de una celda
  vacía. Ahora las recorre todas y crea una fila en la última.
- El `placeholder` del editor nunca aparecía.
- `required` en el editor no funcionaba: sin tocar, bloqueaba el envío sin
  mostrar dónde; vaciado, enviaba `<p><br></p>` y pasaba. Y el `reset` del
  formulario no devolvía el editor al contenido original.
- Una tabla insertada en el editor quedaba dentro del párrafo del cursor, dejaba
  un `<p></p>` de más en el valor, y el siguiente `Ctrl+Z` deshacía el texto y
  dejaba la tabla.
- Seleccionar texto en negrita fuera del editor encendía el botón de negrita de
  todos los editores de la página.
- Una lista aplicada a un párrafo dejaba `<p></p>` antes y después de ella en el
  valor guardado.
- `destroy()` del editor dejaba `_tucano` y la clase en el textarea, y el
  repintado programado seguía corriendo.
- En Safari, `Enter` dentro de un bloque de código del editor abría un bloque
  nuevo en lugar de partir la línea, y pegar o soltar texto de varias líneas ahí
  se convertía en un bloque por línea.
- En Safari, el botón de la barra del editor activado con el teclado (`Tab`
  hasta él y `Espacio` o `Enter`) aplicaba el comando a un cursor vacío al
  principio del texto, y no al fragmento seleccionado.
- En Firefox, `Ctrl+Z` justo después de insertar una tabla en el editor no la
  quitaba.
- En Firefox, cambiar la dirección de un enlace con el cursor dentro dejaba un
  `<a>` vacío delante del enlace, en el valor guardado.
- El panel del color picker no se alcanzaba con el teclado: con el foco en la
  muestra, el siguiente `Tab` salía del campo y el panel se cerraba. Abierto con
  `↓`, o con `Enter` y `Espacio` en la muestra, el foco ahora entra en el área de
  color, y el `Tab` recorre el panel por dentro. Las barras ganaron `Home` y
  `End`.
- `Tucano.color.parseColor()` y el color picker grababan basura a partir de
  colores CSS válidos: un alfa en porcentaje, como `rgb(255 0 0 / 50%)`, salía
  `#ff0000NaN`, y `hsl(120, 200%, 50%)` salía `#-7f17f-7f`. Ahora `rgb()` y
  `hsl()` leen `%`, la barra del alfa, `deg` y `turn`, cada parte se limita a su
  rango, y lo que no es número rechaza el color.
- `Tucano.color.formatColor()` devolvía `hsl(360, …)` para un tono cerca del
  final, que al releerse pasaba a 0, y `#rrggbbff` para opacidad de 0,998 en
  adelante.
- Escribir un color en el campo del color picker disparaba el `change` nativo
  dos veces — con HTMX, dos peticiones —, y una tecla en el borde del área
  emitía otra vez el mismo valor.
- `form.reset()` dejaba la muestra y la instancia del color picker con el color
  anterior.
- Un color picker desactivado, de solo lectura o dentro de un
  `<fieldset disabled>` abría el panel y dejaba cambiar el color.
- Con `alpha: false`, un valor inicial con opacidad, como `#ff000080`, quedaba
  en el campo del color picker con la barra de opacidad oculta.
- `destroy()` del color picker dejaba `data-tuc-ready`, y `Tucano.init` no
  volvía a montar el campo. Y `new ColorPicker` dos veces en el mismo campo
  anidaba un control dentro del otro, con dos muestras: la segunda ahora
  reemplaza a la primera.
- Paleta del color picker: `data-swatches` con `rgb(255, 0, 0)` se partía en las
  comas y daba tres muestras rotas; la marca ignoraba la opacidad, y
  `#00ff0080` y `#00ff00` se encendían juntas; y el aumento al pasar el ratón no
  se animaba.
- Color picker: un texto inválido en el campo del panel se quedaba ahí después
  de confirmar, falseando el valor; el botón derecho en el área cambiaba el color
  junto con el menú contextual; y gris o negro con `setValue()` o escritos
  llevaban el área al rojo, en lugar de mantener el tono.
- Subida de un solo archivo: elegir un archivo rechazado borraba el que ya
  estaba elegido, y en modo directo además llamaba a su `DELETE` en el servidor.
- Subida en el formulario: el `reset` vaciaba el input, pero la lista seguía
  mostrando archivos que el envío ya no llevaba.
- `destroy()` de la subida en medio de un envío dejaba seguir la petición y aún
  emitía `tucano:change`; en modo directo el input volvía sin `name`.
- Subida: el input nativo oculto era una parada de `Tab` sin foco visible, y
  quitar un archivo — o que otro terminara de subir — mandaba el foco al `<body>`.
- Subida dentro de un `<label>`: hacer clic en la zona abría la ventana de
  archivos dos veces en Firefox y Safari.
- Una subida desactivada, en el input o en un `fieldset`, aceptaba archivos
  soltados en la zona, y en modo directo los enviaba.
- Subida directa: `'x-csrftoken'` en minúsculas en `headers` se sumaba al token
  de la cookie; el id iba sin codificar en la URL del `DELETE`, y un `../` salía
  del `deleteUrl`; los hidden ignoraban el atributo `form` del input; `clear()`
  con un envío en curso emitía dos veces; y soltar muchos archivos a la vez
  redibujaba la lista por cada uno.
- `data-max-size="2M"` y otras grafías sin la "b" se volvían "sin límite" en
  silencio. Ahora `2M`, `300k` y `1 MiB` valen, y lo que no se lee avisa en la
  consola.
- Búsqueda del select: escribir con tilde (`pará`, `são`) no encontraba nada —
  solo se normalizaba la opción, no el término escrito.
- Select con búsqueda en el servidor: volver a un término aún en vuelo dejaba la
  lista trabada en "Buscando..."; la respuesta de un término abandonado aparecía
  durante el debounce y al reabrir; `minChars: 0` no buscaba al abrir; y un
  término servido desde la caché dejaba de paginar.
- Paginación del select remoto: un servidor que ignora `page` generaba
  peticiones sin fin; cargar la página siguiente devolvía el scroll y el
  resaltado arriba; y un error en ella borraba la página que ya estaba en
  pantalla.
- Select dentro de un `<label>`: el clic que abría el panel lo cerraba enseguida.
  El foco que llega al `<select>` nativo — por `<label for>` o por el aviso de
  campo obligatorio — va a la búsqueda, y el campo lee su nombre accesible del
  `<label>`, de `aria-label` o de `aria-labelledby`.
- Un select desactivado dejaba escribir y limpiar con la X, y no parecía
  desactivado. Una opción dentro de `<optgroup disabled>` se podía elegir, y el
  `Backspace` del múltiple quitaba etiquetas de opciones desactivadas.
- Teclado en el select: `Enter` en el múltiple después de filtrar marcaba otra
  opción; `↑` sin opción activa no iba a la última; `Home` y `End` se paraban
  en opciones desactivadas; el puntero quieto sobre la lista robaba el resaltado
  de las flechas (en Safari, en cada desplazamiento); y `aria-activedescendant`
  seguía apuntando a una opción que no estaba en pantalla.
- Select: hacer clic en el título de un grupo, en la X de limpiar o en la X de
  una etiqueta quitaba el foco de la búsqueda; volver a elegir la opción ya
  elegida disparaba `change`; `setValue()` con dos valores en un select simple
  mostraba uno y enviaba otro (vale el primero); un `<option value=""></option>`
  sin texto borraba el placeholder; `destroy()` dejaba `data-tuc-ready`; y
  `form.reset()` en modo remoto dejaba el campo vacío.
- `refresh()` del select no activaba la búsqueda cuando las opciones llegaban
  después del montaje, y el menú de una etiqueta larga superaba el ancho del
  móvil, desplazando la página de lado.

## 0.33.1 — 2026-09-14

### Corregido

- En el select simple, `Backspace` y `Delete` con la búsqueda vacía no hacían
  nada: solo el múltiple respondía, quitando la última etiqueta. Quien llegaba
  con Tab a un select lleno no podía vaciarlo sin ir con el mouse a la X. Ahora
  las dos teclas limpian el valor, como la X. Con `clearable: false` no hay X, y
  el teclado tampoco limpia.
- Limpiar un select simple sin `<option value="">` — con la X o con el teclado —
  mostraba el campo vacío, pero el `<select>` volvía solo a la primera opción y
  el formulario enviaba el valor anterior. Ahora el nativo queda sin nada
  seleccionado: el campo no se envía y `required` bloquea el envío.
- Escribir en un select con búsqueda y la lista cerrada perdía la primera letra:
  abría la lista, y abrirla vaciaba la búsqueda. "sa" se volvía "a". Ahora la
  búsqueda guarda todo lo escrito, también en el select remoto.
- El `reset()` del formulario devolvía el `<select>` a su valor inicial, pero el
  componente seguía mostrando el valor anterior, porque el reset no dispara
  `change`. Ahora la pantalla acompaña el reset.

## 0.33.0 — 2026-09-14

### Antes de actualizar

- El color de acento por defecto ahora es neutro: `#0a0a0a` en el tema claro y
  `#fafafa` en el oscuro, con el texto encima invertido. El color es de tu
  proyecto, y el paquete no impone una marca. Si no defines `--tuc-accent`, el
  botón primario, la casilla marcada, la pestaña activa y el día elegido pasarán
  de naranja a negro (o casi blanco, en oscuro). Para mantener el naranja, define
  en `:root, .dark` `--tuc-accent: #FF7501`, `--tuc-accent-hover: #FF8A2A`,
  `--tuc-accent-fg: #ffffff`, `--tuc-thumb: #ffffff` y `--tuc-accent-text: #B84300`
  — este último `#FF7501` en `.dark`. La receta completa está en la página Tema.
- Los motivos que el modal y el panel lateral entregan a `onClose` ahora están en
  inglés, como el resto de la API: `'button'` en lugar de `'botao'` y `'backdrop'`
  en lugar de `'fundo'`. Si tu código compara el motivo, cambia los dos.
- En la máscara, `data-tuc-reveal`, `data-reveal-mode` y `revealMode` pasan a ser
  `end` o `all` (eran `fim` y `tudo`), y el formato `cnpj-numerico` pasa a ser
  `cnpj-numeric`. Los nombres antiguos dejan de funcionar: cámbialos en la plantilla.

### Nuevo

- El campo con `data-validate` se pone verde cuando pasa. En la máscara, en cuanto
  el valor está completo y correcto, ya mientras se escribe (`data-tuc-valid`); el
  rojo sigue apareciendo solo al salir del campo. En un `.tuc-input` nativo con
  `data-validate`, el verde viene de `:user-valid`. Sin el atributo, no cambia nada.

### Corregido

- El panel lateral con contenido más alto que la pantalla — un menú largo, un
  formulario de filtros — se salía de la pantalla y no se desplazaba. Ahora el
  cuerpo se desplaza y el panel ocupa el alto de la pantalla, en los cuatro
  bordes; el modal recibió la misma corrección.
- `.tuc-menu` dentro de una columna de altura fija, como la barra lateral de un
  sistema, se desbordaba de la columna y se desplazaba la página entera en su
  lugar. Ahora el menú se desplaza por sí solo ahí; fuera de una columna así, no
  cambia nada.
- Con un modal o un panel lateral abierto, la rueda del ratón desplazaba la
  página de detrás — sobre el fondo oscurecido y después de que el contenido del
  diálogo llegara al final. Ahora la página queda quieta mientras haya un diálogo
  abierto, y llegar al final del cuerpo no transmite el desplazamiento.
- La X de cerrar del modal y del panel lateral quedaba unos 2px hacia dentro de
  la línea donde terminan el contenido y los botones del pie. Ahora el trazo de la
  X termina en esa misma línea.
- Abrir un modal o un panel lateral en una página con barra de desplazamiento que
  ocupa espacio (Windows, o macOS con ratón) hacía saltar hacia un lado el
  contenido del fondo: el bloqueo de desplazamiento ocultaba la barra y la página
  ganaba su ancho. Ahora el espacio de la barra queda reservado mientras el
  diálogo está abierto.
- Una tabla con muchas columnas en el editor y en `.tuc-prose` quedaba presa en
  el ancho disponible y apretaba el texto a una palabra por línea. Ahora cada
  columna tiene un ancho mínimo y la tabla ancha se desplaza en horizontal, por
  sí sola, sin mover el resto del texto. El HTML guardado no cambia.

## 0.32.1 — 2026-09-13

### Corregido

- El campo del date picker declaraba `aria-expanded` sin un rol que lo admita, y
  el lector de pantalla ignoraba el atributo. Ahora es `role="combobox"`, el rol
  de ARIA para un campo que abre un panel.
- Date picker y select mantenían `aria-controls` apuntando al panel incluso
  cerrado, cuando no está en el DOM — un valor inválido para el lector de
  pantalla y para Lighthouse. Ahora el atributo solo existe con el panel abierto.

## 0.32.0 — 2026-09-13

### Antes de actualizar

- El color de acento por defecto ahora es el naranja del tucán, `#FF7501`, en
  ambos temas, con texto blanco encima (`--tuc-accent-fg`). El contraste del
  blanco sobre ese naranja es 2,7; quien necesite 4,5 en el botón primario define
  `--tuc-accent-fg: #0a0a0a` en su propio proyecto. Donde el acento es el color
  del propio texto — enlace, menú activo, tag — entra el nuevo
  `--tuc-accent-text`, más oscuro en el tema claro para seguir siendo legible.
  Quien ya define `--tuc-accent` en su proyecto, revise también estos dos.
- El archivo rechazado en el upload es un `.tuc-alert is-danger`, con la clase
  `.tuc-upload__rejected`. La regla `.tuc-upload__item.is-rejected` ya no existe.
- El campo hex del color picker es un `.tuc-input`, y el cuentagotas un
  `.tuc-btn is-outline is-sm`.
- Se eliminaron las clases `tuc-upload__action` y `tuc-pagination__ico`.
- El elemento activo de `.tuc-menu` ya no tiene la línea en el borde izquierdo.
- Etiqueta, aviso y toast de información usan el nuevo `--tuc-info` (azul), y ya
  no el color de acento. Quien sobrescribía `--tuc-accent` para cambiar ese tono
  pasa a sobrescribir `--tuc-info`.

### Nuevo

- Casilla, opción e interruptor: `.tuc-radio`, `.tuc-switch` y la etiqueta
  `.tuc-choice`, que alinea el control con la primera línea del texto, con
  `.tuc-choices` para grupos.
- Formulario: `.tuc-label`, `.tuc-hint` y `.tuc-error`, y el estado inválido con
  `aria-invalid="true"` en todos los campos — Django 5 ya escribe el atributo.
  `.tuc-input` también sirve para el `<select>` nativo.
- Pestañas (`data-tuc-tabs`), con el teclado de ARIA APG, modo manual para
  paneles que cargan por HTMX y la variante segmentada.
- Aviso fijo en la página (`.tuc-alert`), en cuatro tonos.
- Carga: `.tuc-spinner` y `.tuc-skeleton`. Un botón con `aria-busy` no se atenúa.
- Línea de tiempo (`.tuc-timeline`), solo con clases: tonos, punto relleno o
  hueco e icono opcional en lugar del punto.
- El paquete exporta `icon`, `ICON_CHECK`, `ICON_COPY` e `ICON_X`.
- Documentación con una página por componente, generada en el build.

### Cambió

- Los componentes usan por dentro las piezas de la propia biblioteca: la
  etiqueta y los atajos del calendario son `.tuc-btn`, la carga del toast y del
  select es `.tuc-spinner`, el contador del menú es `.tuc-badge`.
- El brillo del modal y del panel lateral sigue el color de acento.

### Corregido

- El campo de moneda de la máscara nacía sin placeholder y parecía un campo
  común. Ahora muestra el cero ya formateado, como `R$ 0,00`.
- Las flechas para cambiar de mes del calendario eran invisibles y no se podían
  pulsar.
- Un botón hecho con `<a>` aparecía subrayado.
- Upload, elemento peligroso del menú desplegable y campo inválido de la máscara
  usaban rojo y verde fijos, que no se aclaraban en el modo oscuro.
- El anillo de foco del panel de pestañas se superponía a la lista.
- El error de la búsqueda en el servidor se mostraba igual que "ningún
  resultado".
- En el date picker, abrir con `↓` o `Espaço` dejaba el foco en el campo: las
  flechas no llegaban a los días y `Tab` cerraba el panel. Ahora el foco va al
  día.
- La máscara borraba el `aria-invalid` del campo al enfocarlo, y el error que
  envió Django desaparecía con el primer clic. Ahora solo la validación de la
  propia máscara lo modifica.
- `setValue()` en el campo sensible no actualizaba el valor enviado en el
  formulario.
- La barra del editor solo respondía al ratón: con el foco en un botón, `Enter` y
  `Espaço` no hacían nada. Ahora funcionan, y el comando se aplica al texto que
  estaba seleccionado.
- Los botones de borrar fila, columna y tabla del editor no se ponían rojos.
- La opción `method` del upload se ignoraba, y el envío salía siempre como POST.
- Un toast que venía de los mensajes de Django tomaba el tipo equivocado cuando
  el mensaje tenía `extra_tags`: solo leía la primera palabra.
- `Tooltip.setText()` borraba la flecha junto con el texto.
- Un `data-tuc-tip` vacío interrumpía el montaje de los tooltips siguientes.
- Un menú desplegable creado en JS con `panel` dejaba los elementos sin
  `role="menuitem"`.
- Select, date picker y color picker dentro de un modal o panel lateral abrían el
  panel detrás del diálogo. Ahora el panel nace dentro del `<dialog>` abierto.
- Un modal sin título quedaba sin nombre para el lector de pantalla; ahora el
  texto le da nombre.
- El diálogo salía del DOM 10 ms antes del fin de la animación de salida.
- En la paginación, los extremos quedaban sin nombre en el móvil, y `setPage()`
  perdía el foco de quien navegaba con el teclado.
- El date picker de período leía mal su propio valor en ISO
  (`2026-03-01,2026-03-15`), que es lo que devuelve Django cuando el formulario
  vuelve con errores.
- Cambiar `--tuc-accent` o un tono en un contenedor no cambiaba el fondo suave ni
  el anillo de foco, que se quedaban con el color de la raíz.
- El resaltador de código pintaba el resto de la línea como comentario después
  de `https://`, y todo color hex de CSS (`#4f46e5`) como comentario.

## 0.31.0 — 2026-09-04

### Antes de actualizar

- Se eliminó la clase `tuc-menu__secao`. Usa `tuc-menu__section`.

### Cambió

- Suite de pruebas en el repositorio y en el CI: funciones puras, comportamiento
  en el navegador, teclado real, ejemplos de la documentación verificados contra
  el código y comprobaciones cruzadas de nombres.

### Corregido

- El acordeón no exponía `node._tucano`.
- Modal y panel lateral anunciaban `actions` con las claves antiguas.
- `toast.promise` documentaba `carregando/sucesso/erro` en lugar de
  `loading/success/error`.

## 0.30.2 — 2026-09-04

### Corregido

- La tag 0.30.1 no incluía el cambio de nombre del evento `tucano:toast-fechado`
  a `tucano:toast-closed`, que npm ya publicaba. GitHub, jsDelivr y npm vuelven a
  tener el mismo contenido.

### Nuevo

- Referencia completa de la API, generada a partir del código, dentro de
  `llms.txt`.

## 0.30.1 — 2026-09-04

### Antes de actualizar

- La API pasó a estar toda en inglés: nombres de método, opción, valor, clase CSS
  y evento. `Modal.abrir()` pasó a ser `open()`, `tom: 'perigo'` pasó a ser
  `tone: 'danger'`, `.tuc-gaveta` pasó a ser `.tuc-drawer`.
- La tabla ordena en el servidor por defecto; ordenar en la pantalla requiere
  `data-sort-mode="client"`.
- Llegar con `Tab` ya no abre el panel de los campos. Abrir es siempre explícito.

### Nuevo

- Tabla, con ordenación y selección masiva, y paginación hecha para el Paginator.
- Menú desplegable.
- Etiqueta de estado, casilla de verificación con diseño propio y botón de copiar
  en los bloques de código.
- El campo dibuja el borde y la altura antes de que se ejecute el script.

### Cambió

- Tokens en `:root` y reset con un solo selector.

## 0.25.1 — 2026-09-03

- El navegador ancla el desplazamiento por sí solo, sin corrección manual.

## 0.25.0 — 2026-09-03

- Importar `tucano` ya no ejecuta nada: el empaquetador incluye solo lo que se
  usó.

## 0.24.2 — 2026-09-03

- Aplicar un título en el editor no hace saltar el texto, y el enlace se pide en
  un modal.

## 0.23.3 — 2026-09-03

- La barra de desplazamiento sigue el tema.

## 0.23.1 — 2026-09-03

- Mismo contenido que la 0.23.0, publicado con otro número porque npm reservó el
  anterior.

## 0.23.0 — 2026-09-03

- Editor de texto con tabla, alineación y bloque de código. El campo en Markdown
  se eliminó, y queda un solo editor.
- El tooltip se aleja lo suficiente para que la flecha no toque el disparador.

## 0.22.1 — 2026-09-03

- Todos los controles verificados con medición para tener la misma altura.

## 0.19.0 — 2026-09-03

- Editor de texto que muestra el resultado mientras se escribe.

## 0.18.1 — 2026-09-03

- La vista previa del campo formateado sustituye al campo, en lugar de apilarse.

## 0.18.0 — 2026-09-03

- Campo de texto formateado, en Markdown.

## 0.17.1 — 2026-09-03

- El icono ya no queda sobre el texto en los campos con icono.

## 0.17.0 — 2026-09-03

- Estilo para el campo de texto, que la biblioteca nunca había tenido.

## 0.16.3 — 2026-09-03

- Archivos para IA al día con la biblioteca.

## 0.16.2 — 2026-09-03

- Ejemplo del acordeón con contenido real.

## 0.16.1 — 2026-09-03

- Nombres genéricos en el menú de ejemplo.

## 0.16.0 — 2026-09-03

- Submenú en el menú lateral, con guía y marcado de la rama abierta.

## 0.15.1 — 2026-09-03

- El icono sigue el tamaño del botón.

## 0.15.0 — 2026-09-03

- Menú lateral, y los iconos pasan a usar el botón de la biblioteca.

## 0.14.3 — 2026-09-03

- El acordeón ya no se traba en la primera apertura.

## 0.14.2 — 2026-09-03

- El acordeón se cierra hasta cero, y el brillo del fondo se extiende más.

## 0.14.1 — 2026-09-03

- El final del acordeón ya no se corta, y el brillo del panel lateral nace en el
  lugar correcto.

## 0.14.0 — 2026-09-03

- Acordeón sobre `<details>` nativo.

## 0.13.0 — 2026-09-03

- El panel lateral pasa a ser un componente propio, sobre la misma base del
  modal.

## 0.12.0 — 2026-09-03

- Panel lateral (off-canvas).

## 0.11.1 — 2026-09-02

- El `<dialog>` cerrado ya no cubre la página entera.
- Los tamaños anunciados pasan a salir del build.

## 0.11.0 — 2026-09-02

- Modal sobre `<dialog>` nativo.

## 0.10.2 — 2026-09-02

- Fuga de listeners en el popover.

## 0.10.1 — 2026-09-02

- Paneles posicionados con `left`/`top`, y no con `transform`.

## 0.10.0 — 2026-09-02

- Tooltip completo: cuatro lados, flecha y color configurable.

## 0.9.9 — 2026-09-02

- El toast pasa a la esquina inferior derecha, y se corrigió el margen en el
  móvil.

## 0.9.8 — 2026-09-02

- Toast de carga que se convierte en el resultado en la misma tarjeta.

## 0.9.7 — 2026-09-02

- Las dos regiones de accesibilidad del toast pasan a ser una sola pila.

## 0.9.6 — 2026-09-02

- Icono y botón de cerrar centrados en el toast.

## 0.9.5 — 2026-09-02

- Nueva animación del tooltip.

## 0.9.4 — 2026-09-02

- La pila de toasts no se cierra al mover el ratón de uno a otro.

## 0.9.3 — 2026-09-02

- Toast y tooltip quedan fuera de la regla de 16px del móvil.

## 0.9.2 — 2026-09-02

- Movimiento revisado y alturas verificadas.

## 0.9.1 — 2026-09-02

- Un botón deshabilitado muestra el cursor de bloqueo.

## 0.9.0 — 2026-09-02

- Toasts apilados y estilo de botón.

## 0.8.0 — 2026-09-02

- Toast y tooltip.

## 0.7.1 — 2026-09-02

- Menos peticiones en la búsqueda en el servidor.

## 0.7.0 — 2026-09-02

- Búsqueda en el servidor en el Select.

## 0.6.1 — 2026-09-02

- Modos de ocultar en el campo sensible, y se corrigió el campo de contraseña.

## 0.6.0 — 2026-09-02

- Máscaras, validación de documentos y campo sensible.

## 0.5.2 — 2026-09-02

- Tipos aceptados en el upload documentados.

## 0.5.1 — 2026-09-02

- Se corrigió el icono de reintentar.

## 0.5.0 — 2026-09-02

- Campo de upload.

## 0.4.2 — 2026-09-02

- Atributos del date picker documentados en la página.

## 0.4.1 — 2026-09-02

- Línea de valor del color picker alineada.

## 0.4.0 — 2026-09-02

- Personalización completa con variables CSS.
- Se corrigió una recursión en el color picker.

## 0.3.0 — 2026-09-02

- Sin zoom en el móvil al enfocar un campo, y el panel propio pasa a ser el
  predeterminado.

## 0.2.1 — 2026-09-02

- Se corrigieron el modo nativo y el calendario en el móvil.
- `llms.txt` y `AGENTS.md`, para que la IA sepa usar la biblioteca.

## 0.2.0 — 2026-09-01

- Primera versión: componentes de formulario ligeros, sin dependencias.
