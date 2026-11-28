// Automatisch übernommen aus brettspiele/index.html (werkstatt/regeln_raum.py). Nicht von Hand ändern.
// Regeln und Computer von Dame, Mühle, Mangala und Tavla, dieselben wie im Spiel Brettspiele.
(function () {
// <<< AIEngines
const AIEngines = {
  /* Tic Tac Toe: vollständiges Minimax (unbesiegbar). */
  tictactoe(board, aiPlayer) {
    const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const evaluate = (b) => {
      for (const [a, c, d] of WIN) {
        if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
      }
      return b.every(x => x !== null) ? 'Draw' : null;
    };
    const other = p => (p === 'X' ? 'O' : 'X');
    // Tiefe im Wert: schneller Sieg zählt mehr, späte Niederlage weniger (S-W02, Tipp zeigt den direkten Sieg).
    const minimax = (b, player, tiefe = 0) => {
      const w = evaluate(b);
      if (w) return { score: w === aiPlayer ? 10 - tiefe : w === 'Draw' ? 0 : tiefe - 10 };
      let best = null;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = player;
        const s = minimax(b, other(player), tiefe + 1).score;
        b[i] = null;
        if (!best || (player === aiPlayer ? s > best.score : s < best.score)) {
          best = { index: i, score: s };
        }
      }
      return best;
    };
    return minimax([...board], aiPlayer).index;
  },

  /* Vier gewinnt: Alpha-Beta mit Tiefenbegrenzung und
     Fenster-Heuristik. */
  connect4(board, aiPlayer, depth) {
    const ROWS = 6, COLS = 7;
    const opp = aiPlayer === 'R' ? 'Y' : 'R';
    const dropRow = (b, c) => {
      for (let r = ROWS - 1; r >= 0; r--) if (b[r * COLS + c] === null) return r;
      return -1;
    };
    const validCols = (b) => {
      const out = [];
      for (let c = 0; c < COLS; c++) if (dropRow(b, c) !== -1) out.push(c);
      return out;
    };
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const evaluate = (b) => {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = b[r * COLS + c];
          if (!v) continue;
          for (const [dr, dc] of dirs) {
            let ok = true;
            for (let k = 1; k < 4; k++) {
              const nr = r + dr * k, nc = c + dc * k;
              if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr * COLS + nc] !== v) { ok = false; break; }
            }
            if (ok) return v;
          }
        }
      }
      return b.every(x => x !== null) ? 'Draw' : null;
    };
    const heuristic = (b) => {
      let score = 0;
      const centerCol = Math.floor(COLS / 2);
      for (let r = 0; r < ROWS; r++) if (b[r * COLS + centerCol] === aiPlayer) score += 3;
      const scoreWindow = (cells) => {
        const own = cells.filter(v => v === aiPlayer).length;
        const oppN = cells.filter(v => v === opp).length;
        const empty = cells.filter(v => v === null).length;
        if (own === 4) return 100000;
        if (own === 3 && empty === 1) return 5;
        if (own === 2 && empty === 2) return 2;
        if (oppN === 3 && empty === 1) return -4;
        return 0;
      };
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          for (const [dr, dc] of dirs) {
            const windowCells = [];
            let valid = true;
            for (let k = 0; k < 4; k++) {
              const nr = r + dr * k, nc = c + dc * k;
              if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { valid = false; break; }
              windowCells.push(b[nr * COLS + nc]);
            }
            if (valid) score += scoreWindow(windowCells);
          }
        }
      }
      return score;
    };
    const drop = (b, c, p) => {
      const nb = [...b];
      nb[dropRow(nb, c) * COLS + c] = p;
      return nb;
    };
    const ab = (b, d, alpha, beta, maxing) => {
      const w = evaluate(b);
      const cols = validCols(b);
      if (w) {
        if (w === aiPlayer) return { score: 1000000 + d };
        if (w === opp) return { score: -1000000 - d };
        return { score: 0 };
      }
      if (d === 0 || cols.length === 0) return { score: heuristic(b) };
      let bestCol = cols[Math.floor(cols.length / 2)];
      if (maxing) {
        let v = -Infinity;
        for (const c of cols) {
          const { score } = ab(drop(b, c, aiPlayer), d - 1, alpha, beta, false);
          if (score > v) { v = score; bestCol = c; }
          alpha = Math.max(alpha, v);
          if (alpha >= beta) break;
        }
        return { score: v, col: bestCol };
      } else {
        let v = Infinity;
        for (const c of cols) {
          const { score } = ab(drop(b, c, opp), d - 1, alpha, beta, true);
          if (score < v) { v = score; bestCol = c; }
          beta = Math.min(beta, v);
          if (alpha >= beta) break;
        }
        return { score: v, col: bestCol };
      }
    };
    return ab(board, depth, -Infinity, Infinity, true).col;
  },

  /* Reversi: Minimax mit Ecken-Gewichtsmatrix + Mobilitätsbonus.
     Passen-Regel wird in der Suche berücksichtigt. */
  othello(board, aiPlayer, depth) {
    const WEIGHTS = [
      100,-20, 10,  5,  5, 10,-20,100,
      -20,-50, -2, -2, -2, -2,-50,-20,
       10, -2, -1, -1, -1, -1, -2, 10,
        5, -2, -1, -1, -1, -1, -2,  5,
        5, -2, -1, -1, -1, -1, -2,  5,
       10, -2, -1, -1, -1, -1, -2, 10,
      -20,-50, -2, -2, -2, -2,-50,-20,
      100,-20, 10,  5,  5, 10,-20,100
    ];
    const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const other = p => (p === 'B' ? 'W' : 'B');
    const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const getFlips = (b, row, col, player) => {
      if (b[row * 8 + col] !== null) return [];
      const opp = other(player);
      const flips = [];
      for (const [dr, dc] of DIRS) {
        let r = row + dr, c = col + dc;
        const line = [];
        while (inB(r, c) && b[r * 8 + c] === opp) { line.push([r, c]); r += dr; c += dc; }
        if (line.length > 0 && inB(r, c) && b[r * 8 + c] === player) flips.push(...line);
      }
      return flips;
    };
    const validMoves = (b, player) => {
      const out = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (getFlips(b, r, c, player).length > 0) out.push([r, c]);
      }
      return out;
    };
    const applyMove = (b, r, c, player) => {
      const nb = [...b];
      nb[r * 8 + c] = player;
      for (const [fr, fc] of getFlips(b, r, c, player)) nb[fr * 8 + fc] = player;
      return nb;
    };
    const opponent = other(aiPlayer);
    const heuristic = (b) => {
      let score = 0;
      for (let i = 0; i < 64; i++) {
        if (b[i] === aiPlayer) score += WEIGHTS[i];
        else if (b[i] === opponent) score -= WEIGHTS[i];
      }
      score += (validMoves(b, aiPlayer).length - validMoves(b, opponent).length) * 2;
      return score;
    };
    const finalScore = (b) => {
      let my = 0, opp = 0;
      for (const cell of b) {
        if (cell === aiPlayer) my++; else if (cell === opponent) opp++;
      }
      if (my > opp) return 100000 + (my - opp);
      if (my < opp) return -100000 - (opp - my);
      return 0;
    };
    const minimax = (b, turnPlayer, d) => {
      const moves = validMoves(b, turnPlayer);
      const oppMoves = validMoves(b, other(turnPlayer));
      if (moves.length === 0 && oppMoves.length === 0) return { score: finalScore(b), move: null };
      if (d === 0) return { score: heuristic(b), move: null };
      if (moves.length === 0) {
        const { score } = minimax(b, other(turnPlayer), d - 1);
        return { score, move: null };
      }
      const maxing = turnPlayer === aiPlayer;
      let best = maxing ? -Infinity : Infinity;
      let bestMove = moves[0];
      for (const [r, c] of moves) {
        const { score } = minimax(applyMove(b, r, c, turnPlayer), other(turnPlayer), d - 1);
        if (maxing ? score > best : score < best) { best = score; bestMove = [r, c]; }
      }
      return { score: best, move: bestMove };
    };
    return minimax(board, aiPlayer, depth).move;
  },

  /* Mangala (Kalaha-Regeln): Alpha-Beta über eigene, in sich
     geschlossene Zug-Simulation (Aussäen, Zusatzzug bei eigenem
     Kalaha, Aussetzer-Regel), da Mangala keine externe Bibliothek
     wie Schach braucht — die Regeln sind kompakt genug für eine
     reine Funktion. */
  mangala(board, aiPlayer, depth) {
    const STORE_A = 6, STORE_B = 13;
    const ownPits = p => p === 'A' ? [0,1,2,3,4,5] : [7,8,9,10,11,12];
    const ownStore = p => p === 'A' ? STORE_A : STORE_B;
    const oppStore = p => p === 'A' ? STORE_B : STORE_A;
    const opponent = p => p === 'A' ? 'B' : 'A';

    const simulate = (b, player, pit) => {
      const nb = [...b];
      let stones = nb[pit];
      nb[pit] = 0;
      let idx = pit;
      const skip = oppStore(player);
      while (stones > 0) {
        idx = (idx + 1) % 14;
        if (idx === skip) continue;
        nb[idx]++; stones--;
      }
      const last = idx;
      const store = ownStore(player);
      const extraTurn = last === store;
      if (!extraTurn && ownPits(player).includes(last) && nb[last] === 1) {
        const opp = 12 - last;
        if (nb[opp] > 0) {
          nb[store] += nb[opp] + nb[last];
          nb[opp] = 0; nb[last] = 0;
        }
      }
      const sideEmpty = p => ownPits(p).every(i => nb[i] === 0);
      let finished = false;
      if (sideEmpty('A') || sideEmpty('B')) {
        for (const p of ['A', 'B']) {
          const st = ownStore(p);
          for (const i of ownPits(p)) { nb[st] += nb[i]; nb[i] = 0; }
        }
        finished = true;
      }
      return { board: nb, nextPlayer: extraTurn ? player : opponent(player), finished };
    };

    const validMoves = (b, player) => ownPits(player).filter(i => b[i] > 0);
    const evaluate = (b) => b[ownStore(aiPlayer)] - b[ownStore(opponent(aiPlayer))];

    const minimax = (b, player, d, alpha, beta) => {
      const moves = validMoves(b, player);
      if (d === 0 || moves.length === 0) return { score: evaluate(b) };
      const maximizing = player === aiPlayer;
      let best = maximizing ? -Infinity : Infinity;
      let bestMove = moves[0];
      for (const m of moves) {
        const { board: nb, nextPlayer, finished } = simulate(b, player, m);
        const score = finished ? evaluate(nb) : minimax(nb, nextPlayer, d - 1, alpha, beta).score;
        if (maximizing ? score > best : score < best) { best = score; bestMove = m; }
        if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
        if (alpha >= beta) break;
      }
      return { score: best, move: bestMove };
    };

    return minimax(board, aiPlayer, depth, -Infinity, Infinity).move;
  },

  /* Mühle (S-W15): Alpha-Beta über ganze Züge (Setzen oder Ziehen, bei
     einer Mühle samt Wegnahme). stand = Spielstand wie MuehleEntity.toJSON().
     Tiefe in Halbzügen; knotenMax begrenzt die Rechenarbeit (statt einer
     Uhr): wird die Grenze überschritten, gilt das Ergebnis der letzten
     vollständig gerechneten Tiefe. Liefert {setzen}|{von,nach} mit
     optional {entfernen}, oder {entfernen} bei offener Wegnahme. */
  muehle(stand, spieler, tiefe, knotenMax) {
    const MILLS = [], ADJ = Array.from({ length: 24 }, () => []);
    const link = (a, b) => { ADJ[a].push(b); ADJ[b].push(a); };
    for (let r = 0; r < 3; r++) {
      const o = r * 8;
      MILLS.push([o, o + 1, o + 2], [o + 2, o + 3, o + 4], [o + 4, o + 5, o + 6], [o + 6, o + 7, o]);
      for (let i = 0; i < 8; i++) link(o + i, o + ((i + 1) % 8));
    }
    for (const p of [1, 3, 5, 7]) { MILLS.push([p, 8 + p, 16 + p]); link(p, 8 + p); link(8 + p, 16 + p); }
    const AN = Array.from({ length: 24 }, () => []);
    MILLS.forEach(m => m.forEach(i => AN[i].push(m)));
    const gegner = p => (p === 'W' ? 'B' : 'W');
    const inMuehle = (c, i, p) => AN[i].some(m => c[m[0]] === p && c[m[1]] === p && c[m[2]] === p);
    const nehmbar = (c, p) => {
      const alle = [], frei = [];
      for (let i = 0; i < 24; i++) if (c[i] === p) { alle.push(i); if (!inMuehle(c, i, p)) frei.push(i); }
      return frei.length ? frei : alle;
    };
    const zuege = (s) => {
      const p = s.p, o = gegner(p), c = s.c, out = [];
      if (s.pend) { for (const r of nehmbar(c, o)) out.push({ entfernen: r }); return out; }
      const mit = (basis, ziel) => {
        if (s.on[o] > 0 && inMuehle(c, ziel, p)) { for (const r of nehmbar(c, o)) out.push({ ...basis, entfernen: r }); }
        else out.push(basis);
      };
      if (s.ph === 'placing') {
        for (let i = 0; i < 24; i++) if (c[i] === null) { c[i] = p; mit({ setzen: i }, i); c[i] = null; }
      } else {
        const springt = s.on[p] === 3;
        for (let von = 0; von < 24; von++) {
          if (c[von] !== p) continue;
          const ziele = springt ? [...Array(24).keys()].filter(i => c[i] === null) : ADJ[von].filter(i => c[i] === null);
          for (const nach of ziele) { c[von] = null; c[nach] = p; mit({ von, nach }, nach); c[nach] = null; c[von] = p; }
        }
      }
      // Züge mit Wegnahme zuerst (stabile Sortierung: sonst feste Reihenfolge der Punkte)
      return out.sort((a, b) => (a.entfernen === undefined) - (b.entfernen === undefined));
    };
    const fuehreAus = (s, z) => {
      const c = s.c.slice(), set = { W: s.set.W, B: s.set.B }, on = { W: s.on.W, B: s.on.B }, p = s.p, o = gegner(p);
      let ph = s.ph;
      if (z.setzen !== undefined) { c[z.setzen] = p; set[p]--; on[p]++; if (set.W === 0 && set.B === 0) ph = 'moving'; }
      else if (z.von !== undefined) { c[z.von] = null; c[z.nach] = p; }
      if (z.entfernen !== undefined) { c[z.entfernen] = null; on[o]--; }
      return { c, p: o, set, on, ph, pend: false };
    };
    const kannZiehen = (s, p) => {
      if (s.on[p] === 3) return s.c.includes(null);
      for (let i = 0; i < 24; i++) if (s.c[i] === p && ADJ[i].some(n => s.c[n] === null)) return true;
      return false;
    };
    const sieger = (s) => {
      if (s.ph !== 'moving' || s.pend) return null;
      if (s.on.W < 3) return 'B';
      if (s.on.B < 3) return 'W';
      return kannZiehen(s, s.p) ? null : gegner(s.p);
    };
    const drohungen = (s, x) => {
      const springt = s.set[x] > 0 || s.on[x] === 3, c = s.c, gesehen = [];
      for (const m of MILLS) {
        let eigene = 0, frei = -1, leer = 0;
        for (const i of m) { if (c[i] === x) eigene++; else if (c[i] === null) { leer++; frei = i; } }
        if (eigene !== 2 || leer !== 1 || gesehen.includes(frei)) continue;
        if (springt || ADJ[frei].some(n => c[n] === x && !m.includes(n))) gesehen.push(frei);
      }
      return gesehen.length;
    };
    const beweglich = (s, x) => {
      if (s.on[x] === 3) return 0;
      let n = 0;
      for (let i = 0; i < 24; i++) if (s.c[i] === x) for (const k of ADJ[i]) if (s.c[k] === null) n++;
      return n;
    };
    // Bewertung aus Sicht von x (S-W15, Rechenmodell)
    const bewerte = (s, x) => {
      const y = gegner(x);
      let w = 100 * ((s.on[x] + s.set[x]) - (s.on[y] + s.set[y]));
      for (const m of MILLS) { const a = s.c[m[0]]; if (a && a === s.c[m[1]] && a === s.c[m[2]]) w += a === x ? 8 : -8; }
      w += 3 * (drohungen(s, x) - drohungen(s, y));
      if (s.ph === 'moving') w += beweglich(s, x) - beweglich(s, y);
      return w;
    };
    // Wiederholung (S-W15): Zähler wie in der Entity; dritte gleiche Ziehstellung = Unentschieden (Wert 0).
    // Eine Wegnahme macht frühere Stellungen unerreichbar, der Zweig zählt dann neu.
    const schluessel = s => s.c.map(x => x || '-').join('') + s.p;
    const kind = (s, z, hist) => {
      const k = fuehreAus(s, z), h = z.entfernen !== undefined ? new Map() : hist;
      let key = null;
      if (k.ph === 'moving') { key = schluessel(k); h.set(key, (h.get(key) || 0) + 1); }
      return { k, h, key };
    };
    let knoten = 0, abbruch = false;
    const suche = (s, d, a, b, ply, hist, key) => {
      if (++knoten > knotenMax) { abbruch = true; return 0; }
      const ende = sieger(s);
      if (ende) return ende === s.p ? 100000 - ply : ply - 100000;
      if (key !== null && hist.get(key) >= 3) return 0;
      if (d === 0) return bewerte(s, s.p);
      let best = -Infinity;
      for (const z of zuege(s)) {
        const { k, h, key: kk } = kind(s, z, hist);
        const v = -suche(k, d - 1, -b, -a, ply + 1, h, kk);
        if (kk !== null) h.set(kk, h.get(kk) - 1);
        if (abbruch) return 0;
        if (v > best) best = v;
        if (v > a) a = v;
        if (a >= b) break;
      }
      return best;
    };
    const start = { c: stand.cells.slice(), p: stand.currentPlayer, set: { ...stand.piecesToPlace }, on: { ...stand.piecesOnBoard }, ph: stand.phase, pend: !!stand.pendingRemoval };
    if (start.p !== spieler) return null;
    const alle = zuege(start);
    if (!alle.length) return null;
    const wurzel = new Map(Object.entries(stand.stellungen || {}));
    let bester = alle[0];
    for (let d = 1; d <= tiefe; d++) {
      let a = -Infinity, bz = null;
      for (const z of alle) {
        const { k, h, key } = kind(start, z, wurzel);
        const v = -suche(k, d - 1, -Infinity, -a, 1, h, key);
        if (key !== null) h.set(key, h.get(key) - 1);
        if (abbruch) break;
        if (v > a) { a = v; bz = z; }
      }
      if (abbruch) break;
      bester = bz;
    }
    return bester;
  },

  /* S-W23: Dame (türkische Regeln). Alpha-Beta über ganze Züge; die Regeln
     kommen aus AIEngines.dameZuege und AIEngines.dameSetze (dieselben
     Funktionen wie in DameEntity). stand = { cells }. Liefert den besten
     Zug { von, pfad, schlaege } oder null. Bei gleichem Wert gewinnt der
     erste Zug, das Ergebnis ist also wiederholbar. */
  dame(stand, spieler, tiefe, knotenMax) {
    const andere = p => (p === 'W' ? 'B' : 'W');
    let knoten = 0, abbruch = false;
    const wert = (c, p) => {
      let s = 0;
      for (let i = 0; i < 64; i++) {
        const v = c[i];
        if (v === null) continue;
        const r = i >> 3;
        const w = v.length === 2 ? 450 : 100 + 4 * (v === 'W' ? 6 - r : r - 1);
        s += v[0] === p ? w : -w;
      }
      return s;
    };
    // Wert aus Sicht von p, der am Zug ist. Schläge sind Pflicht, deshalb wird bei offenem Schlag weitergerechnet.
    const suche = (c, p, t, a, b, ebene) => {
      knoten++;
      const zuege = AIEngines.dameZuege(c, p);
      if (!zuege.length) return -100000 + ebene;
      const schlag = zuege[0].schlaege.length > 0;
      if (knoten > knotenMax) { abbruch = true; return wert(c, p); }
      if ((t <= 0 && !schlag) || ebene >= 24) return wert(c, p);
      let best = -Infinity;
      for (const z of zuege) {
        const w = -suche(AIEngines.dameSetze(c, z), andere(p), t - 1, -b, -a, ebene + 1);
        if (w > best) best = w;
        if (best > a) a = best;
        if (a >= b) break;
      }
      return best;
    };
    const zuege = AIEngines.dameZuege(stand.cells, spieler);
    if (!zuege.length) return null;
    let best = null, bw = -Infinity;
    for (const z of zuege) {
      const w = -suche(AIEngines.dameSetze(stand.cells, z), andere(spieler), tiefe - 1, -Infinity, -bw, 1);
      // Rechengrenze erreicht: nur vollständig bewertete Züge zählen (der erste gilt immer).
      if (abbruch && best !== null) break;
      if (w > bw) { bw = w; best = z; }
    }
    return best;
  }
};
// >>> AIEngines
// <<< MangalaEntity
class MangalaEntity {
  static STORE_A = 6;
  static STORE_B = 13;
  static STONES_PER_PIT = 4;

  constructor() {
    this.reset();
  }

  reset() {
    this.cells = Array(14).fill(MangalaEntity.STONES_PER_PIT);
    this.cells[MangalaEntity.STORE_A] = 0;
    this.cells[MangalaEntity.STORE_B] = 0;
    this.currentPlayer = 'A';
    this.finished = false;
    this.lastExtraTurn = false; // für die Status-Anzeige der UI
  }

  _opponent(p) { return p === 'A' ? 'B' : 'A'; }
  _ownStore(p) { return p === 'A' ? MangalaEntity.STORE_A : MangalaEntity.STORE_B; }
  _opponentStore(p) { return p === 'A' ? MangalaEntity.STORE_B : MangalaEntity.STORE_A; }
  _ownPits(p) { return p === 'A' ? [0,1,2,3,4,5] : [7,8,9,10,11,12]; }

  isValidMove(pit) {
    return !this.finished && this._ownPits(this.currentPlayer).includes(pit) && this.cells[pit] > 0;
  }

  getValidMoves(player = this.currentPlayer) {
    return this._ownPits(player).filter(i => this.cells[i] > 0);
  }

  applyMove(pit) {
    if (!this.isValidMove(pit)) throw new Error(`Ungültiger Zug auf Grube ${pit}`);
    const player = this.currentPlayer;
    let stones = this.cells[pit];
    this.cells[pit] = 0;
    let idx = pit;
    const skip = this._opponentStore(player);
    while (stones > 0) {
      idx = (idx + 1) % 14;
      if (idx === skip) continue; // gegnerisches Kalaha wird beim Aussäen übersprungen
      this.cells[idx]++;
      stones--;
    }

    const last = idx;
    const store = this._ownStore(player);
    const extraTurn = last === store; // Zusatzzug: letzter Stein im eigenen Kalaha

    // Aussetzer-Regel: letzter Stein landet in einer zuvor leeren
    // eigenen Grube (jetzt genau 1 Stein) -> diese und die
    // gegenüberliegende gegnerische Grube wandern komplett ins
    // eigene Kalaha.
    if (!extraTurn && this._ownPits(player).includes(last) && this.cells[last] === 1) {
      const opposite = 12 - last;
      if (this.cells[opposite] > 0) {
        this.cells[store] += this.cells[opposite] + this.cells[last];
        this.cells[opposite] = 0;
        this.cells[last] = 0;
      }
    }

    const result = this._checkGameState();
    if (result) return result;

    this.lastExtraTurn = extraTurn;
    if (!extraTurn) this.currentPlayer = this._opponent(player);
    return null;
  }

  _sideEmpty(player) {
    return this._ownPits(player).every(i => this.cells[i] === 0);
  }

  // Ist eine Seite komplett leer, wandern die restlichen Steine der
  // anderen Seite in deren Kalaha — Standard-Kalaha-Regel.
  _checkGameState() {
    if (!this._sideEmpty('A') && !this._sideEmpty('B')) return null;
    for (const p of ['A', 'B']) {
      const store = this._ownStore(p);
      for (const i of this._ownPits(p)) {
        this.cells[store] += this.cells[i];
        this.cells[i] = 0;
      }
    }
    this.finished = true;
    const a = this.cells[MangalaEntity.STORE_A];
    const b = this.cells[MangalaEntity.STORE_B];
    return { winner: a === b ? 'Draw' : (a > b ? 'A' : 'B'), line: null };
  }

  toJSON() {
    return { cells: [...this.cells], currentPlayer: this.currentPlayer, finished: this.finished, lastExtraTurn: this.lastExtraTurn };
  }

  loadFromJSON(data) {
    this.cells = [...data.cells];
    this.currentPlayer = data.currentPlayer;
    this.finished = data.finished;
    this.lastExtraTurn = data.lastExtraTurn ?? false;
  }
}
// >>> MangalaEntity
// <<< tavlaRegelwerk
function tavlaRegelwerk() {
  const R = {};
  const gegner = p => (p === 'A' ? 'B' : 'A');
  const vz = p => (p === 'A' ? 1 : -1);
  const richtung = p => (p === 'A' ? -1 : 1);
  const weg = (p, i) => (p === 'A' ? i + 1 : 24 - i);              // Abstand bis zum Abtragen
  const eig = (s, p, i) => Math.max(0, s.pkt[i] * vz(p));
  const geg = (s, p, i) => Math.max(0, -s.pkt[i] * vz(p));
  const einwurf = (p, w) => (p === 'A' ? 24 - w : w - 1);
  const kopie = s => ({ pkt: s.pkt.slice(), bar: { A: s.bar.A, B: s.bar.B }, ab: { A: s.ab.A, B: s.ab.B } });
  const schluessel = s => s.pkt.join(',') + '|' + s.bar.A + ',' + s.bar.B + '|' + s.ab.A + ',' + s.ab.B;
  const ohne = (rest, w) => { const r = rest.slice(); r.splice(r.indexOf(w), 1); return r; };
  const speicher = new Map();

  R.start = () => {
    const pkt = Array(24).fill(0);
    pkt[23] = 2; pkt[12] = 5; pkt[7] = 3; pkt[5] = 5;
    pkt[0] = -2; pkt[11] = -5; pkt[16] = -3; pkt[18] = -5;
    return { pkt, bar: { A: 0, B: 0 }, ab: { A: 0, B: 0 } };
  };
  R.gegner = gegner;
  R.weg = weg;
  R.schluessel = schluessel;

  // Alle Steine im Heimfeld, Bar leer: Abtragen erlaubt
  R.heimfertig = (s, p) => {
    if (s.bar[p] > 0) return false;
    for (let i = 0; i < 24; i++) if (eig(s, p, i) > 0 && weg(p, i) > 6) return false;
    return true;
  };

  // Einzelne Züge für alle verschiedenen Würfelwerte in rest (ohne Pflichtregel)
  R.einzelzuege = (s, p, rest) => {
    const out = [], werte = [...new Set(rest)];
    const heim = R.heimfertig(s, p);
    for (const w of werte) {
      if (s.bar[p] > 0) {
        const t = einwurf(p, w);
        if (geg(s, p, t) < 2) out.push({ von: 'bar', nach: t, w });
        continue;
      }
      for (let i = 0; i < 24; i++) {
        if (eig(s, p, i) < 1) continue;
        const t = i + richtung(p) * w;
        if (t >= 0 && t < 24) { if (geg(s, p, t) < 2) out.push({ von: i, nach: t, w }); continue; }
        if (!heim) continue;
        if (weg(p, i) === w) { out.push({ von: i, nach: 'ab', w }); continue; }
        if (weg(p, i) < w) {
          let weiter = false;
          for (let j = 0; j < 24; j++) if (eig(s, p, j) > 0 && weg(p, j) > weg(p, i)) { weiter = true; break; }
          if (!weiter) out.push({ von: i, nach: 'ab', w });
        }
      }
    }
    return out;
  };

  // Zug ausführen: neuer Stand und ob geschlagen wurde (der alte Stand bleibt unverändert)
  R.wende = (s, p, z) => {
    const n = kopie(s), v = vz(p), o = gegner(p);
    let schlag = false;
    if (z.von === 'bar') n.bar[p]--; else n.pkt[z.von] -= v;
    if (z.nach === 'ab') n.ab[p]++;
    else {
      if (geg(n, p, z.nach) === 1) { n.pkt[z.nach] = 0; n.bar[o]++; schlag = true; }
      n.pkt[z.nach] += v;
    }
    return { s: n, schlag };
  };

  // Größtmögliche Zahl der noch nutzbaren Würfel ab diesem Stand
  const laenge = (s, p, rest) => {
    if (!rest.length) return 0;
    const k = p + schluessel(s) + '|' + rest.slice().sort().join('');
    if (speicher.has(k)) return speicher.get(k);
    let m = 0;
    for (const z of R.einzelzuege(s, p, rest)) {
      const l = 1 + laenge(R.wende(s, p, z).s, p, ohne(rest, z.w));
      if (l > m) m = l;
      if (m === rest.length) break;
    }
    if (speicher.size > 40000) speicher.clear();
    speicher.set(k, m);
    return m;
  };

  // Erlaubte nächste Züge: Teil einer Folge mit größtmöglicher Würfelzahl; sonst der größere Würfel
  R.erlaubteErste = (s, p, rest) => {
    const alle = R.einzelzuege(s, p, rest);
    if (!alle.length) return [];
    const l = alle.map(z => 1 + laenge(R.wende(s, p, z).s, p, ohne(rest, z.w)));
    const m = Math.max(...l);
    let out = alle.filter((z, i) => l[i] === m);
    if (m === 1 && rest.length >= 2 && new Set(rest).size === 2) {
      const gross = Math.max(...rest);
      if (out.some(z => z.w === gross)) out = out.filter(z => z.w === gross);
    }
    return out;
  };

  // Alle vollständigen Runden (Folgen von Zügen) mit Endstand, je Endstand eine
  R.folgen = (s, p, rest, grenze = 400) => {
    const ergebnis = new Map(), besucht = new Set();
    const rec = (st, rr, folge) => {
      if (ergebnis.size >= grenze) return;
      const k = schluessel(st) + '|' + rr.slice().sort().join('');
      if (besucht.has(k)) return;
      besucht.add(k);
      const zuege = st.ab[p] === 15 ? [] : R.erlaubteErste(st, p, rr);
      if (!zuege.length) { const e = schluessel(st); if (!ergebnis.has(e)) ergebnis.set(e, { zuege: folge, s: st }); return; }
      for (const z of zuege) rec(R.wende(st, p, z).s, ohne(rr, z.w), folge.concat([{ von: z.von, nach: z.nach, w: z.w }]));
    };
    rec(s, rest, []);
    return [...ergebnis.values()];
  };

  // Eigene Einzelsteine, die der Gegner mit einem Wurf bis 6 Augen schlagen kann
  R.gefaehrdet = (s, p) => {
    const o = gegner(p), out = [];
    for (let i = 0; i < 24; i++) {
      if (eig(s, p, i) !== 1) continue;
      let nah = 99;
      if (s.bar[o] > 0) nah = Math.min(nah, Math.abs(i - (o === 'A' ? 24 : -1)));
      for (let j = 0; j < 24 && s.bar[o] === 0; j++) {
        if (eig(s, o, j) < 1) continue;
        const d = (i - j) * richtung(o);
        if (d >= 1) nah = Math.min(nah, d);
      }
      if (nah <= 6) out.push(i);
    }
    return out;
  };

  // Bewertung eines Stands aus Sicht von p (größer ist besser)
  R.bewerte = (s, p) => {
    const o = gegner(p);
    if (s.ab[p] === 15) return 1e6;
    if (s.ab[o] === 15) return -1e6;
    const pips = q => { let t = s.bar[q] * 25; for (let i = 0; i < 24; i++) t += eig(s, q, i) * weg(q, i); return t; };
    let w = pips(o) - pips(p) + 12 * (s.ab[p] - s.ab[o]) + 10 * s.bar[o] - 8 * s.bar[p];
    let lauf = 0, best = 0;
    for (let i = 0; i < 24; i++) {
      const c = eig(s, p, i);
      if (c >= 2) { w += 3 + (weg(p, i) <= 6 ? 2 : 0); lauf++; if (lauf > best) best = lauf; } else lauf = 0;
    }
    w += 1.5 * best * best;
    const gef = R.gefaehrdet(s, p);
    for (const i of gef) w -= 14 * (1 + weg(p, i) / 24);
    for (let i = 0; i < 24; i++) {
      if (eig(s, p, i) === 1 && !gef.includes(i)) {
        let hinter = false;
        for (let j = 0; j < 24 && !hinter; j++) if (eig(s, o, j) > 0 && (i - j) * richtung(o) >= 1) hinter = true;
        if (hinter || s.bar[o] > 0) w -= 5;
      }
    }
    return w;
  };
  return R;
}
// >>> tavlaRegelwerk
// <<< TavlaEntity
class TavlaEntity {
  static FORMAT = 1;
  constructor() {
    this.R = tavlaRegelwerk();
    this.reset();
  }

  reset() {
    const s = this.R.start();
    this.cells = s.pkt; this.bar = s.bar; this.ab = s.ab;
    this.currentPlayer = 'A';   // Weiß beginnt
    this.phase = 'wuerfeln';    // wuerfeln | ziehen
    this.wurf = []; this.rest = [];
    this.finished = false; this.winner = null; this.mars = false; this.punkte = 0;
    this.ausgesetzt = null; this.geschlagen = false; this.teilweise = false;
    this.wurfZaehler = 0;
  }

  _s() { return { pkt: this.cells, bar: this.bar, ab: this.ab }; }
  _wechsel() {
    this.currentPlayer = this.currentPlayer === 'A' ? 'B' : 'A';
    this.phase = 'wuerfeln'; this.rest = [];
  }

  // Würfel kommen von außen (Control); ungültige Werte werden abgelehnt
  setzeWurf(a, b) {
    if (this.finished || this.phase !== 'wuerfeln') return { invalid: true };
    const ok = x => Number.isInteger(x) && x >= 1 && x <= 6;
    if (!ok(a) || !ok(b)) return { invalid: true };
    this.wurf = [a, b];
    this.rest = a === b ? [a, a, a, a] : [a, b];
    this.phase = 'ziehen';
    this.wurfZaehler++;
    this.ausgesetzt = null; this.geschlagen = false; this.teilweise = false;
    if (!this.getValidMoves().length) {
      const wer = this.currentPlayer;
      this._wechsel();
      this.ausgesetzt = wer;
      return { invalid: false, ausgesetzt: wer };
    }
    return { invalid: false };
  }

  getValidMoves() {
    if (this.finished || this.phase !== 'ziehen') return [];
    return this.R.erlaubteErste(this._s(), this.currentPlayer, this.rest);
  }

  // Führt einen Zug aus (kleinster passender Würfel); liefert das Ergebnis der Partie oder null
  applyMove(von, nach) {
    const z = this.getValidMoves().filter(m => m.von === von && m.nach === nach).sort((a, b) => a.w - b.w)[0];
    if (!z) throw new Error(`Ungültiger Zug ${von} -> ${nach}`);
    const p = this.currentPlayer, r = this.R.wende(this._s(), p, z);
    this.cells = r.s.pkt; this.bar = r.s.bar; this.ab = r.s.ab;
    this.geschlagen = r.schlag;
    this.rest.splice(this.rest.indexOf(z.w), 1);
    if (this.ab[p] === 15) {
      const o = this.R.gegner(p);
      this.finished = true; this.winner = p;
      this.mars = this.ab[o] === 0; this.punkte = this.mars ? 2 : 1;
      this.phase = 'wuerfeln'; this.rest = [];
      return { winner: p, mars: this.mars, punkte: this.punkte, line: null };
    }
    if (!this.rest.length) this._wechsel();
    else if (!this.getValidMoves().length) { this.teilweise = true; this._wechsel(); }
    return null;
  }

  toJSON() {
    return { formatversion: TavlaEntity.FORMAT, cells: [...this.cells], bar: { ...this.bar }, ab: { ...this.ab },
      currentPlayer: this.currentPlayer, phase: this.phase, wurf: [...this.wurf], rest: [...this.rest],
      finished: this.finished, winner: this.winner, mars: this.mars, punkte: this.punkte,
      ausgesetzt: this.ausgesetzt, geschlagen: this.geschlagen, teilweise: this.teilweise, wurfZaehler: this.wurfZaehler };
  }

  // Prüft den gespeicherten Stand vollständig; bei Fehlern neue Partie und false
  loadFromJSON(d) {
    if (!TavlaEntity._gueltig(d)) { this.reset(); return false; }
    this.cells = [...d.cells]; this.bar = { A: d.bar.A, B: d.bar.B }; this.ab = { A: d.ab.A, B: d.ab.B };
    this.currentPlayer = d.currentPlayer; this.phase = d.phase;
    this.wurf = [...d.wurf]; this.rest = [...d.rest];
    this.finished = d.finished; this.winner = d.winner; this.mars = d.mars; this.punkte = d.punkte;
    this.ausgesetzt = d.ausgesetzt; this.geschlagen = d.geschlagen; this.teilweise = d.teilweise; this.wurfZaehler = d.wurfZaehler;
    if (this.phase === 'ziehen' && !this.finished && !this.getValidMoves().length) { this.reset(); return false; }
    return true;
  }

  static _gueltig(d) {
    const ganz = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (!d || typeof d !== 'object' || Array.isArray(d) || d.formatversion !== TavlaEntity.FORMAT) return false;
    if (!Array.isArray(d.cells) || d.cells.length !== 24 || !d.cells.every(v => ganz(v, -15, 15))) return false;
    for (const k of ['bar', 'ab']) if (!d[k] || typeof d[k] !== 'object' || !ganz(d[k].A, 0, 15) || !ganz(d[k].B, 0, 15)) return false;
    const a = d.cells.filter(v => v > 0).reduce((x, y) => x + y, 0) + d.bar.A + d.ab.A;
    const b = -d.cells.filter(v => v < 0).reduce((x, y) => x + y, 0) + d.bar.B + d.ab.B;
    if (a !== 15 || b !== 15) return false;
    if (d.currentPlayer !== 'A' && d.currentPlayer !== 'B') return false;
    if (d.phase !== 'wuerfeln' && d.phase !== 'ziehen') return false;
    const wuerfel = x => Array.isArray(x) && x.every(v => ganz(v, 1, 6));
    if (!wuerfel(d.wurf) || !wuerfel(d.rest) || (d.wurf.length !== 0 && d.wurf.length !== 2) || d.rest.length > 4) return false;
    if (d.phase === 'ziehen') {
      if (d.wurf.length !== 2 || !d.rest.length || !d.rest.every(v => d.wurf.includes(v))) return false;
      if (d.rest.length > 2 && d.wurf[0] !== d.wurf[1]) return false;
      const frei = d.wurf[0] === d.wurf[1] ? [d.wurf[0], d.wurf[0], d.wurf[0], d.wurf[0]] : d.wurf.slice();
      for (const v of d.rest) { const i = frei.indexOf(v); if (i < 0) return false; frei.splice(i, 1); }
    } else if (d.rest.length) return false;
    if (typeof d.finished !== 'boolean' || typeof d.mars !== 'boolean' || typeof d.geschlagen !== 'boolean' || typeof d.teilweise !== 'boolean') return false;
    if (!ganz(d.punkte, 0, 2) || !ganz(d.wurfZaehler, 0, 1e9)) return false;
    if (d.ausgesetzt !== null && d.ausgesetzt !== 'A' && d.ausgesetzt !== 'B') return false;
    if (d.finished) {
      if ((d.winner !== 'A' && d.winner !== 'B') || d.ab[d.winner] !== 15 || d.phase !== 'wuerfeln' || d.rest.length) return false;
      const verl = d.winner === 'A' ? 'B' : 'A';
      if (d.ab[verl] === 15 || d.mars !== (d.ab[verl] === 0) || d.punkte !== (d.mars ? 2 : 1)) return false;
    } else if (d.winner !== null || d.ab.A === 15 || d.ab.B === 15 || d.mars || d.punkte !== 0) return false;
    return true;
  }
}
// >>> TavlaEntity
// <<< AIEngines.tavla
AIEngines.tavla = function tavla(s, p, wuerfel, tiefe) {
  const R = tavlaRegelwerk(), o = R.gegner(p);
  const folgen = R.folgen(s, p, wuerfel);
  if (!folgen.length) return [];
  const mit = folgen.map(f => ({ f, w: R.bewerte(f.s, p) })).sort((a, b) => b.w - a.w);
  if (tiefe < 2 || mit.length === 1) return mit[0].f.zuege;
  let beste = null, bestW = -Infinity;
  for (const c of mit.slice(0, 6)) {
    if (c.f.s.ab[p] === 15) return c.f.zuege;
    let summe = 0;
    for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) {
      const rest = a === b ? [a, a, a, a] : [a, b], gew = a === b ? 1 : 2;
      const antw = R.folgen(c.f.s, o, rest, 60);
      let wo = antw.length ? -Infinity : R.bewerte(c.f.s, o);
      for (const x of antw) { const v = R.bewerte(x.s, o); if (v > wo) wo = v; }
      summe += gew * (-wo);
    }
    const w = summe / 36;
    if (w > bestW) { bestW = w; beste = c; }
  }
  return beste.f.zuege;
};
// >>> AIEngines.tavla
// <<< MuehleEntity
class MuehleEntity {
  // 16 Mühlelinien: je 4 pro Ring (außen/mitte/innen) + 4 radiale
  // Verbindungen über die Mittelpunkte der Ringe.
  static MILLS = (() => {
    const mills = [];
    for (let ring = 0; ring < 3; ring++) {
      const o = ring * 8;
      mills.push([o + 0, o + 1, o + 2]);
      mills.push([o + 2, o + 3, o + 4]);
      mills.push([o + 4, o + 5, o + 6]);
      mills.push([o + 6, o + 7, o + 0]);
    }
    for (const p of [1, 3, 5, 7]) {
      mills.push([p, 8 + p, 16 + p]);
    }
    return mills;
  })();

  // Nachbarschaft: innerhalb eines Rings im Kreis verbunden, plus
  // radiale Verbindungen an den vier Mittelpunkten der Ringe.
  static ADJACENCY = (() => {
    const adj = Array.from({ length: 24 }, () => []);
    const link = (a, b) => { adj[a].push(b); adj[b].push(a); };
    for (let ring = 0; ring < 3; ring++) {
      const o = ring * 8;
      for (let i = 0; i < 8; i++) link(o + i, o + ((i + 1) % 8));
    }
    for (const p of [1, 3, 5, 7]) {
      link(p, 8 + p);
      link(8 + p, 16 + p);
    }
    return adj;
  })();

  // Positionen (x,y) auf einem 0–6-Raster für die UI-Darstellung.
  static POSITIONS = (() => {
    const positions = [];
    for (let ring = 0; ring < 3; ring++) {
      const a = ring, b = 6 - ring, mid = (a + b) / 2;
      positions.push([a, a], [mid, a], [b, a], [b, mid], [b, b], [mid, b], [a, b], [a, mid]);
    }
    return positions;
  })();

  constructor() {
    this.reset();
  }

  reset() {
    this.cells = Array(24).fill(null);
    this.currentPlayer = 'W';      // S-W15: Weiß beginnt
    this.piecesToPlace = { B: 9, W: 9 };
    this.piecesOnBoard = { B: 0, W: 0 };
    this.phase = 'placing'; // 'placing' | 'moving'
    this.pendingRemoval = false;
    this.lastMillLine = null;
    this.finished = false;
    this.winner = null;
    this.stellungen = {};          // S-W15: Zähler je Stellung (Ziehphase), für das Unentschieden
  }

  _opponent(p) { return p === 'B' ? 'W' : 'B'; }

  // S-W15: Punkte, auf denen Spieler s im nächsten eigenen Zug eine Mühle schließen kann.
  drohungen(s) {
    const out = [];
    const springt = this.piecesToPlace[s] > 0 || this.piecesOnBoard[s] === 3;
    for (const m of MuehleEntity.MILLS) {
      const frei = m.filter(i => this.cells[i] === null);
      if (frei.length !== 1 || m.filter(i => this.cells[i] === s).length !== 2) continue;
      const p = frei[0];
      if (out.includes(p)) continue;
      if (springt || MuehleEntity.ADJACENCY[p].some(n => this.cells[n] === s && !m.includes(n))) out.push(p);
    }
    return out.sort((a, b) => a - b);
  }

  // S-W15: Stein steht in einer Mühle und darf nicht genommen werden.
  istGeschuetzt(index) {
    const p = this.cells[index];
    return !!p && this._isPartOfMill(index, p) && !this._allInMills(p);
  }

  _stellungsSchluessel() { return this.cells.map(c => c || '-').join('') + this.currentPlayer; }

  isFlyingPhase(player) {
    return this.phase === 'moving' && this.piecesOnBoard[player] === 3;
  }

  _millsThrough(index, player, board = this.cells) {
    return MuehleEntity.MILLS.filter(m => m.includes(index) && m.every(i => board[i] === player));
  }

  _isPartOfMill(index, player, board = this.cells) {
    return this._millsThrough(index, player, board).length > 0;
  }

  _allInMills(player, board = this.cells) {
    const positions = [];
    for (let i = 0; i < 24; i++) if (board[i] === player) positions.push(i);
    return positions.length > 0 && positions.every(i => this._isPartOfMill(i, player, board));
  }

  canPlaceAt(index) {
    return this.phase === 'placing' && !this.finished && !this.pendingRemoval && this.cells[index] === null;
  }

  canMoveTo(from, to) {
    if (this.phase !== 'moving' || this.finished || this.pendingRemoval) return false;
    if (this.cells[from] !== this.currentPlayer || this.cells[to] !== null) return false;
    if (this.isFlyingPhase(this.currentPlayer)) return true;
    return MuehleEntity.ADJACENCY[from].includes(to);
  }

  canRemove(index) {
    if (!this.pendingRemoval) return false;
    const opp = this._opponent(this.currentPlayer);
    if (this.cells[index] !== opp) return false;
    if (this._isPartOfMill(index, opp) && !this._allInMills(opp)) return false;
    return true;
  }

  getValidPlacements() {
    const moves = [];
    for (let i = 0; i < 24; i++) if (this.cells[i] === null) moves.push(i);
    return moves;
  }

  getValidMovePairs(player = this.currentPlayer) {
    const pairs = [];
    if (this.phase !== 'moving') return pairs;
    const flying = this.piecesOnBoard[player] === 3;
    for (let from = 0; from < 24; from++) {
      if (this.cells[from] !== player) continue;
      if (flying) {
        for (let to = 0; to < 24; to++) if (this.cells[to] === null) pairs.push([from, to]);
      } else {
        for (const to of MuehleEntity.ADJACENCY[from]) if (this.cells[to] === null) pairs.push([from, to]);
      }
    }
    return pairs;
  }

  place(index) {
    if (!this.canPlaceAt(index)) throw new Error(`Ungültiger Platzierungszug auf ${index}`);
    const player = this.currentPlayer;
    this.cells[index] = player;
    this.piecesToPlace[player]--;
    this.piecesOnBoard[player]++;
    if (this.piecesToPlace.B === 0 && this.piecesToPlace.W === 0) this.phase = 'moving';

    const mills = this._millsThrough(index, player);
    if (mills.length > 0 && this.piecesOnBoard[this._opponent(player)] > 0) {
      this.pendingRemoval = true;
      this.lastMillLine = [...new Set(mills.flat())];
    } else {
      this._advanceTurn();
    }
    return this._checkGameState();
  }

  move(from, to) {
    if (!this.canMoveTo(from, to)) throw new Error(`Ungültiger Zug ${from}->${to}`);
    const player = this.currentPlayer;
    this.cells[to] = player;
    this.cells[from] = null;

    const mills = this._millsThrough(to, player);
    if (mills.length > 0 && this.piecesOnBoard[this._opponent(player)] > 0) {
      this.pendingRemoval = true;
      this.lastMillLine = [...new Set(mills.flat())];
    } else {
      this._advanceTurn();
    }
    return this._checkGameState();
  }

  removePiece(index) {
    if (!this.canRemove(index)) throw new Error(`Ungültige Entfernung auf ${index}`);
    const opp = this._opponent(this.currentPlayer);
    this.cells[index] = null;
    this.piecesOnBoard[opp]--;
    this.pendingRemoval = false;
    this.lastMillLine = null;
    this.stellungen = {};          // nach einer Wegnahme kehrt keine frühere Stellung wieder
    this._advanceTurn();
    return this._checkGameState();
  }

  _advanceTurn() {
    this.currentPlayer = this._opponent(this.currentPlayer);
    if (this.phase !== 'moving' || this.finished) return;
    const k = this._stellungsSchluessel();
    this.stellungen[k] = (this.stellungen[k] || 0) + 1;
    if (this.stellungen[k] >= 3) { this.finished = true; this.winner = 'Draw'; }
  }

  _hasAnyMove(player) {
    if (this.isFlyingPhase(player)) return this.cells.includes(null);
    for (let i = 0; i < 24; i++) {
      if (this.cells[i] === player && MuehleEntity.ADJACENCY[i].some(n => this.cells[n] === null)) return true;
    }
    return false;
  }

  _checkGameState() {
    if (this.finished) return this._result();
    if (this.phase === 'moving') {
      for (const p of ['B', 'W']) {
        if (this.piecesOnBoard[p] < 3) {
          this.finished = true;
          this.winner = this._opponent(p);
          return this._result();
        }
      }
      if (!this.pendingRemoval && !this._hasAnyMove(this.currentPlayer)) {
        this.finished = true;
        this.winner = this._opponent(this.currentPlayer);
        return this._result();
      }
    }
    return null;
  }

  _result() {
    return { winner: this.winner, line: this.lastMillLine };
  }

  toJSON() {
    return {
      cells: [...this.cells],
      currentPlayer: this.currentPlayer,
      piecesToPlace: { ...this.piecesToPlace },
      piecesOnBoard: { ...this.piecesOnBoard },
      phase: this.phase,
      pendingRemoval: this.pendingRemoval,
      lastMillLine: this.lastMillLine,
      finished: this.finished,
      winner: this.winner,
      stellungen: { ...this.stellungen }
    };
  }

  loadFromJSON(data) {
    this.cells = [...data.cells];
    this.currentPlayer = data.currentPlayer;
    this.piecesToPlace = { ...data.piecesToPlace };
    this.piecesOnBoard = { ...data.piecesOnBoard };
    this.phase = data.phase;
    this.pendingRemoval = data.pendingRemoval;
    this.lastMillLine = data.lastMillLine;
    this.finished = data.finished;
    this.winner = data.winner;
    this.stellungen = (data.stellungen && typeof data.stellungen === 'object') ? { ...data.stellungen } : {};
  }

  // Für die Voraussicht der KI: vollständige Kopie des
  // Spielzustands, auf der probeweise Aktionen ausgeführt werden
  // können, ohne den echten Zustand zu verändern.
  clone() {
    const copy = new MuehleEntity();
    copy.cells = [...this.cells];
    copy.currentPlayer = this.currentPlayer;
    copy.piecesToPlace = { ...this.piecesToPlace };
    copy.piecesOnBoard = { ...this.piecesOnBoard };
    copy.phase = this.phase;
    copy.pendingRemoval = this.pendingRemoval;
    copy.lastMillLine = this.lastMillLine;
    copy.finished = this.finished;
    copy.winner = this.winner;
    copy.stellungen = { ...this.stellungen };
    return copy;
  }
}
// >>> MuehleEntity
// <<< DameEntity
class DameEntity {
  static RUHE_MAX = 60;   // Halbzüge ohne Schlag und ohne Schritt eines Steins nach vorn bis zum Unentschieden

  /* Alle zulässigen Züge für "spieler" als { von, pfad, schlaege }.
     Schlagzwang und Mehrheitsregel sind schon angewandt. Die Funktion
     ist in sich geschlossen (kein this, keine Verweise nach außen),
     weil derselbe Quelltext auch im Web Worker läuft (AIEngines). */
  static dameZuege(cells, spieler) {
    const R = [[-1, 0], [1, 0], [0, -1], [0, 1]];           // hoch, runter, links, rechts
    const vor = spieler === 'W' ? 0 : 1;
    const feld = (r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1);
    const gegner = v => v !== null && v[0] !== spieler;
    const schlaege = [], ruhig = [];
    let meiste = 0;

    // Schlagfolgen: Tiefensuche; geschlagene Steine verschwinden sofort.
    const folge = (brett, pos, dame, letzte, pfad, weg) => {
      let weiter = false;
      const r = pos >> 3, c = pos & 7;
      for (let d = 0; d < 4; d++) {
        if (!dame && d !== vor && d < 2) continue;           // Stein schlägt nur vor und seitwärts
        if (letzte >= 0 && d === (letzte ^ 1)) continue;     // keine Kehrtwende
        const [dr, dc] = R[d];
        let k = 1, opfer = feld(r + dr, c + dc);
        if (dame) while (opfer >= 0 && brett[opfer] === null) { k++; opfer = feld(r + dr * k, c + dc * k); }
        if (opfer < 0 || !gegner(brett[opfer])) continue;
        for (let n = k + 1; ; n++) {
          const ziel = feld(r + dr * n, c + dc * n);
          if (ziel < 0 || brett[ziel] !== null) break;
          weiter = true;
          const b = brett.slice();
          b[ziel] = b[pos]; b[pos] = null; b[opfer] = null;
          folge(b, ziel, dame, d, [...pfad, ziel], [...weg, opfer]);
          if (!dame) break;                                   // Stein landet direkt dahinter
        }
      }
      if (!weiter && weg.length) {
        if (weg.length > meiste) { meiste = weg.length; schlaege.length = 0; }
        if (weg.length === meiste) schlaege.push({ von: pfad[0], pfad: pfad.slice(1), schlaege: weg });
      }
    };

    for (let i = 0; i < 64; i++) {
      const v = cells[i];
      if (v === null || v[0] !== spieler) continue;
      const dame = v.length === 2, r = i >> 3, c = i & 7;
      folge(cells, i, dame, -1, [i], []);
      if (meiste) continue;
      for (let d = 0; d < 4; d++) {
        if (!dame && d !== vor && d < 2) continue;
        const [dr, dc] = R[d];
        for (let n = 1; ; n++) {
          const ziel = feld(r + dr * n, c + dc * n);
          if (ziel < 0 || cells[ziel] !== null) break;
          ruhig.push({ von: i, pfad: [ziel], schlaege: [] });
          if (!dame) break;
        }
      }
    }
    return meiste ? schlaege : ruhig;
  }

  /* Brett nach einem Zug (neue Liste). Umwandlung erst am Zugende.
     Ebenfalls in sich geschlossen, läuft auch im Worker. */
  static dameSetze(cells, zug) {
    const b = cells.slice();
    let v = b[zug.von];
    b[zug.von] = null;
    for (const s of zug.schlaege) b[s] = null;
    const ziel = zug.pfad[zug.pfad.length - 1];
    if (v === 'W' && ziel < 8) v = 'WD';
    if (v === 'B' && ziel >= 56) v = 'BD';
    b[ziel] = v;
    return b;
  }

  /* Prüft einen gespeicherten Stand, bevor er geladen wird. */
  static pruefe(d) {
    if (!d || d.formatversion !== 1 || !Array.isArray(d.cells) || d.cells.length !== 64) return false;
    const n = { W: 0, B: 0 };
    for (let i = 0; i < 64; i++) {
      const v = d.cells[i];
      if (v === null) continue;
      if (v !== 'W' && v !== 'B' && v !== 'WD' && v !== 'BD') return false;
      n[v[0]]++;
      if ((v === 'W' && i < 8) || (v === 'B' && i >= 56)) return false;   // müsste Dame sein
    }
    if (n.W > 16 || n.B > 16) return false;
    if (d.currentPlayer !== 'W' && d.currentPlayer !== 'B') return false;
    if (d.finished !== false || d.winner !== null) return false;          // beendete Partien werden nie gespeichert
    if (!Number.isInteger(d.ruhe) || d.ruhe < 0 || d.ruhe >= DameEntity.RUHE_MAX) return false;
    if (!d.stellungen || typeof d.stellungen !== 'object' || Array.isArray(d.stellungen)) return false;
    for (const k in d.stellungen) if (!Number.isInteger(d.stellungen[k]) || d.stellungen[k] < 1 || d.stellungen[k] > 2) return false;
    return DameEntity.dameZuege(d.cells, d.currentPlayer).length > 0;
  }

  constructor() { this.reset(); }

  reset() {
    this.cells = Array(64).fill(null);
    for (let i = 8; i < 24; i++) this.cells[i] = 'B';
    for (let i = 40; i < 56; i++) this.cells[i] = 'W';
    this.currentPlayer = 'W';
    this.finished = false;
    this.winner = null;
    this.ruhe = 0;
    this.stellungen = {};
    this._merkeStellung();
  }

  _schluessel() { return this.currentPlayer + this.cells.map(v => (v === null ? '.' : v === 'W' ? 'w' : v === 'B' ? 'b' : v === 'WD' ? 'W' : 'B')).join(''); }
  _merkeStellung() { const k = this._schluessel(); this.stellungen[k] = (this.stellungen[k] || 0) + 1; return this.stellungen[k]; }

  zuege() { return this.finished ? [] : DameEntity.dameZuege(this.cells, this.currentPlayer); }

  _finde(von, pfad) {
    return this.zuege().find(z => z.von === von && z.pfad.length === pfad.length && z.pfad.every((f, i) => f === pfad[i])) || null;
  }
  kannZiehen(von, pfad) { return this._finde(von, pfad) !== null; }

  // Führt einen ganzen Zug aus (bei Schlägen die ganze Folge). Liefert das Ergebnis oder null.
  zieh(von, pfad) {
    const zug = this._finde(von, pfad);
    if (!zug) return null;
    // Unumkehrbar sind Schläge und Schritte eines Steins nach vorn; Seitwärtszüge lassen sich zurücknehmen und zählen weiter.
    const fest = zug.schlaege.length > 0 || (this.cells[von].length === 1 && (pfad[0] >> 3) !== (von >> 3));
    this.cells = DameEntity.dameSetze(this.cells, zug);
    const spieler = this.currentPlayer;
    this.currentPlayer = spieler === 'W' ? 'B' : 'W';
    if (fest) { this.ruhe = 0; this.stellungen = {}; } else this.ruhe++;
    const oft = this._merkeStellung();
    if (!DameEntity.dameZuege(this.cells, this.currentPlayer).length) { this.finished = true; this.winner = spieler; }
    else if (oft >= 3 || this.ruhe >= DameEntity.RUHE_MAX) { this.finished = true; this.winner = 'Draw'; }
    return this.finished ? { winner: this.winner, line: null } : null;
  }

  toJSON() {
    return { formatversion: 1, cells: [...this.cells], currentPlayer: this.currentPlayer, finished: this.finished,
      winner: this.winner, ruhe: this.ruhe, stellungen: { ...this.stellungen } };
  }

  // Ungültige Daten führen zum Neustart (nie zu einem halb geladenen Stand).
  loadFromJSON(data) {
    if (!DameEntity.pruefe(data)) { this.reset(); return false; }
    this.cells = [...data.cells];
    this.currentPlayer = data.currentPlayer;
    this.finished = false;
    this.winner = null;
    this.ruhe = data.ruhe;
    this.stellungen = { ...data.stellungen };
    return true;
  }
}
// >>> DameEntity
// <<< AIEngines.dame
AIEngines.dameZuege = DameEntity.dameZuege;
// >>> AIEngines.dame
// <<< AIEngines.dameSetze
AIEngines.dameSetze = DameEntity.dameSetze;
// >>> AIEngines.dameSetze
window.Brettregeln = { AIEngines, MangalaEntity, TavlaEntity, tavlaRegelwerk, MuehleEntity, DameEntity };
})();
