# Barrido de comentarios

Retirar los comentarios de código de la web. La razón de una decisión vive en los tests, no en un comentario junto al código.

## Specs

S1. Se retiran los comentarios de `src/`. Los que son directivas no se tocan porque son comportamiento, no texto: `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`, `/// <reference`, `prettier-ignore`, `webpackChunkName`, `vite-ignore`.

S2. Los comentarios dentro de archivos de test se conservan: son el lugar donde se declara la razón.

## Tasks

- **T1 · S1 · R-WEB** — barrido de `src/`, conservando directivas (171 líneas de `//` y 117 de bloque).

## Log

L1. «soluciona todo lo que está pendiente, me avisas cuando termines, puedes usar todos los sub agentes que necesites, al final deja todos los worktrees cerrados porque todo debe ir a main y pusheado al origin, nada debe quedar local»

L2. El barrido va al final del trabajo de la API para no chocar con los cambios de comportamiento que están en curso en ese repositorio.
