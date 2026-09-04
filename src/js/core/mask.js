/**
 * Motor de mascara. Sem dependencias.
 *
 * Um gabarito e uma string de marcadores e literais:
 *   #  digito
 *   A  letra
 *   *  digito ou letra
 * Qualquer outro caractere e literal e entra sozinho.
 */

const MARKERS = {
  '#': (c) => c >= '0' && c <= '9',
  'A': (c) => /[a-zA-Z]/.test(c),
  '*': (c) => /[0-9a-zA-Z]/.test(c),
};

export function isPlaceholder(c) {
  return Object.hasOwn(MARKERS, c);
}

/** So os caracteres que podem ocupar um marcador do gabarito. */
export function clear(value, template) {
  const accepts = [...new Set([...template].filter(isPlaceholder))]
    .map((m) => MARKERS[m]);
  if (!accepts.length) return '';
  return [...String(value ?? '')].filter((c) => accepts.some((f) => f(c))).join('');
}

/**
 * Placeholder a partir do gabarito: `###.###.###-##` vira `000.000.000-00`.
 *
 * Existe porque escrever o placeholder a mao em cada campo e trabalho que a
 * biblioteca ja tem como fazer — e trabalho que se esquece: a pagina de
 * exemplos tinha cinco campos com placeholder e um sem, justamente o de
 * CPF/CNPJ. Com dois gabaritos (o campo aceita os dois), vale o primeiro, que
 * e o formato com que o campo comeca.
 */
export function placeholderFromTemplate(template) {
  const t = Array.isArray(template) ? template[0] : template;
  if (typeof t !== 'string') return '';
  return t.replace(/[#*]/g, '0');
}

export function capacity(template) {
  return [...template].filter(isPlaceholder).length;
}

/**
 * Distribui os caracteres pelo gabarito. O literal seguinte entra assim que o
 * grupo anterior fecha, para o usuario nao precisar digita-lo.
 */
export function apply(chars, template) {
  if (!chars.length) return '';
  let exit = '';
  let i = 0;
  for (const ch of template) {
    if (isPlaceholder(ch)) {
      // Descarta o que nao serve para esta posicao sem gastar a vaga: uma letra
      // digitada onde so cabe digito nao pode empurrar o resto do gabarito.
      let accepted = null;
      while (i < chars.length) {
        const candidate = chars[i++];
        if (MARKERS[ch](candidate)) { accepted = candidate; break; }
      }
      if (accepted === null) break;
      exit += accepted;
    } else {
      // Literais entram sempre. O corte vem do break acima, quando acaba a
      // entrada — sem isso um gabarito que comeca com literal, como
      // "(##) #####-####", parava no primeiro caractere e devolvia vazio.
      exit += ch;
    }
  }
  return exit;
}

/** Posicao do cursor logo apos o n-esimo caractere preenchido. */
export function cursorAfter(text, n) {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (/[0-9A-Za-z]/.test(text[i]) && ++seen === n) return i + 1;
  }
  return text.length;
}

/**
 * Escolhe o gabarito pelo tamanho do conteudo — telefone com 8 ou 9 digitos,
 * documento que pode ser CPF ou CNPJ.
 */
export function pickTemplate(chars, templates) {
  const list = [].concat(templates);
  if (list.length === 1) return list[0];
  const n = chars.length;
  return list.find((g) => n <= capacity(g)) || list[list.length - 1];
}

/* ------------------------------------------------------------------ *
 * Moeda                                                               *
 * ------------------------------------------------------------------ */

/**
 * Moeda enche da direita para a esquerda: digitar 1 2 3 vira 1,23 e depois
 * 12,34. E como todo campo de valor se comporta, e o contrario do resto.
 */
export function applyCurrency(digits, { decimals = 2, locale = 'pt-BR', currency = null } = {}) {
  const cleaned = String(digits).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!cleaned) return '';
  const n = Number(cleaned) / 10 ** decimals;
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(currency ? { style: 'currency', currency: currency } : {}),
  });
}

/* ------------------------------------------------------------------ *
 * Documentos brasileiros                                              *
 * ------------------------------------------------------------------ */

/** Digito verificador por soma ponderada, modulo 11. */
function mod11Digit(values, startWeight) {
  let soma = 0;
  let peso = startWeight;
  for (const v of values) {
    soma += v * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const rest = soma % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function validateCPF(value) {
  const d = String(value ?? '').replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;   // 111.111.111-11 e afins

  const n = [...d].map(Number);
  const check1 = mod11Digit(n.slice(0, 9), 10);
  const check2 = mod11Digit(n.slice(0, 10), 11);
  return check1 === n[9] && check2 === n[10];
}

/**
 * CNPJ, numerico ou alfanumerico.
 *
 * O novo formato mantem 14 posicoes e a mesma mascara: as 12 primeiras podem
 * ser letras ou digitos, as 2 ultimas continuam numericas. No calculo, cada
 * caractere vale o codigo ASCII menos 48 — assim '0' segue valendo 0 e o
 * algoritmo antigo continua valendo para CNPJ so de numeros.
 */
export function validateCNPJ(value) {
  const s = String(value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (s.length !== 14) return false;
  if (!/^[0-9A-Z]{12}\d{2}$/.test(s)) return false;
  if (/^(.)\1{13}$/.test(s)) return false;

  const values = [...s].map((c) => c.charCodeAt(0) - 48);
  const check1 = mod11Digit(values.slice(0, 12), 5);
  const check2 = mod11Digit(values.slice(0, 13), 6);
  return check1 === values[12] && check2 === values[13];
}

/** Aceita os dois, decidindo pelo tamanho. */
export function validateCpfCnpj(value) {
  const s = String(value ?? '').replace(/[^0-9A-Za-z]/g, '');
  if (s.length === 11) return validateCPF(s);
  if (s.length === 14) return validateCNPJ(s);
  return false;
}

/* ------------------------------------------------------------------ *
 * Exibicao                                                            *
 * ------------------------------------------------------------------ */

/**
 * Formata um valor pronto, para mostrar — nao para editar.
 *
 * Serve para o que ja vem do banco: um CPF em `12345678901` vira
 * `123.456.789-01` sem precisar de input nenhum.
 */
export function format(value, format, options = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (format === 'currency' || format === 'real') {
    const n = typeof value === 'number' ? value : Number(raw.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
    if (!Number.isFinite(n)) return raw;
    const { decimals = 2, locale = 'pt-BR' } = options;
    const currency = options.currency ?? (format === 'real' ? 'BRL' : null);
    return n.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...(currency ? { style: 'currency', currency: currency } : {}),
    });
  }

  const templates = DISPLAY_TEMPLATES[format] ?? format;
  const all = [].concat(templates).join('');
  const chars = clear(raw, all);
  if (!chars) return raw;
  const template = pickTemplate(chars, templates);
  // Conteudo que nao preenche o gabarito volta como veio, em vez de sair
  // pela metade e parecer corrompido.
  return chars.length === capacity(template) ? apply(chars, template) : raw;
}

const DISPLAY_TEMPLATES = {
  cpf: '###.###.###-##',
  cnpj: '**.***.***/****-##',
  'cpf-cnpj': ['###.###.###-##', '**.***.***/****-##'],
  document: ['###.###.###-##', '**.***.***/****-##'],
  phone: ['(##) ####-####', '(##) #####-####'],
  mobile: '(##) #####-####',
  cep: '#####-###',
  card: '#### #### #### ####',
};

const PONTO = '\u2022';

/**
 * Esconde o conteudo. Os separadores ficam, para a forma continuar
 * reconhecivel: `123.456.789-01` vira `•••.•••.•••-01`.
 *
 * modo:
 *   'fim'   (padrao) deixa os ultimos `visiveis` caracteres a mostra
 *   'email' deixa a primeira letra e o dominio: `j•••@empresa.com.br`
 *   'tudo'  esconde tudo — para senha, token e chave
 */
export function maskMiddle(text, visible = 2, mode = 'fim') {
  const s = String(text ?? '');
  if (!s) return s;

  if (mode === 'email') return maskEmail(s);

  const alphanumeric = (c) => /[0-9A-Za-z]/.test(c);
  const total = [...s].filter(alphanumeric).length;
  const show = mode === 'tudo' ? 0 : visible;
  let seen = 0;
  return [...s].map((c) => {
    if (!alphanumeric(c)) return mode === 'tudo' ? PONTO : c;
    seen++;
    return seen > total - show ? c : PONTO;
  }).join('');
}

/**
 * E-mail esconde ao contrario do resto: o dominio e o que ajuda a reconhecer a
 * conta, e a parte local e o que identifica a pessoa. Guardar o fim, como no
 * padrao, revelaria `om.br` e esconderia justamente o util.
 */
export function maskEmail(value) {
  const s = String(value ?? '');
  const arroba = s.lastIndexOf('@');
  if (arroba < 1) return maskMiddle(s, 0, 'tudo');
  const local = s.slice(0, arroba);
  const domain = s.slice(arroba);
  return local[0] + PONTO.repeat(Math.max(local.length - 1, 1)) + domain;
}
