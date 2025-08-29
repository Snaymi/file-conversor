/**
 * [1] Encapsulamento:
 * - Todo o código fica dentro de um IIFE (módulo) chamado ComparadorArquivos que
 *   evita poluir o escopo global e permite controlar quando iniciar.
 */
const ComparadorArquivos = (function () {

    /**
     * [2] Função utilitária getElement:
     * - Centraliza a busca por elementos e valida se existem.
     * - Evita erros silenciosos e repetições de document.getElementById.
     */
    //Guardar o valores lidos e normalizados.
    let valoresItau = [];
    let valoresTransacoes = [];

    // Normalização numérica (BR -> para JS)
    // Para fazer a comparação de forma segura
    // - Aceita string com milhar (.) e decimal (,), ex: "34.392,87"
    // - Remove espaços, remove pontos de milhar e troca vírgula por ponto
    // - Retorna Number ou null se inválido

    const toNumberBR = function (v) {
        if (v === null || v === undefined) return null; //prontopara ignorar se o valor for nulo ou indefinido
        if (typeof v === 'number') return v; // já é número, retorna o valor;
        const s = String(v).trim(); //Converte para string e remove espaços
        const clean = s.replace(/\./g, '').replace(',', '.'); //Remove o '.' na casa do milhar e substitui virgula por ponto 
        const n = parseFloat(clean); //Converte para numer JS
        return Number.isFinite(n) ? n : null; //Garantindo que seja um número válido.
    }
    // Função utilitária para converter número serial do Excel em data BR
    // O Excel conta dias desde 01/01/1900 (no Windows), então precisamos ajustar para o JS
    const excelDateToJSDate = function (serial) {
        // 25569 = diferença de dias entre 01/01/1900 e 01/01/1970
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400; // segundos
        const date_info = new Date(utc_value * 1000); // milissegundos
        // Retorna no formato brasileiro "dd/mm/aaaa"
        return date_info.toLocaleDateString('pt-BR');
    };

    // Normalizando a comparação
    const normalizeValue = function (v, useAbs = false) {
        const n = toNumberBR(v); // Converte v para número
        if (n === null) return null; // Se inválido, retorna null
        //Math.abs(x) Devolve o valor absoluto de um determinado número
        const final = useAbs ? Math.abs(n) : n; //Se tiver sinal negativo remove
        return final.toFixed(2); // Retorna string com 2 casas para comparação consistente
    };

    // - Usa SheetJS (XLSX) que precisa estar carregado no HTML (apenas UMA vez)
    // - Retorna um array de objetos: [{ ColunaA: val, ColunaB: val, ... }, ...]
    const lerExcel = function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();                   // Cria o leitor de arquivo no navegador
            reader.onload = function (e) {                     // Quando o arquivo terminar de carregar
                const data = new Uint8Array(e.target.result);  // Converte para Array de bytes
                const workbook = XLSX.read(data, { type: 'array' }); // Lê o workbook com SheetJS
                const sheetName = workbook.SheetNames[0];      // Pega a primeira aba
                const sheet = workbook.Sheets[sheetName];      // Pega a planilha
                const rows = XLSX.utils.sheet_to_json(sheet, { // Converte planilha para JSON de linhas
                    defval: null                               // Mantém null onde não tiver valor
                });
                resolve(rows);                                 // Entrega as linhas
            };
            reader.onerror = reject;                           // Erro de leitura do arquivo
            reader.readAsArrayBuffer(file);                    // Lê o arquivo como ArrayBuffer
        });
    };
    // - Tenta achar, por aproximação, a chave correta no objeto a partir dos candidatos informados
    const findColumnKey = function (rows, candidates) {
        if (!rows.length) return null;                         // Sem linhas, não há o que mapear
        const keys = Object.keys(rows[0] || {});               // Pega os nomes das colunas do primeiro registro
        const norm = s => String(s).trim().toLowerCase();      // Normalizador básico
        const keysNorm = keys.map(k => norm(k));               // Normaliza todas as chaves
        for (const cand of candidates) {                       // Testa cada candidato
            const i = keysNorm.indexOf(norm(cand));            // Procura posição no array
            if (i !== -1) return keys[i];                      // Se achou, retorna o nome exato
        }
        return null;                                           // Não achou nenhuma coluna compatível
    };




    // Extrai coluna de valor e data normalizados
    const extrairColunaComData = function (rows, options) {
        const { colValor, colData, abs } = options;
        const keyValor = findColumnKey(rows, [colValor]);
        const keyData = findColumnKey(rows, [colData]);
        if (!keyValor || !keyData) {
            console.error(`❌ Coluna não encontrada. Procurado: ${colValor}, ${colData}`);
            return [];
        }
        return rows
            .map(r => {
                const valorNorm = normalizeValue(r[keyValor], abs);
                // Se a célula de data for um número, converte do formato serial do Excel
                const dataStr = typeof r[keyData] === 'number'
                    ? excelDateToJSDate(r[keyData])
                    : r[keyData];
                return valorNorm !== null ? { valor: valorNorm, data: dataStr } : null;
            })
            .filter(item => item !== null);
    };

    // - Mostra duas tabelas: "Só no ITAU" e "Só no Transações"
    // Compara listas e exibe no console
    const compararListas = function () {
        const mapItau = new Map();
        valoresItau.forEach(item => {
            if (!mapItau.has(item.valor)) mapItau.set(item.valor, []);
            mapItau.get(item.valor).push(item.data);
        });

        const mapTrans = new Map();
        valoresTransacoes.forEach(item => {
            if (!mapTrans.has(item.valor)) mapTrans.set(item.valor, []);
            mapTrans.get(item.valor).push(item.data);
        });

        const soItau = [...mapItau.keys()].filter(v => !mapTrans.has(v));
        const soTrans = [...mapTrans.keys()].filter(v => !mapItau.has(v));

        const formatBR = v => Number(v).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const ordenarPorData = (valor, datas) => {
            return datas
                .sort((a, b) => new Date(a) - new Date(b))
                .map(d => ({ Data: d, Valor: formatBR(valor) }));
        };

        console.log('📊 Comparação realizada. Datas em ordem crescente');

        console.log('📋 Só no ITAU:');
        console.table(soItau.flatMap(v => ordenarPorData(v, mapItau.get(v))));

        console.log('📋 Só no Transações:');
        console.table(soTrans.flatMap(v => ordenarPorData(v, mapTrans.get(v))));
    };

    //É o getElementById, Mas usando uma função para buscar um Id.
    console.log('Buscando ID dos elementos 🔁');
    const getElement = function (id) {
        const el = document.getElementById(id); //Procura o elemento pelo ID - Se encontrar el vai ser o próprio elemento do HTML.
        if (!el) { // Se não encontrar
            console.error(`❌ Elemento com id "${id}" não encontrado no DOM`);
            //Se o elemento não existir, mostra um erro no console com ID
            return null; //Retorna null para indicar que o elemento não foi encontrado
        }
        return el; //Se o elemento foi encontrado, retorna o próprio elemento
    };

    /**
     * - Mapeia cada botão ao respectivo input (botão -> input).
     * - Facilita adicionar novos pares sem duplicar código.
     * - Aqui também ficam todos os listeners (clique e change).
     */
    const addButtonListeners = function () {
        console.log('✅ Comparador pronto para receber arquivos');

        const buttonInputMap = new Map([
            ['btn-arquivo1', 'file-comparator1'], // ITAU
            ['btn-arquivo2', 'file-comparator2']  // Transações
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
                        abs: true
                    });
                    console.log(`📂 ITAU carregado: ${file.name} (${valoresItau.length} valores)`);
                } else {
                    valoresTransacoes = extrairColunaComData(rows, {
                        colValor: 'entrada',
                        colData: 'Data',
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

    const start = function () {
        document.addEventListener('DOMContentLoaded', addButtonListeners);
    };

    return {
        init: start
    };

})();

ComparadorArquivos.init();