/**
 * Motor de mascara. Sem dependencias.
 *
 * Um gabarito e uma string de marcadores e literais:
 *   #  digito
 *   A  letra
 *   *  digito ou letra
 * Qualquer outro caractere e literal e entra sozinho.
 */

const MARCADORES = {
  '#': (c) => c >= '0' && c <= '9',
  'A': (c) => /[a-zA-Z]/.test(c),
  '*': (c) => /[0-9a-zA-Z]/.test(c),
};

export function isMarcador(c) {
  return Object.hasOwn(MARCADORES, c);
}

/** So os caracteres que podem ocupar um marcador do gabarito. */
export function limpar(valor, gabarito) {
  const aceita = [...new Set([...gabarito].filter(isMarcador))]
    .map((m) => MARCADORES[m]);
  if (!aceita.length) return '';
  return [...String(valor ?? '')].filter((c) => aceita.some((f) => f(c))).join('');
}

export function capacidade(gabarito) {
  return [...gabarito].filter(isMarcador).length;
}

/**
 * Distribui os caracteres pelo gabarito. O literal seguinte entra assim que o
 * grupo anterior fecha, para o usuario nao precisar digita-lo.
 */
export function aplicar(caracteres, gabarito) {
  if (!caracteres.length) return '';
  let saida = '';
  let i = 0;
  for (const ch of gabarito) {
    if (isMarcador(ch)) {
      // Descarta o que nao serve para esta posicao sem gastar a vaga: uma letra
      // digitada onde so cabe digito nao pode empurrar o resto do gabarito.
      let aceito = null;
      while (i < caracteres.length) {
        const candidato = caracteres[i++];
        if (MARCADORES[ch](candidato)) { aceito = candidato; break; }
      }
      if (aceito === null) break;
      saida += aceito;
    } else {
      // Literais entram sempre. O corte vem do break acima, quando acaba a
      // entrada — sem isso um gabarito que comeca com literal, como
      // "(##) #####-####", parava no primeiro caractere e devolvia vazio.
      saida += ch;
    }
  }
  return saida;
}

/** Posicao do cursor logo apos o n-esimo caractere preenchido. */
export function cursorApos(texto, n) {
  if (n <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < texto.length; i++) {
    if (/[0-9A-Za-z]/.test(texto[i]) && ++vistos === n) return i + 1;
  }
  return texto.length;
}

/**
 * Escolhe o gabarito pelo tamanho do conteudo — telefone com 8 ou 9 digitos,
 * documento que pode ser CPF ou CNPJ.
 */
export function escolherGabarito(caracteres, gabaritos) {
  const lista = [].concat(gabaritos);
  if (lista.length === 1) return lista[0];
  const n = caracteres.length;
  return lista.find((g) => n <= capacidade(g)) || lista[lista.length - 1];
}

/* ------------------------------------------------------------------ *
 * Moeda                                                               *
 * ------------------------------------------------------------------ */

/**
 * Moeda enche da direita para a esquerda: digitar 1 2 3 vira 1,23 e depois
 * 12,34. E como todo campo de valor se comporta, e o contrario do resto.
 */
export function aplicarMoeda(digitos, { decimais = 2, locale = 'pt-BR', moeda = null } = {}) {
  const limpos = String(digitos).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!limpos) return '';
  const n = Number(limpos) / 10 ** decimais;
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
    ...(moeda ? { style: 'currency', currency: moeda } : {}),
  });
}

/* ------------------------------------------------------------------ *
 * Documentos brasileiros                                              *
 * ------------------------------------------------------------------ */

/** Digito verificador por soma ponderada, modulo 11. */
function digitoModulo11(valores, pesoInicial) {
  let soma = 0;
  let peso = pesoInicial;
  for (const v of valores) {
    soma += v * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCPF(valor) {
  const d = String(valor ?? '').replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;   // 111.111.111-11 e afins

  const n = [...d].map(Number);
  const dv1 = digitoModulo11(n.slice(0, 9), 10);
  const dv2 = digitoModulo11(n.slice(0, 10), 11);
  return dv1 === n[9] && dv2 === n[10];
}

/**
 * CNPJ, numerico ou alfanumerico.
 *
 * O novo formato mantem 14 posicoes e a mesma mascara: as 12 primeiras podem
 * ser letras ou digitos, as 2 ultimas continuam numericas. No calculo, cada
 * caractere vale o codigo ASCII menos 48 — assim '0' segue valendo 0 e o
 * algoritmo antigo continua valendo para CNPJ so de numeros.
 */
export function validarCNPJ(valor) {
  const s = String(valor ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (s.length !== 14) return false;
  if (!/^[0-9A-Z]{12}\d{2}$/.test(s)) return false;
  if (/^(.)\1{13}$/.test(s)) return false;

  const valores = [...s].map((c) => c.charCodeAt(0) - 48);
  const dv1 = digitoModulo11(valores.slice(0, 12), 5);
  const dv2 = digitoModulo11(valores.slice(0, 13), 6);
  return dv1 === valores[12] && dv2 === valores[13];
}

/** Aceita os dois, decidindo pelo tamanho. */
export function validarCpfCnpj(valor) {
  const s = String(valor ?? '').replace(/[^0-9A-Za-z]/g, '');
  if (s.length === 11) return validarCPF(s);
  if (s.length === 14) return validarCNPJ(s);
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
export function formatar(valor, formato, opcoes = {}) {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return '';

  if (formato === 'moeda' || formato === 'real') {
    const n = typeof valor === 'number' ? valor : Number(bruto.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
    if (!Number.isFinite(n)) return bruto;
    const { decimais = 2, locale = 'pt-BR' } = opcoes;
    const moeda = opcoes.moeda ?? (formato === 'real' ? 'BRL' : null);
    return n.toLocaleString(locale, {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais,
      ...(moeda ? { style: 'currency', currency: moeda } : {}),
    });
  }

  const gabaritos = GABARITOS_EXIBICAO[formato] ?? formato;
  const todos = [].concat(gabaritos).join('');
  const chars = limpar(bruto, todos);
  if (!chars) return bruto;
  const gabarito = escolherGabarito(chars, gabaritos);
  // Conteudo que nao preenche o gabarito volta como veio, em vez de sair
  // pela metade e parecer corrompido.
  return chars.length === capacidade(gabarito) ? aplicar(chars, gabarito) : bruto;
}

const GABARITOS_EXIBICAO = {
  cpf: '###.###.###-##',
  cnpj: '**.***.***/****-##',
  'cpf-cnpj': ['###.###.###-##', '**.***.***/****-##'],
  documento: ['###.###.###-##', '**.***.***/****-##'],
  telefone: ['(##) ####-####', '(##) #####-####'],
  celular: '(##) #####-####',
  cep: '#####-###',
  cartao: '#### #### #### ####',
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
export function obscurecer(texto, visiveis = 2, modo = 'fim') {
  const s = String(texto ?? '');
  if (!s) return s;

  if (modo === 'email') return obscurecerEmail(s);

  const alfanumerico = (c) => /[0-9A-Za-z]/.test(c);
  const total = [...s].filter(alfanumerico).length;
  const mostrar = modo === 'tudo' ? 0 : visiveis;
  let vistos = 0;
  return [...s].map((c) => {
    if (!alfanumerico(c)) return modo === 'tudo' ? PONTO : c;
    vistos++;
    return vistos > total - mostrar ? c : PONTO;
  }).join('');
}

/**
 * E-mail esconde ao contrario do resto: o dominio e o que ajuda a reconhecer a
 * conta, e a parte local e o que identifica a pessoa. Guardar o fim, como no
 * padrao, revelaria `om.br` e esconderia justamente o util.
 */
export function obscurecerEmail(valor) {
  const s = String(valor ?? '');
  const arroba = s.lastIndexOf('@');
  if (arroba < 1) return obscurecer(s, 0, 'tudo');
  const local = s.slice(0, arroba);
  const dominio = s.slice(arroba);
  return local[0] + PONTO.repeat(Math.max(local.length - 1, 1)) + dominio;
}
