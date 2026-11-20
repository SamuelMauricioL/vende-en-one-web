import { test } from "node:test";
import assert from "node:assert/strict";

import { parseTikTokProfileUrl } from "./tiktok-url.ts";

test("una URL completa del perfil devuelve el usuario sin arroba", () => {
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/@usuario"), "usuario");
});

test("una URL sin protocolo también se acepta", () => {
  assert.equal(parseTikTokProfileUrl("tiktok.com/@usuario"), "usuario");
});

test("una URL con barra final y query devuelve solo el usuario", () => {
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/@usuario/?lang=es"), "usuario");
});

test("el subdominio móvil se acepta igual", () => {
  assert.equal(parseTikTokProfileUrl("https://m.tiktok.com/@usuario"), "usuario");
});

test("un usuario con punto y guion bajo se conserva entero", () => {
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/@mi.tienda_1"), "mi.tienda_1");
});

test("el usuario se devuelve en minúsculas", () => {
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/@Usuario"), "usuario");
});

test("un host que no es TikTok se rechaza", () => {
  assert.equal(parseTikTokProfileUrl("https://www.youtube.com/@usuario"), null);
});

test("un dominio parecido pero ajeno se rechaza", () => {
  assert.equal(parseTikTokProfileUrl("https://nottiktok.com/@usuario"), null);
});

test("una URL de TikTok sin arroba no es un perfil", () => {
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/foryou"), null);
});

test("un texto vacío o sin usuario se rechaza", () => {
  assert.equal(parseTikTokProfileUrl(""), null);
  assert.equal(parseTikTokProfileUrl("   "), null);
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/@"), null);
});

test("una arroba pegada a mano también se acepta", () => {
  assert.equal(parseTikTokProfileUrl("@usuario"), "usuario");
});

test("un usuario inválido con caracteres prohibidos se rechaza", () => {
  assert.equal(parseTikTokProfileUrl("https://www.tiktok.com/@usuario!"), null);
});
