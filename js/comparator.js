/**
 * [1] Encapsulamento:
 * - Todo o código fica dentro de um IIFE (módulo) chamado ComparadorArquivos que
 *   evita poluir o escopo global e permite controlar quando iniciar.
 */
const ComparadorArquivos = (function () {

    //Guardar o valores lidos e normalizados.
    let valoresItau = [];
    let valoresTransacoes = [];

    // Normalização numérica (BR -> para JS)
    // Para fazer a comparação de forma segura
    // - Aceita string com milhar (.) e decimal (,), ex: "34.392,87"
    // - Remove espaços, remove pontos de milhar e troca vírgula por ponto
    // - Retorna Number ou null se inválido
    const toNumberBR = function (v) {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return v;
        const s = String(v).trim();
        const clean = s.replace(/\./g, '').replace(',', '.');
        const n = parseFloat(clean);
        return Number.isFinite(n) ? n : null;
    };



    // Normalizando a comparação
    const normalizeValue = function (v, useAbs = false) {
        const n = toNumberBR(v);
        if (n === null) return null;
        const final = useAbs ? Math.abs(n) : n;
        return final.toFixed(2);
    };

    // Lê arquivo Excel usando SheetJS
    const lerExcel = function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, {
                    defval: null
                });
                resolve(rows);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    // Tenta achar, por aproximação, a chave correta no objeto a partir dos candidatos informados
    const removeAccents = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const findColumnKey = function (rows, candidates) {
        if (!rows.length) return null;
        const keys = Object.keys(rows[0] || {});
        const norm = s => removeAccents(String(s).trim().toLowerCase());
        const keysNorm = keys.map(k => norm(k));
        for (const cand of candidates) {
            const i = keysNorm.indexOf(norm(cand));
            if (i !== -1) return keys[i];
        }
        return null;
    };
    // Função utilitária para converter número serial do Excel em data BR
    function excelDateToJSDate(serial) {
        // Excel erroneamente considera 1900 como bissexto, então subtraímos 1 dia
        const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // 30/12/1899
        const correctedDate = new Date(excelEpoch.getTime() + ((serial + 1) * 86400000));
        return correctedDate.toLocaleDateString('pt-BR'); // Exibe como DD/MM/YYYY
    }


    // Extrai coluna de valor e data normalizados
    const extrairColunaComData = function (rows, options) {
        const { colValor, colData, colDescricao, abs } = options;
        const keyValor = findColumnKey(rows, [colValor]);
        const keyData = findColumnKey(rows, [colData]);
        const keyDescricao = findColumnKey(rows, [colDescricao]);
        if (!keyValor || !keyData || !keyDescricao) {
            console.error(`❌ Coluna não encontrada. Procurado: ${colValor}, ${colData}, ${colDescricao}`);
            return [];
        }
        return rows
            .map(r => {
                const valorNorm = normalizeValue(r[keyValor], abs);
                const dataStr = typeof r[keyData] === 'number'
                    ? excelDateToJSDate(r[keyData])
                    : r[keyData];
                    const descricao = r[keyDescricao] || '';
                return valorNorm !== null ? { valor: valorNorm, descricao: descricao, data: dataStr } : null;
            })
            .filter(item => item !== null);
    };

    // Compara listas e exibe no console e na tabela
    const compararListas = function () {
        const mapItau = new Map();
        valoresItau.forEach(item => {
            if (!mapItau.has(item.valor)) mapItau.set(item.valor, []);
            mapItau.get(item.valor).push({ data: item.data, descricao: item.descricao });
        });

        const mapTrans = new Map();
        valoresTransacoes.forEach(item => {
            if (!mapTrans.has(item.valor)) mapTrans.set(item.valor, []);
            mapTrans.get(item.valor).push({ data: item.data, descricao: item.descricao });
        });

        const soItau = [...mapItau.keys()].filter(v => !mapTrans.has(v));
        const soTrans = [...mapTrans.keys()].filter(v => !mapItau.has(v));

        const formatBR = v => Number(v).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const ordenarPorData = (valor, datas) => {
            return datas
                .sort((a, b) => new Date(a.data) - new Date(b.data))
                .map(d => ({ Data: d.data, Descrição: d.descricao, Valor: formatBR(valor) }));
        };

        console.log('📊 Comparação realizada. Datas em ordem crescente');

        console.log('📋 Só no ITAU:');
        console.table(soItau.flatMap(v => ordenarPorData(v, mapItau.get(v))));

        console.log('📋 Só no Transações:');
        console.table(soTrans.flatMap(v => ordenarPorData(v, mapTrans.get(v))));

        const parseDataBR = (dataBR) => {
            const [dia, mes, ano] = dataBR.split('/');
            return `${ano}-${mes}-${dia}`;
        };

        const dadosItau = soItau
            .flatMap(v => ordenarPorData(v, mapItau.get(v)))
            .sort((a, b) => new Date(parseDataBR(a.Data)) - new Date(parseDataBR(b.Data)));

        const dadosTrans = soTrans
            .flatMap(v => ordenarPorData(v, mapTrans.get(v)))
            .sort((a, b) => new Date(parseDataBR(a.Data)) - new Date(parseDataBR(b.Data)));


        document.querySelector('.comparator-result').style.display = 'flex';
        renderizarTabela(dadosItau, 'tabela-itau');
        renderizarTabela(dadosTrans, 'tabela-transacoes');
    };

    // Função utilitária para buscar elementos
    const getElement = function (id) {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`❌ Elemento com id "${id}" não encontrado no DOM`);
            return null;
        }
        return el;
    };

    // Mapeia cada botão ao respectivo input e registra listeners
    const addButtonListeners = function () {
        console.log('✅ Comparador pronto para receber arquivos');

        const buttonInputMap = new Map([
            ['btn-arquivo1', 'file-comparator1'],
            ['btn-arquivo2', 'file-comparator2']
        ]);

        buttonInputMap.forEach(function (inputId, btnId) {
            const btn = getElement(btnId);
            const input = getElement(inputId);
            if (!btn || !input) {
                console.warn(`⚠️ Elementos ausentes para o par: botão="${btnId}", input="${inputId}".`);
                return;
            }

            btn.addEventListener('click', function () {
                input.click();
            });

            input.addEventListener('change', async function () {
                const file = input.files && input.files[0];
                if (!file) {
                    console.warn(`⚠️ Nenhum arquivo selecionado para ${btnId}`);
                    return;
                }

                let rows;
                try {
                    rows = await lerExcel(file);
                } catch (err) {
                    console.error('❌ Erro lendo o arquivo:', err);
                    return;
                }

                if (btnId === 'btn-arquivo1') {
                    valoresItau = extrairColunaComData(rows, {
                        colValor: 'Valor',
                        colData: 'Data',
                        colDescricao: 'descricao',
                        abs: true
                    });
                    console.log(`📂 ITAU carregado: ${file.name} (${valoresItau.length} valores)`);
                } else {
                    valoresTransacoes = extrairColunaComData(rows, {
                        colValor: 'entrada',
                        colData: 'Data',
                        colDescricao: 'descricao',
                        abs: false
                    });
                    console.log(`📁 Transações carregado: ${file.name} (${valoresTransacoes.length} valores)`);
                }
            });
        });

        const btnComparar = getElement('btn-comparator');
        if (btnComparar) {
            btnComparar.addEventListener('click', function () {
                if (!valoresItau.length || !valoresTransacoes.length) {
                    console.warn('⚠️ Selecione os dois arquivos antes de comparar.');
                    return;
                }
                compararListas();
            });
        }
    };

    // Renderiza tabela no DOM
    function renderizarTabela(dados, idTabela) {
        const tabela = document.getElementById(idTabela);
        tabela.innerHTML = '';

        if (!dados.length) {
            tabela.innerHTML = '<tr><td>Nenhum dado encontrado</td></tr>';
            return;
        }

        const colunas = Object.keys(dados[0]);

        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        colunas.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        tabela.appendChild(thead);

        const tbody = document.createElement('tbody');
        dados.forEach(linha => {
            const tr = document.createElement('tr');
            colunas.forEach(col => {
                const td = document.createElement('td');
                td.textContent = linha[col];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        tabela.appendChild(tbody);
    }

    // Expondo apenas a inicialização dos listeners
    return {
        init: addButtonListeners
    };

})();

// Inicia o módulo ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    ComparadorArquivos.init();
});