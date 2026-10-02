# Segurança

## Versões com suporte

A versão publicada mais recente. Correção sai numa versão nova, e não em
remendo de versão antiga — o pacote é pequeno e a atualização é trocar o número
preso no CDN ou no `package.json`.

## Como relatar

Não abra issue pública para falha de segurança. Use o relato privado do
GitHub — aba **Security** do repositório, botão *Report a vulnerability* —, que
avisa só o mantenedor. Se ele não aparecer para você, me chame por mensagem
direta no perfil [@JuniorCarlini](https://github.com/JuniorCarlini).

Conte o que dá para fazer com a falha, em que versão, e o caminho mínimo para
reproduzir. Respondo pelo mesmo canal.

## O que é falha aqui

A biblioteca roda inteira no navegador de quem visita a página, e não tem
servidor. O que importa é o que ela faz com conteúdo que veio de fora:

- HTML de terceiro que o editor ou o `.tuc-prose` exibem sem passar pela
  limpeza (`src/js/core/sanitize.js`);
- valor de atributo `data-*` que vire código executado;
- upload direto que mande o arquivo, ou o CSRF, para origem diferente da página.

Configuração errada no projeto que usa a biblioteca — CSP ausente, servidor que
confia no nome do arquivo enviado — não é falha da Tucano, mas se o caminho
passar por uma API daqui, me conte do mesmo jeito.
