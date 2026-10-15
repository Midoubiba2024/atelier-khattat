/* Mises en situation : la calligraphie (SVG vectoriel) placée dans des décors dessinés en SVG. */
(function (root) {
  'use strict';
  // insère le SVG de la création (inline, avec viewBox) dans un rectangle du décor
  function embed(svg, x, y, w, h, mode) {
    return svg.replace('<svg ', `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMid ${mode || 'meet'}" `);
  }
  // rectangle de proportion a (= W/H) logé dans une boîte maxW × maxH
  function fit(a, maxW, maxH) { let w = maxW, h = w / a; if (h > maxH) { h = maxH; w = h * a; } return { w, h }; }
  const wrap = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" role="img"><defs>${defs}</defs>${body}</svg>`;
  const shadowF = (id, sd) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

  const SCENES = {
    // cadre au mur, passe-partout blanc
    wall(svg, a, info) {
      const f = fit(a, 470, 380), mat = 46, fr = 20;
      const iw = f.w, ih = f.h, ow = iw + 2 * (mat + fr), oh = ih + 2 * (mat + fr);
      const x = 600 - ow / 2, y = 340 - oh / 2;
      const defs = `<linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ebe1"/><stop offset="1" stop-color="#e2d7c5"/></linearGradient>
        <radialGradient id="ml" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <linearGradient id="mf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b2a1d"/><stop offset=".5" stop-color="#5a4130"/><stop offset="1" stop-color="#2a1d13"/></linearGradient>
        <linearGradient id="mfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b08a62"/><stop offset="1" stop-color="#8a6a49"/></linearGradient>
        ${shadowF('ms', 14)}`;
      let leaves = '';
      for (let i = 0; i < 9; i++) {
        const ang = -150 + i * 15, len = 120 + (i % 3) * 30;
        leaves += `<ellipse cx="0" cy="${-len / 2}" rx="13" ry="${len / 2}" fill="${i % 2 ? '#4f7a4a' : '#3f6a3c'}" transform="translate(1035 620) rotate(${ang + 90})"/>`;
      }
      const body = `<rect width="1200" height="800" fill="url(#mw)"/><rect width="1200" height="800" fill="url(#ml)"/>
        <rect y="688" width="1200" height="112" fill="url(#mfl)"/><rect y="676" width="1200" height="14" fill="#efe9de"/><rect y="688" width="1200" height="3" fill="#cfc4b2"/>
        <rect x="${x + 10}" y="${y + 18}" width="${ow}" height="${oh}" fill="#000" opacity=".28" filter="url(#ms)"/>
        <rect x="${x}" y="${y}" width="${ow}" height="${oh}" fill="url(#mf)"/>
        <rect x="${x + fr}" y="${y + fr}" width="${ow - 2 * fr}" height="${oh - 2 * fr}" fill="#fbfaf6"/>
        <rect x="${x + fr + mat - 3}" y="${y + fr + mat - 3}" width="${iw + 6}" height="${ih + 6}" fill="none" stroke="#e4ddd0" stroke-width="3"/>
        ${info.transparent ? `<rect x="${x + fr + mat}" y="${y + fr + mat}" width="${iw}" height="${ih}" fill="#fbfaf6"/>` : ''}
        ${embed(svg, x + fr + mat, y + fr + mat, iw, ih, 'meet')}
        <g>${leaves}</g><path d="M1000 625h70l-10 70h-50z" fill="#c9b79a"/><rect x="996" y="618" width="78" height="12" rx="4" fill="#b8a585"/>`;
      return wrap(defs, body);
    },
    // toile sur châssis au-dessus d'un canapé
    canvas(svg, a, info) {
      const f = fit(a, 560, 330);
      const x = 600 - f.w / 2, y = 250 - f.h / 2, d = 9;
      const defs = `<linearGradient id="cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ded6"/><stop offset="1" stop-color="#c7cec4"/></linearGradient>
        <linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c8a8f"/><stop offset="1" stop-color="#5d6a6e"/></linearGradient>
        ${shadowF('cb', 12)}`;
      const body = `<rect width="1200" height="800" fill="url(#cw)"/><rect y="730" width="1200" height="70" fill="#9c8f7c"/>
        <rect x="${x + 14}" y="${y + 20}" width="${f.w}" height="${f.h}" fill="#000" opacity=".25" filter="url(#cb)"/>
        <path d="M${x + f.w} ${y}l${d} ${d}v${f.h}l-${d} -${d}z" fill="#000" opacity=".35"/>
        <path d="M${x} ${y + f.h}l${d} ${d}h${f.w}l-${d} -${d}z" fill="#000" opacity=".22"/>
        <rect x="${x}" y="${y}" width="${f.w}" height="${f.h}" fill="${info.transparent ? '#f6f3ec' : '#ffffff'}"/>
        ${embed(svg, x, y, f.w, f.h, info.transparent ? 'meet' : 'slice')}
        <rect x="250" y="520" width="700" height="150" rx="34" fill="url(#cs)"/><rect x="215" y="560" width="90" height="170" rx="30" fill="#65747a"/><rect x="895" y="560" width="90" height="170" rx="30" fill="#65747a"/>
        <rect x="285" y="600" width="630" height="110" rx="22" fill="#738287"/><rect x="300" y="700" width="20" height="40" fill="#4a3c2c"/><rect x="880" y="700" width="20" height="40" fill="#4a3c2c"/>
        <rect x="330" y="545" width="150" height="80" rx="26" fill="#c9a96b" transform="rotate(-8 405 585)"/><rect x="720" y="545" width="150" height="80" rx="26" fill="#b5c1bf" transform="rotate(7 795 585)"/>`;
      return wrap(defs, body);
    },
    // enseigne au-dessus d'une vitrine
    sign(svg, a, info) {
      const bw = 820, bh = 210, f = fit(a, bw - 70, bh - 50);
      const bx = 600 - bw / 2, by = 90;
      const defs = `<linearGradient id="sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8dcc6"/><stop offset="1" stop-color="#d8c8ab"/></linearGradient>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b4a5a"/><stop offset=".45" stop-color="#5f7487"/><stop offset=".55" stop-color="#7d93a6"/><stop offset="1" stop-color="#34414f"/></linearGradient>
        <linearGradient id="sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2a26"/><stop offset="1" stop-color="#101814"/></linearGradient>
        ${shadowF('ss', 8)}`;
      let bricks = '';
      for (let r = 0; r < 26; r++) bricks += `<line x1="0" y1="${r * 32}" x2="1200" y2="${r * 32}" stroke="#cdbb9b" stroke-width="1.5"/>`;
      const body = `<rect width="1200" height="800" fill="url(#sw)"/>${bricks}
        <rect x="${bx + 6}" y="${by + 10}" width="${bw}" height="${bh}" fill="#000" opacity=".35" filter="url(#ss)"/>
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${info.transparent ? 'url(#sb)' : '#111'}"/>
        <rect x="${bx + 8}" y="${by + 8}" width="${bw - 16}" height="${bh - 16}" rx="4" fill="none" stroke="#c9a227" stroke-width="3"/>
        ${info.transparent ? '' : `<rect x="${bx + 14}" y="${by + 14}" width="${bw - 28}" height="${bh - 28}" fill="#fff"/>`}
        ${embed(svg, 600 - (info.transparent ? f.w : bw - 28) / 2, by + (info.transparent ? (bh - f.h) / 2 : 14), info.transparent ? f.w : bw - 28, info.transparent ? f.h : bh - 28, info.transparent ? 'meet' : 'slice')}
        <rect x="150" y="350" width="900" height="450" fill="#2a2420"/>
        <rect x="175" y="375" width="520" height="425" fill="url(#sg)"/><rect x="725" y="375" width="300" height="425" fill="#3a2f27"/>
        <rect x="745" y="395" width="260" height="190" fill="url(#sg)" opacity=".9"/><circle cx="985" cy="640" r="9" fill="#c9a227"/>
        <path d="M175 375l240 0-300 425h-0z" fill="#fff" opacity=".07"/><rect x="175" y="560" width="520" height="6" fill="#2a2420"/>`;
      return wrap(defs, body);
    },
    // t-shirt
    tshirt(svg, a, info) {
      const dark = info.light;
      const shirt = dark ? '#1f2328' : '#f7f6f2', shade = dark ? '#16191d' : '#e7e4dc';
      const f = fit(a, 250, 270);
      const defs = `<radialGradient id="tb" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#eceae5"/><stop offset="1" stop-color="#cfcbc2"/></radialGradient>
        <linearGradient id="tf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade}"/><stop offset=".25" stop-color="${shirt}"/><stop offset=".75" stop-color="${shirt}"/><stop offset="1" stop-color="${shade}"/></linearGradient>
        ${shadowF('tsh', 10)}`;
      const P = 'M455 95 Q600 150 745 95 L905 165 L990 330 L880 380 L840 315 L840 760 Q600 785 360 760 L360 315 L320 380 L210 330 L295 165 Z';
      const body = `<rect width="1200" height="800" fill="url(#tb)"/>
        <path d="${P}" fill="#000" opacity=".22" transform="translate(8 14)" filter="url(#tsh)"/>
        <path d="${P}" fill="url(#tf)"/>
        <path d="M455 95 Q600 150 745 95 Q700 175 600 178 Q500 175 455 95Z" fill="${shade}"/>
        <path d="M470 102 Q600 160 730 102" fill="none" stroke="${dark ? '#2c3137' : '#dcd8cf'}" stroke-width="10"/>
        ${embed(svg, 600 - f.w / 2, 245, f.w, f.h, 'meet')}
        <path d="M420 600 Q470 640 455 720 M760 560 Q730 640 760 730" fill="none" stroke="${dark ? '#2b3036' : '#e6e2d9'}" stroke-width="5" opacity=".8"/>`;
      return wrap(defs, body);
    },
    // cartes (visite, faire-part) posées sur une table
    cards(svg, a, info) {
      const cw = 470, ch = 280, f = fit(a, cw - 70, ch - 60);
      const defs = `<linearGradient id="kd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cbb08c"/><stop offset="1" stop-color="#a98a64"/></linearGradient>
        ${shadowF('ksh', 10)}`;
      let grain = '';
      for (let i = 0; i < 18; i++) grain += `<path d="M0 ${30 + i * 44} C300 ${10 + i * 44} 700 ${60 + i * 44} 1200 ${25 + i * 44}" stroke="#9a7c58" stroke-width="2" fill="none" opacity=".35"/>`;
      const back = info.light ? '#1f2328' : '#ece7dc';
      const face = info.transparent ? (info.light ? '#20262b' : '#fbfaf7') : '#ffffff';
      const body = `<rect width="1200" height="800" fill="url(#kd)"/>${grain}
        <g transform="rotate(9 640 360)"><rect x="420" y="230" width="${cw}" height="${ch}" rx="10" fill="#000" opacity=".3" filter="url(#ksh)" transform="translate(6 10)"/><rect x="420" y="230" width="${cw}" height="${ch}" rx="10" fill="${back}"/></g>
        <g transform="rotate(-6 560 420)"><rect x="330" y="285" width="${cw}" height="${ch}" rx="10" fill="#000" opacity=".32" filter="url(#ksh)" transform="translate(8 12)"/>
        <rect x="330" y="285" width="${cw}" height="${ch}" rx="10" fill="${face}"/>
        ${info.transparent ? embed(svg, 330 + (cw - f.w) / 2, 285 + (ch - f.h) / 2, f.w, f.h, 'meet') : `<clipPath id="kc"><rect x="330" y="285" width="${cw}" height="${ch}" rx="10"/></clipPath><g clip-path="url(#kc)">${embed(svg, 330, 285, cw, ch, 'slice')}</g>`}</g>`;
      return wrap(defs, body);
    },
    // fond d'écran de téléphone
    phone(svg, a, info) {
      const pw = 330, ph = 660, px = 600 - pw / 2, py = 70, sx = px + 16, sy = py + 16, sw = pw - 32, sh = ph - 32;
      const f = fit(a, sw - 40, sh - 200);
      const defs = `<linearGradient id="pb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9e4f1"/><stop offset="1" stop-color="#cfd9ea"/></linearGradient>
        <clipPath id="pc"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="38"/></clipPath>${shadowF('psh', 16)}`;
      const screenBg = info.transparent ? (info.light ? '#0f1320' : '#f4efe6') : '#000';
      const body = `<rect width="1200" height="800" fill="url(#pb)"/>
        <rect x="${px + 12}" y="${py + 20}" width="${pw}" height="${ph}" rx="52" fill="#000" opacity=".28" filter="url(#psh)"/>
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="52" fill="#15171b"/><rect x="${px + 3}" y="${py + 3}" width="${pw - 6}" height="${ph - 6}" rx="49" fill="none" stroke="#3a3e46" stroke-width="2"/>
        <g clip-path="url(#pc)"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${screenBg}"/>
        ${info.transparent ? embed(svg, sx + (sw - f.w) / 2, sy + 150 + (sh - 200 - f.h) / 2, f.w, f.h, 'meet') : embed(svg, sx, sy, sw, sh, 'slice')}
        <text x="${sx + 34}" y="${sy + 36}" font-family="system-ui,sans-serif" font-size="17" font-weight="600" fill="${info.light || !info.transparent ? '#fff' : '#111'}" opacity=".9">09:41</text>
        <text x="600" y="${sy + 120}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="58" font-weight="300" fill="${info.light || !info.transparent ? '#fff' : '#111'}" opacity=".85">09:41</text>
        <rect x="${600 - 60}" y="${sy + sh - 22}" width="120" height="5" rx="3" fill="${info.light || !info.transparent ? '#fff' : '#111'}" opacity=".6"/></g>
        <rect x="${600 - 55}" y="${sy + 10}" width="110" height="28" rx="14" fill="#000"/>`;
      return wrap(defs, body);
    },
    // mug
    mug(svg, a, info) {
      const mx = 390, my = 210, mw = 380, mh = 400;
      const f = fit(a, mw - 70, mh - 120);
      const body0 = info.light ? '#20252b' : '#fbfaf7';
      const defs = `<radialGradient id="ub" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#f3efe8"/><stop offset="1" stop-color="#d6cfc2"/></radialGradient>
        <linearGradient id="us" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity=".18"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
        <clipPath id="uc"><path d="M${mx} ${my} h${mw} v${mh - 40} q0 40 -40 40 h${-(mw - 80)} q-40 0 -40 -40z"/></clipPath>${shadowF('ush', 14)}`;
      const body = `<rect width="1200" height="800" fill="url(#ub)"/><ellipse cx="600" cy="${my + mh + 10}" rx="260" ry="26" fill="#000" opacity=".2" filter="url(#ush)"/>
        <path d="M${mx + mw - 6} ${my + 90} c120 -10 135 210 0 215" fill="none" stroke="${body0}" stroke-width="34" stroke-linecap="round"/>
        <path d="M${mx + mw - 6} ${my + 90} c120 -10 135 210 0 215" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="34" stroke-linecap="round"/>
        <g clip-path="url(#uc)"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="${body0}"/>
        ${info.transparent ? embed(svg, mx + (mw - f.w) / 2, my + 70 + (mh - 120 - f.h) / 2, f.w, f.h, 'meet') : embed(svg, mx + 30, my + 60, mw - 60, mh - 110, 'meet')}
        <rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="url(#us)"/></g>
        <ellipse cx="${mx + mw / 2}" cy="${my}" rx="${mw / 2}" ry="22" fill="${info.light ? '#2b3138' : '#eeebe4'}"/><ellipse cx="${mx + mw / 2}" cy="${my + 3}" rx="${mw / 2 - 16}" ry="15" fill="#3b2a20"/>`;
      return wrap(defs, body);
    }
  };
  const LIST = [['wall', 'Cadre au mur'], ['canvas', 'Toile'], ['sign', 'Enseigne'], ['tshirt', 'T-shirt'], ['cards', 'Cartes'], ['phone', 'Téléphone'], ['mug', 'Mug']];
  // svg : rendu inline de la scène (préfixe d'identifiants unique) ; a = W/H ; info = { transparent, light }
  function render(id, svg, a, info, prefix) {
    const f = SCENES[id] || SCENES.wall;
    const out = f(svg, a, info || {});
    if (!prefix) return out;
    // identifiants du décor préfixés (plusieurs décors peuvent cohabiter dans la page)
    return out.replace(/id="([a-z]+)"/g, 'id="' + prefix + '$1"').replace(/url\(#([a-z]+)\)/g, 'url(#' + prefix + '$1)');
  }
  root.KhattMockup = { render, LIST };
})(typeof self !== 'undefined' ? self : globalThis);
