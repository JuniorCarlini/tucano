# Changelog

Qué cambió en cada versión de Tucano, de la más reciente a la más antigua. Revisa
primero la sección "Antes de actualizar" de cada versión: ahí está lo que exige
cambios en tu proyecto.

## Sin publicar

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
