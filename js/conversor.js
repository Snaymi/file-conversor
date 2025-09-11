document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("btn-arquivo");
  const arquivo = document.getElementById("file-input");

  if (!btn) {
    console.error("❌ Botão #btn-arquivo não encontrado no DOM");
    return;
  }

  if (!arquivo) {
    console.error("❌ Elemento #file-input não encontrado no DOM");
    return;
  }
  console.log("Passou sem erros ✅ evento CLICK carregado ✅");
  btn.addEventListener("click", function () {
    console.log("🖱️ Botão clicado — abrindo seletor de arquivos");
    arquivo.click(); // Simula o clique no input de arquivo
    console.log("Click interagido ✅");
  });

  arquivo.addEventListener("change", function () {
    console.log("📤 Evento disparado — identificando o arquivo selecionado");
    const file = arquivo.files[0];
    console.log("🔁 Arquivo recebido, analisando 🔁");

    if (file) {
      console.log("📄 Arquivo Recebido com sucesso!");
      console.log("🔤 Nome do arquivo:", file.name);
      console.log("📦 Tipo do arquivo:", file.type);
      const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log("Tamanho convertido de KB para MB (valor aproximado) ✅");
      console.log("📏 Tamanho do arquivo:", tamanhoMB, "MB");
      console.log("📁 Elemento input de arquivo:", arquivo);

      // Cria o leitor de arquivos
      const reader = new FileReader();
      console.log("📥 FileReader instanciado — preparando leitura do arquivo");

      // Quando o arquivo for carregado
      reader.onload = async function (event) {
        console.log(
          "📚 Arquivo lido como ArrayBuffer — iniciando processamento com pdf.js biblioteca que espera dados Uint8Array. ⚠ ⚠"
        );

        //Uint8Array - estrutura de dados em JavaScript usada para armazenar uma sequência de números inteiros sem sinal.
        const typedArray = new Uint8Array(event.target.result);
        //event - é o objeto do evento quando a leitura termina
        //target - elemento que disparou o esse evento (aqui é o próprio FileReader)
        //event.target.result - é o conteúdo lido do arquivo.
        // Ler um arquivo com FileReader.readAsArrayBuffer(), ele retorna os dados brutos do arquivo em formato ArrayBuffer. Mas o pdfjsLib.getDocument() — a biblioteca que estou usando para ler PDFs — espera um Uint8Array, que é uma forma mais específica de representar bytes.

        console.log(
          "Dados binários (genéricos) extraidos, converção para Uint8Array feita! ✅"
        );

        //"try tenta executar o código normalmente"
        try {
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          console.log(`📄 PDF carregado — total de páginas: ${pdf.numPages}`);

          let textoCompleto = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`🔍 Extraindo texto da página ${i}`);
            const page = await pdf.getPage(i);
            let textoPagina = "";

            const content = await page.getTextContent();

            if (content.items.length > 0) {
              // 👍 Página contém texto (formato antigo)
              textoPagina = content.items.map((item) => item.str).join("\n");
            } else {
              // ⚠️ Página sem texto — provavelmente imagem
              console.warn(`⚠️ Página ${i} sem texto. Usando OCR...`);

              const canvas = document.createElement("canvas");
              const viewport = page.getViewport({ scale: 2 }); // zoom 2x para OCR mais nítido
              const context = canvas.getContext("2d");
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({ canvasContext: context, viewport }).promise;

              const {
                data: { text },
              } = await Tesseract.recognize(canvas, "por", {
                logger: (info) => console.log(info), // opcional, mostra progresso do OCR
              });

              textoPagina = text;
            }
            textoCompleto += `\n\n--- Página ${i} ---\n\n${textoPagina}`;
          }
          // Mostra todo o texto extraído do arquivo antes de qualquer corte
          console.log("📄 Texto extraído (antes do corte):", textoCompleto);

          // Definimos a frase que vai servir como "gatilho" para parar o processamento
          const fraseParada = "Saldo em C/C";
          console.log(`🔍 Frase de parada definida: "${fraseParada}"`);

          // Quebra o texto inteiro em um array, cada elemento é uma linha do arquivo
          let linhasTexto = textoCompleto.split("\n");
          console.log(`📏 Total de linhas encontradas: ${linhasTexto.length}`);

          // Procura a linha que contém a frase de parada (ignora maiúsculas/minúsculas)
          const idxParada = linhasTexto.findIndex((linha) =>
            linha.toLowerCase().includes(fraseParada.toLowerCase())
          );
          console.log(
            `🔎 Índice da linha do gatilho encontrado: ${
              idxParada !== -1 ? idxParada : "não encontrado"
            }`
          );

          if (idxParada !== -1) {
            // Queremos apagar:
            // - a linha do gatilho ("Saldo em C/C")
            // - mais 3 linhas acima dele
            // Então calculamos o índice final até onde vamos manter o conteúdo
            const cortarAte = Math.max(0, idxParada - 6);
            console.log(
              `✂️ Vamos cortar a partir da linha ${
                cortarAte + 1
              } (posição no array: ${cortarAte})`
            );

            // Mostra no console todas as linhas que serão excluídas
            console.log("🗑 Linhas que serão removidas (3 acima + gatilho):");
            for (let i = cortarAte; i <= idxParada; i++) {
              console.log(`   Linha ${i + 1}: "${linhasTexto[i]}"`);
            }

            // Faz o corte: mantém apenas as linhas antes do ponto calculado
            linhasTexto = linhasTexto.slice(0, cortarAte);
            console.log(
              `📉 Novo total de linhas após o corte: ${linhasTexto.length}`
            );

            // Junta de volta em uma única string para o processamento continuar
            textoCompleto = linhasTexto.join("\n");
            console.log(
              "✅ Texto reconstruído após o corte aplicado com sucesso"
            );
          } else {
            // Se não achar a frase de parada, não faz nenhum corte
            console.log(
              "✅ Nenhuma frase de parada encontrada — mantendo todas as linhas"
            );
          }

          // Separa o texto completo em páginas usando o marcador do próprio PDF já extraído
          console.log("🧭 Iniciando split do texto completo em páginas...");
          const paginas = textoCompleto
            .split(/--- Página \d+ ---/) // divide pelo marcador “--- Página X ---”
            .filter((p) => p.trim() !== ""); // remove páginas vazias

          console.log(`📚 Total de páginas detectadas: ${paginas.length}`);

          const todasTransacoes = [];
          let lastDataGlobal = ""; // ← memória de data entre páginas

          paginas.forEach((paginaTexto, idx) => {
            console.log(
              "\n===================================================="
            );
            console.log(`📄 Processando Página ${idx + 1}/${paginas.length}`);
            console.log(
              `🔁 lastDataGlobal ANTES da página: ${
                lastDataGlobal || "(nenhuma)"
              }`
            );

            // Chama a função passando a última data global como ponto de partida
            const { transacoes, lastData } = extrairTransacoesFormatadas(
              paginaTexto,
              lastDataGlobal
            );

            console.log(`✅ Página ${idx + 1} processada.`);
            console.log(
              `🧾 Transações extraídas nesta página: ${transacoes.length}`
            );
            console.log(
              `📅 lastData retornada pela página: ${lastData || "(nenhuma)"}`
            );

            // Mostra uma tabela amigável das transações desta página
            if (transacoes.length > 0) {
              console.table(
                transacoes.map((t, i) => ({
                  índice: i,
                  data: t.data,
                  descrição: t.descricao,
                  entrada: t.entrada,
                  saída: t.saida,
                  saldo: t.saldo,
                }))
              );
            } else {
              console.log("ℹ️ Nenhuma transação encontrada nesta página.");
            }

            // Acumula transações e atualiza a “memória de data” para a próxima página
            todasTransacoes.push(...transacoes);
            lastDataGlobal = lastData || lastDataGlobal; // ← encadeia a última data

            console.log(
              `🔁 lastDataGlobal DEPOIS da página: ${
                lastDataGlobal || "(nenhuma)"
              }`
            );
            console.log(
              "====================================================\n"
            );
          });

          // A partir daqui você já tem todas as transações encadeadas com data correta
          console.log(
            `📦 Total geral de transações: ${todasTransacoes.length}`
          );

          // ✅ Aqui geramos o Excel com todas as transações acumuladas
          gerarExcel(todasTransacoes);

          console.log(
            "✅ Texto extraído com sucesso — Preparando para exibir o botão"
          );
          exibirTexto(textoCompleto);
        } catch (erro) {
          //"cacth" - lida erros dentro do "try" - sem travar o script
          console.error("❌ Erro ao processar o PDF:", erro);
        }
      };

      // Inicia leitura do arquivo como ArrayBuffer
      reader.readAsArrayBuffer(file);
      console.log("⏳ Leitura do arquivo iniciada com FileReader");
    } else {
      console.log("⚠️ Nenhum arquivo foi selecionado pelo usuário");
    }
  });
});

//Processa um texto bruto contendo informações financeiras (como extratos bancários)
//  e estrutura essas informações em objetos de transações formatadas
console.log("🔁 Entrando na função para extrair as transações 🔁");
function extrairTransacoesFormatadas(texto, lastDataInicial = "") {
  const anoMatch = texto.match(/20\d{2}/);
  const anoAtual = anoMatch ? anoMatch[0] : new Date().getFullYear();

  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  const transacoes = [];
  let bufferDescricao = "";
  let lastData = lastDataInicial;

  // Regex antigo
  const valorRegex = /^(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})(-?)$/;
  const dataIsoladaRegex = /^\d{2}\/\d{2}$/;

  // Regex novo
  const linhaTransacaoRegex =
    /^(\d{2}\/[a-zA-Z]{3})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})(?:\s+(\d{1,3}(?:\.\d{3})*,\d{2}))?$/;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // 👉 1) Tenta bater com padrão do NOVO extrato
    const matchNovo = linha.match(linhaTransacaoRegex);
    if (matchNovo) {
      // 📌 Aqui entra o ajuste dos meses
      const meses = {
        jan: "01",
        fev: "02",
        mar: "03",
        abr: "04",
        mai: "05",
        jun: "06",
        jul: "07",
        ago: "08",
        set: "09",
        out: "10",
        nov: "11",
        dez: "12",
      };

      const [dia, mesStr] = matchNovo[1].split("/"); // "01/abr"
      const mes = meses[mesStr.toLowerCase()] || "01";
      const data = `${dia}/${mes}/${anoAtual}`; // agora fica "01/04/2025"

      const descricao = matchNovo[2];
      const valor = matchNovo[3];
      const saldo = matchNovo[4] || "";
      const isSaida = valor.includes("-");

      // 🚫 Ignorar linhas de saldo
      if (descricao.toLowerCase().includes("saldo")) {
        console.log(`⚠️ Ignorando linha de SALDO: ${descricao}`);
        continue;
      }

      transacoes.push({
        data,
        descricao,
        entrada: isSaida ? "" : valor.replace("-", ""),
        saida: isSaida ? valor.replace("-", "") : "",
        saldo,
      });

      continue;
    }

    // 👉 2) Se não bateu, tenta formato ANTIGO (mantém igual ao que já tem)

    // 👉 2) Se não bateu, tenta formato ANTIGO
    // Data isolada
    if (dataIsoladaRegex.test(linha)) {
      lastData = `${linha}/${anoAtual}`;
      continue;
    }

    // Valor isolado
    const valorMatch = linha.match(valorRegex);
    if (valorMatch) {
      const valor = valorMatch[1];
      const isSaida = valorMatch[2] === "-";
      const isSaldo = bufferDescricao.toLowerCase().includes("saldo");

      if (isSaldo) {
        transacoes.push({
          data: lastData || "(sem data)",
          descricao: bufferDescricao || "(sem descrição)",
          entrada: "",
          saida: "",
          saldo: valor,
        });
      } else {
        transacoes.push({
          data: lastData || "(sem data)",
          descricao: bufferDescricao || "(sem descrição)",
          entrada: isSaida ? "" : valor,
          saida: isSaida ? valor : "",
          saldo: "",
        });
      }

      bufferDescricao = "";
      continue;
    }

    // Caso contrário, acumula como descrição (formato antigo)
    bufferDescricao = linha;
  }

  return { transacoes, lastData };
}

//Converte um conjunto de transações em uma planilha Excel (.xlsx)
// E cria dinamicamente um link para download dessa planilha no navegador.
function gerarExcel(transacoes, nomeArquivo = "Transacoes.xlsx") {
  console.log("📊 Gerando planilha Excel...");
  const transacoesFiltradas = transacoes
    // 1️⃣ Remove todas as linhas cuja data seja "(sem data)"
    .filter((t) => t.data !== "(sem data)")
    // 2️⃣ Mantém somente linhas que tenham valor na entrada OU na saída
    .filter((t) => {
      const temEntrada = t.entrada && String(t.entrada).trim() !== "";
      const temSaida = t.saida && String(t.saida).trim() !== "";
      return temEntrada || temSaida;
    })
    // 3️⃣ Ordena por data crescente
    .sort((a, b) => {
      // Converte de "dd/mm/aaaa" para "aaaa-mm-dd" e cria objetos Date
      const dataA = new Date(a.data.split("/").reverse().join("-"));
      const dataB = new Date(b.data.split("/").reverse().join("-"));
      return dataA - dataB; // crescente
    })
    // 4️⃣ Remove a coluna saldo
    .map(({ saldo, ...rest }) => rest);

  console.log(`🔍 Total original: ${transacoes.length}`);
  console.log(`✅ Total após filtro: ${transacoesFiltradas.length}`);
  const worksheet = XLSX.utils.json_to_sheet(transacoesFiltradas);
  //Usa a biblioteca SheetJS(XLSX) para converter o array 'transações' em uma planilha
  //cada objeto vira uma linha e cada chave vira uma coluna.
  console.log("Biblioteca SheetJS iniciando processo... ✅");
  const workbook = XLSX.utils.book_new();
  //Cria uma variável workbook  e adiciona a aba transações no excel

  XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");
  console.log("Aba Criada no Excel ✅");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  console.log("buffer binário.xlsx pronto ✅");
  //convert o workbook em um 'buffer binário' no formato .xlsx
  //Ele é o conteúdo bruto do EXCEL.
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  console.log("blob gerado, link temporário em produção... 🔁");
  //Cria um Blob, que é um tipo de arquivo temporário na memória do navegador.

  const url = URL.createObjectURL(blob);
  //Gera uma URL temporária para esse blob que será usado para baixar o arquivo

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.textContent = "📊 Baixar Excel das Transações.xlsx 📊";
  link.className = "btn";
  document.getElementById("download-btn").appendChild(link);

  console.log("✅ Planilha Excel pronta para download");
}

// Função para exibir o texto extraído e permitir download
function exibirTexto(texto) {
  //console.log('🖥️ Exibindo texto extraído no elemento #process-area');
  const areaProcessamento = document.getElementById("process-area");

  //const pre = document.createElement('pre');
  //pre.textContent = texto;
  //areaProcessamento.appendChild(pre);
  //Agora exibe apenas o botão para download do arquivo txt.
  console.log("📁 Criando arquivo .txt para download");
  const blob = new Blob([texto], { type: "text/plain" });
  console.log("Etiqueta pronta ✅");
  //blob - guarda o texto extraido com a etiqueta: 'Sou um arquivo TXT
  const url = URL.createObjectURL(blob);
  //Endereço para o browser buscar o arquivo .txt
  console.log("Endereço encontrado ✅");

  const link = document.createElement("a");
  //Ponto de partida para criação do dowunload.
  //Cria o elemeto link

  //Aponta para o endereço temporário que o browser criou para acessar o conteúdo do arquivo.
  link.href = url; //Caminho para caixinha que preparei antes
  //Quando clicarem nese link busque esse conteúdo
  console.log("Conteúdo para download localizado ✅");
  link.download = "Arquivo-convertido.txt"; // Nome do arquivo que o usuário vai baixar.
  console.log("Nome do Arquivo aplicado ✅");
  link.textContent = "📥 Baixar arquivo convertido .txt 📥"; //Texto que aparece dentro do botão.
  console.log("Nome para o botão download aplicado ✅");
  link.className = "btn"; //Da a classe 'btn' ao botão.
  console.log("Classe btn-download adicionada ao botão ✅");
  document.getElementById("download-btn").appendChild(link); //Coloca o botão na tela, dentro da área de processamento.
  console.log("Botão adicionado a area de processamento ✅");

  console.log("✅ Link de download criado e exibido com sucesso");
}
