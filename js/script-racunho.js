
/**
 * Módulo: ComparadorArquivos
 * - Encapsula tudo (IIFE) para não poluir o escopo global.
 * - Lê dois Excel, extrai colunas específicas e compara os valores.
 */
const ComparadorArquivos = (function () {

    // [1] Utilitário: obter elemento por id com validação e erro claro
    const getElement = function (id) {
        const el = document.getElementById(id);                // Busca o elemento no DOM pelo id
        if (!el) {                                             // Se não encontrar
            console.error(`❌ Elemento com id "${id}" não encontrado no DOM`);
            return null;                                       // Retorna null para evitar uso indevido
        }
        return el;                                             // Retorna o elemento se encontrado
    };

    // [2] Estado interno: onde vamos guardar os valores já lidos e normalizados
    let valoresItau = [];                                      // Armazena valores da coluna "Valor" (ITAU), normalizados
    let valoresTransacoes = [];                                // Armazena valores da coluna "entrada" (Transações), normalizados

    // [3] Normalização numérica (BR → número JS)
    // - Aceita string com milhar (.) e decimal (,), ex: "34.392,87"
    // - Remove espaços, remove pontos de milhar e troca vírgula por ponto
    // - Retorna Number ou null se inválido
    const toNumberBR = function (v) {
        if (v === null || v === undefined) return null;        // Ignora valores nulos
        if (typeof v === 'number') return v;                   // Já é número, retorna direto
        const s = String(v).trim();                            // Converte para string e tira espaços
        if (!s) return null;                                   // String vazia → ignora
        const clean = s.replace(/\./g, '').replace(',', '.');  // Remove milhar e troca vírgula por ponto
        const n = parseFloat(clean);                           // Converte para número JS
        return Number.isFinite(n) ? n : null;                  // Garante que é número válido
    };

    // [4] Normaliza para comparação
    // - Converte para número, aplica |x| se precisar, e fixa 2 casas como string ("8143.90")
    const normalizeValue = function (v, useAbs = false) {
        const n = toNumberBR(v);                               // Converte v para número
        if (n === null) return null;                           // Se inválido, retorna null
        const final = useAbs ? Math.abs(n) : n;                // Se for ITAU, usamos valor absoluto
        return final.toFixed(2);                               // Retorna string com 2 casas para comparação consistente
    };

    // [5] Leitura do Excel em JSON de linhas
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

    // [6] Descobrir a coluna pelo nome (case-insensitive e espaços)
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

    // [7] Extrair e normalizar uma coluna específica de um conjunto de linhas
    // - options:
    //   - candidates: ['Valor'] ou ['entrada'] (tentativas de nome)
    //   - abs: true/false (se aplica valor absoluto, usado para ITAU)
    const extrairColunaNormalizada = function (rows, options) {
        const { candidates, abs } = options;                   // Desestrutura opções
        const key = findColumnKey(rows, candidates);           // Descobre a chave real no JSON
        if (!key) {                                            // Se não encontrar a coluna
            console.error(`❌ Coluna não encontrada. Tentativas: ${candidates.join(', ')}`);
            return [];                                         // Retorna vazio
        }
        return rows                                            // Percorre todas as linhas
            .map(r => normalizeValue(r[key], abs))             // Converte cada célula para string numérica "####.##"
            .filter(v => v !== null && v !== 'NaN');           // Remove inválidos
    };

    // [8] Comparar listas normalizadas e imprimir resultados no console
    // - Mostra duas tabelas: "Só no ITAU" e "Só no Transações"
    const compararListas = function () {
        // Converte para Set para buscas rápidas e remove duplicados automaticamente
        const setItau = new Set(valoresItau);                  // Ex.: {"8143.90", "4176.40", ...}
        const setTrans = new Set(valoresTransacoes);           // Ex.: {"8143.90", "52.06", ...}

        // Calcula diferenças de maneira eficiente
        const soItau = [...setItau].filter(v => !setTrans.has(v));   // Valores presentes no ITAU e ausentes no Transações
        const soTrans = [...setTrans].filter(v => !setItau.has(v));  // Valores presentes no Transações e ausentes no ITAU

        // Logs explicativos
        console.log('📊 Comparação realizada. Formato: "####.##" (ponto como separador decimal)');

        // Mostra tabelas no console (uma para cada diferença pedida)
        console.log('📋 Valores que estão no ITAU (coluna "Valor" absoluta) e não estão em Transações (coluna "entrada"):');
        console.table(soItau.map(v => ({ Valor: v })));

        console.log('📋 Valores que estão em Transações (coluna "entrada") e não estão no ITAU (coluna "Valor" absoluta):');
        console.table(soTrans.map(v => ({ Valor: v })));
    };

    // [9] Registra listeners em botões e inputs e carrega dados quando arquivos forem selecionados
    const addButtonListeners = function () {
        console.log('✅ Comparador pronto para receber arquivos');

        // Mapeamento: botão → input (mantém seu padrão original e evita confusão)
        const buttonInputMap = new Map([
            ['btn-arquivo1', 'file-comparator1'],              // Botão 1 aciona input 1 (ITAU)
            ['btn-arquivo2', 'file-comparator2']               // Botão 2 aciona input 2 (Transações)
        ]);

        // Para cada par (botão, input) do mapeamento
        buttonInputMap.forEach(function (inputId, btnId) {     // Map.forEach passa (valor, chave) → (inputId, btnId)
            const btn = getElement(btnId);                     // Busca o botão
            const input = getElement(inputId);                 // Busca o input
            if (!btn || !input) {                              // Se algum não existir, não prossegue
                console.warn(`⚠️ Elementos ausentes para o par: botão="${btnId}", input="${inputId}". Eventos não adicionados.`);
                return;                                        // Evita erro de null
            }

            // Clique no botão → abre o seletor de arquivo do input correspondente
            btn.addEventListener('click', function () {
                const num = (btnId === 'btn-arquivo1') ? '1' : '2'; // Apenas para log bonitinho
                console.log(`🖱️ Botão para selecionar arquivo ${num} clicado`);
                input.click();                                 // Abre seletor do input de arquivo
            });

            // Quando um arquivo for escolhido nesse input…
            input.addEventListener('change', async function () {
                const file = input.files && input.files[0];    // Pega o primeiro arquivo selecionado
                if (!file) {                                   // Se não veio arquivo
                    console.warn(`⚠️ Nenhum arquivo selecionado para ${btnId}`);
                    return;                                     // Sai sem tentar ler
                }

                // Lê o Excel inteiro e entrega as linhas
                let rows;
                try {
                    rows = await lerExcel(file);               // Aguarda leitura do Excel
                } catch (err) {
                    console.error('❌ Erro lendo o arquivo:', err);
                    return;
                }

                // Se for o primeiro botão, tratamos como ITAU
                if (btnId === 'btn-arquivo1') {
                    // Extrai e normaliza a coluna "Valor" com absoluto
                    valoresItau = extrairColunaNormalizada(rows, {
                        candidates: ['Valor'],                 // Nome esperado no ITAU
                        abs: true                              // Aplica valor absoluto
                    });
                    console.log(`📂 ITAU carregado: ${file.name} (${valoresItau.length} valores válidos)`);
                } else {
                    // Segundo botão → arquivo de Transações
                    // Extrai e normaliza a coluna "entrada" (sem absoluto)
                    valoresTransacoes = extrairColunaNormalizada(rows, {
                        candidates: ['entrada'],               // Nome esperado em Transações
                        abs: false                             // Mantém sinal (mas normalmente já vem positivo)
                    });
                    console.log(`📁 Transações carregado: ${file.name} (${valoresTransacoes.length} valores válidos)`);
                }
            });
        });

        // Botão que dispara a comparação somente quando você quiser
        const btnComparar = getElement('btn-comparator');      // Pega o botão "Comparar os dois arquivos"
        if (!btnComparar) {                                    // Se não existir no DOM
            console.warn('⚠️ Botão "btn-comparator" não encontrado. A comparação não poderá ser disparada manualmente.');
            return;                                            // Sai sem registrar click
        }

        // Clique no botão de comparar → executa comparação se ambos os arquivos já foram carregados
        btnComparar.addEventListener('click', function () {
            if (!valoresItau.length || !valoresTransacoes.length) { // Verifica se já carregamos ambos
                console.warn('⚠️ Selecione os dois arquivos antes de comparar (ITAU e Transações).');
                return;                                        // Evita comparar sem dados
            }
            compararListas();                                  // Executa a comparação e imprime as tabelas no console
        });

        console.log('⚙️ Eventos adicionados. Selecione os arquivos e clique em "Comparar os dois arquivos".');
    };

    // [10] Controla o momento de iniciar: só registra tudo quando o DOM estiver pronto
    const start = function () {
        document.addEventListener('DOMContentLoaded', addButtonListeners); // Aguarda HTML pronto para registrar eventos
    };

    // [11] API pública: permite chamar ComparadorArquivos.init() de fora
    return {
        init: start                                            // Externa apenas o método init
    };

})();                                                          // Executa o IIFE e atribui ao nome ComparadorArquivos

// [12] Inicia o módulo (registra listeners quando DOM estiver pronto)
ComparadorArquivos.init();
