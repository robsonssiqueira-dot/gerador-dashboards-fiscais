# Gerador de Dashboards Fiscais

Página que transforma o relatório SAP de notas fiscais (layout J_1B, .xlsx) em uma pasta Excel com dashboards de ICMS, IPI e PIS/Cofins, análise de NCM monofásicos (Lei 10.485/2002), alertas, síntese, controles e tabelas dinâmicas.

- O processamento acontece inteiramente no navegador de quem usa (Python via Pyodide/WebAssembly). O relatório não é enviado a nenhum servidor.
- Requer Chrome ou Edge atualizado e cerca de 2 GB de memória livre; para ~47 mil linhas, a geração leva de 3 a 5 minutos.
- Os resultados não substituem a validação jurídica e fiscal.

Componentes de terceiros: [Pyodide](https://pyodide.org) (MPL-2.0), pandas (BSD-3), NumPy (BSD-3), python-dateutil, pytz, six e XlsxWriter (BSD-2).
