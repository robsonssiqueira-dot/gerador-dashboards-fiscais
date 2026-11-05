# Gerador de Dashboards Fiscais

Página que transforma o relatório SAP de notas fiscais (layout J_1B, .xlsx) em uma pasta Excel com dashboards de ICMS, IPI e PIS/Cofins, análise de NCM monofásicos (Lei 10.485/2002), crédito outorgado de ICMS do art. 36 do Anexo III do RICMS/SP (vendas de máquinas), alertas, síntese, controles e tabelas dinâmicas.

- O processamento acontece inteiramente no navegador de quem usa (Python via Pyodide/WebAssembly). O relatório não é enviado a nenhum servidor.
- Requer Chrome ou Edge atualizado e cerca de 2 GB de memória livre; para ~47 mil linhas, a geração leva de 3 a 5 minutos.
- Crédito outorgado (art. 36): informe na página o CNPJ do estabelecimento fabricante; em branco, o cálculo considera os estabelecimentos de SP com vendas de produção própria dos NCM 8429.51.99, 8429.52.19 e 8429.59.00. O valor é calculado por documento e deve ser conciliado com a apuração.
- Os resultados não substituem a validação jurídica e fiscal.

Componentes de terceiros: [Pyodide](https://pyodide.org) (MPL-2.0), pandas (BSD-3), NumPy (BSD-3), python-dateutil, pytz, six e XlsxWriter (BSD-2).
