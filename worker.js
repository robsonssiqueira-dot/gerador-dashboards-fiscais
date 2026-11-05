// Executa o motor Python (Pyodide) fora da tela principal. Recebe o relatório, devolve a pasta .xlsx e a conferência.
let py = null;
const post = (type, data = {}, transfer = []) => self.postMessage({ type, ...data }, transfer);
const here = (p) => new URL(p, self.location.href).href;
const rawFetch = self.fetch.bind(self);
// arquivos binários são publicados com extensão .wasm (tipo servido pela página); o Pyodide pede .whl/.zip
self.fetch = (u, o) => {
  let s = (u instanceof Request) ? u.url : String(u);
  if (/\.(whl|zip)$/.test(s)) s += '.wasm';
  return rawFetch(s, o);
};

async function init() {
  const base = here('./pyodide/');
  post('status', { msg: 'Carregando o Python…' });
  const { loadPyodide } = await import(base + 'pyodide.mjs');
  py = await loadPyodide({ indexURL: base });
  post('status', { msg: 'Carregando pandas e numpy…' });
  await py.loadPackage(['numpy', 'pandas']);
  post('status', { msg: 'Carregando o motor de análise…' });
  const app = await (await rawFetch(here('./app.zip.wasm'))).arrayBuffer();
  py.unpackArchive(app, 'zip', { extractDir: '/app' });
  py.runPython("import sys; sys.path.insert(0, '/app')");
  post('ready', { versao: py.runPython('import sys, pandas; f"Python {sys.version.split()[0]} · pandas {pandas.__version__}"') });
}

const RUN = `
import json, traceback, os, gc
from motor.executar import gerar
from motor.leitura import ErroLayout
a = ARGS.to_py() if hasattr(ARGS, 'to_py') else dict(ARGS)
def _log(m):
    js_log(str(m))
try:
    CTX = gerar(a['entrada'], a['saida'], empresa=a['empresa'], log=_log, flags_pos=a['flags'], cnpj_outorgado=a.get('cnpj36', ''))
    st = CTX['static']; b = CTX['b']
    res = {'ok': True, 'saida': CTX['saida'], 'txt': CTX['arquivo_conferencia'], 'periodo': CTX['periodo']['rotulo'],
           'linhas': int(len(b)), 'docs': int(b.DocSAP.nunique()), 'estabs': int(len(CTX['aux']['estab'])),
           'alertas': [[x['id'], x['prioridade'], x['achado']] for x in st['alertas']],
           'atencao': [[c['res'], c['item'], c.get('det', '')] for c in CTX['conferencia'] if c['res'] != 'OK'],
           'co36': {'n': st['co36']['n'], 'cred': st['co36']['cred'], 'est': st['co36']['est'], 'liq': st['co36']['cred'] + st['co36']['est'], 'estab': st['co36']['estab']}}
    del CTX, st, b
except ErroLayout as e:
    res = {'ok': False, 'tipo': 'layout', 'erro': str(e)}
except MemoryError:
    res = {'ok': False, 'tipo': 'memoria', 'erro': 'Memória insuficiente no navegador.'}
except Exception as e:
    res = {'ok': False, 'tipo': 'erro', 'erro': f'{type(e).__name__}: {e}', 'detalhe': traceback.format_exc()[-3000:]}
gc.collect()
json.dumps(res)
`;

self.onmessage = async (e) => {
  const m = e.data;
  if (m.type === 'init') {
    try { await init(); } catch (err) { post('fatal', { msg: String((err && err.message) || err) }); }
    return;
  }
  if (m.type === 'run') {
    try {
      const nome = (m.name || 'relatorio.xlsx').replace(/[^\w.\-]+/g, '_');
      const baseNome = nome.replace(/\.xlsx$/i, '');
      py.FS.mkdirTree('/tmp/in'); py.FS.mkdirTree('/tmp/out');
      const ent = '/tmp/in/' + nome, sai = '/tmp/out/' + baseNome + '_Dashboards_Fiscais.xlsx';
      py.FS.writeFile(ent, new Uint8Array(m.file));
      py.globals.set('js_log', (s) => post('log', { msg: s }));
      py.globals.set('ARGS', py.toPy({ entrada: ent, saida: sai, empresa: m.empresa || '', cnpj36: m.cnpj36 || '', flags: m.semOriginal ? ['--no-sheet1'] : [] }));
      const res = JSON.parse(py.runPython(RUN));
      try { py.FS.unlink(ent); } catch (_) {}
      if (!res.ok) { post('falha', { res }); return; }
      const xlsx = py.FS.readFile(res.saida);
      const txt = py.FS.readFile(res.txt, { encoding: 'utf8' });
      try { py.FS.unlink(res.saida); py.FS.unlink(res.txt); } catch (_) {}
      post('done', { res, xlsx: xlsx.buffer, txt, nome: baseNome + '_Dashboards_Fiscais.xlsx' }, [xlsx.buffer]);
    } catch (err) {
      post('falha', { res: { ok: false, tipo: 'erro', erro: String((err && err.message) || err) } });
    }
  }
};
