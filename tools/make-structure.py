"""Make ka-8z5g.bin, the compact backbone file that ka.html draws in its "Featured structure" card.

Source: the deposited coordinates of PDB entry 8Z5G (Cryo-EM structure of the E. coli
QmcA-YbbJ complex, Qiao Z. and Gao Y.G. et al., released 2024), from the wwPDB / RCSB
Protein Data Bank, whose data are free to reuse (CC0).

    curl -O https://files.rcsb.org/download/8Z5G.cif.gz
    python3 tools/make-structure.py 8Z5G.cif.gz data/ka-8z5g.bin

What it keeps: one point per amino acid (the C-alpha atom) of all 52 chains, moved so the
ring's 26-fold axis points up, in tenths of an angstrom. It also stores which chain is
QmcA or YbbJ, which of the 26 pairs it belongs to, and whether each residue is in a helix
or a strand (from the entry's own annotation). The result is about 75 KB.
"""
import gzip, math, struct, json, sys
SRC = sys.argv[1]; OUT = sys.argv[2]
t = gzip.open(SRC, 'rt').read()
def loop(prefix, startswith):
    i = t.index('loop_\n' + prefix); cols = []; rows = []
    for line in t[i + 6:].split('\n'):
        if line.startswith('_'): cols.append(line.strip().split('.')[1]); continue
        break
    body = t[i + 6:].split('\n'); k = len(cols)
    for line in body[k:]:
        if line.startswith('#') or line.startswith('loop_') or line.startswith('_'): break
        if line.startswith(startswith): rows.append(line.split())
    return cols, rows
cols, rows = loop('_atom_site.group_PDB', 'ATOM')
ix = {c: i for i, c in enumerate(cols)}
ca = [r for r in rows if r[ix['label_atom_id']] == 'CA' and r[ix['label_alt_id']] in ('.', 'A')]
print('CA atoms:', len(ca))
chains = {}; order = []
for r in ca:
    a = r[ix['label_asym_id']]
    if a not in chains: chains[a] = {'entity': int(r[ix['label_entity_id']]), 'res': []}; order.append(a)
    chains[a]['res'].append((int(r[ix['label_seq_id']]), float(r[ix['Cartn_x']]), float(r[ix['Cartn_y']]), float(r[ix['Cartn_z']]), float(r[ix['B_iso_or_equiv']])))
print('chains:', len(chains), {e: sum(1 for c in chains.values() if c['entity'] == e) for e in (1, 2)})
# secondary structure from the file's own annotation
sec = {}
hc, hr = loop('_struct_conf.conf_type_id', 'HELX')
hx = {c: i for i, c in enumerate(hc)}
for r in hr:
    a = r[hx['beg_label_asym_id']]; b, e = int(r[hx['beg_label_seq_id']]), int(r[hx['end_label_seq_id']])
    for s in range(b, e + 1): sec[(a, s)] = 1
try:
    sc, sr = loop('_struct_sheet_range.sheet_id', '')
    sx = {c: i for i, c in enumerate(sc)}
    for r in sr:
        if len(r) < len(sc): continue
        a = r[sx['beg_label_asym_id']]; b, e = int(r[sx['beg_label_seq_id']]), int(r[sx['end_label_seq_id']])
        for s in range(b, e + 1): sec.setdefault((a, s), 2)
except Exception as ex: print('no sheets', ex)
print('helix residues:', sum(1 for v in sec.values() if v == 1), 'strand residues:', sum(1 for v in sec.values() if v == 2))
allp = [(x, y, z) for c in chains.values() for (_, x, y, z, _) in c['res']]
cx = sum(p[0] for p in allp) / len(allp); cy = sum(p[1] for p in allp) / len(allp); cz = sum(p[2] for p in allp) / len(allp)
print('centroid', round(cx, 1), round(cy, 1), round(cz, 1), '(assembly record axis: x=186.24 y=186.24, parallel to z)')
# ring axis is parallel to z through (cx, cy). radial profile of each chain
info = {}
for a, c in chains.items():
    n = len(c['res']); mx = sum(r[1] for r in c['res']) / n; my = sum(r[2] for r in c['res']) / n; mz = sum(r[3] for r in c['res']) / n
    info[a] = {'e': c['entity'], 'r': math.hypot(mx - cx, my - cy), 'z': mz - cz, 'th': math.atan2(my - cy, mx - cx), 'c': (mx, my, mz), 'n': n}
for e in (1, 2):
    rs = [v['r'] for v in info.values() if v['e'] == e]; zs = [v['z'] for v in info.values() if v['e'] == e]
    print('entity', e, 'centroid radius from axis: mean %.1f Å (min %.1f max %.1f) | height from middle: mean %.1f Å' % (sum(rs) / len(rs), min(rs), max(rs), sum(zs) / len(zs)))
rr = [math.hypot(x - cx, y - cy) for (x, y, z) in allp]; zz = [z - cz for (x, y, z) in allp]
print('whole ring: outer radius %.0f Å, inner %.0f Å, height %.0f Å' % (max(rr), min(rr), max(zz) - min(zz)))
# pair each YbbJ with its nearest QmcA
q = [a for a, v in info.items() if v['e'] == 1]; y = [a for a, v in info.items() if v['e'] == 2]
pairs = {}; used = set(); cand = sorted(((math.dist(info[a]['c'], info[b]['c']), a, b) for a in q for b in y), key=lambda x: x[0])
for d, a, b in cand:
    if a in used or b in pairs.values(): continue
    pairs[a] = b; used.add(a)
    if len(pairs) == 26: break
ds = [math.dist(info[a]['c'], info[b]['c']) for a, b in pairs.items()]
print('pairs:', len(pairs), 'partner centroid distance %.1f–%.1f Å' % (min(ds), max(ds)))
# order the 26 pairs by angle round the axis
pl = sorted(pairs.items(), key=lambda ab: info[ab[0]]['th']); ang = [info[a]['th'] for a, b in pl]
gaps = [(ang[(i + 1) % 26] - ang[i]) % (2 * math.pi) for i in range(26)]; print('angle gap between neighbouring pairs: %.2f° ± %.2f° (ideal %.2f°)' % (math.degrees(sum(gaps) / 26), math.degrees(max(gaps) - min(gaps)), 360 / 26))
pairid = {}
for k, (a, b) in enumerate(pl): pairid[a] = k; pairid[b] = k
# build the file: axis (z) becomes up (y)
SC = 10  # 0.1 Å per unit
def tf(x, y, z): return (x - cx, z - cz, -(y - cy))
chunks = []; coords = []; ss = []; total = 0
for a in sorted(chains, key=lambda a: (pairid[a], chains[a]['entity'])):
    c = chains[a]; res = sorted(c['res']); prev = None; n = 0
    for (s, x, yy, z, b) in res:
        X, Y, Z = tf(x, yy, z)
        brk = prev is not None and math.dist(prev, (X, Y, Z)) > 4.6
        flag = sec.get((a, s), 0) | (8 if (prev is None or brk) else 0)
        coords += [round(X * SC), round(Y * SC), round(Z * SC)]; ss.append(flag); prev = (X, Y, Z); n += 1
    chunks.append((c['entity'], pairid[a], n)); total += n
assert max(abs(v) for v in coords) < 32000, 'does not fit in int16'
blob = b'8Z5G' + struct.pack('<BHHf', 1, len(chunks), total, 1.0 / SC)
blob += b''.join(struct.pack('<BBH', e, p, n) for e, p, n in chunks)
blob += struct.pack('<%dh' % len(coords), *coords) + bytes(ss)
open(OUT, 'wb').write(blob)
print('wrote', OUT, len(blob) // 1024, 'KB |', len(chunks), 'chains,', total, 'Cα')
json.dump({'chains': len(chunks), 'ca': total, 'outer': max(rr), 'inner': min(rr), 'height': max(zz) - min(zz), 'r1': sum(v['r'] for v in info.values() if v['e'] == 1) / 26, 'r2': sum(v['r'] for v in info.values() if v['e'] == 2) / 26}, open(OUT + '.meta.json', 'w'))
