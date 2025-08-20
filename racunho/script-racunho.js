linhas.forEach((linha, index) => {
    console.log("verificando linha: ", index + 1);
    if (linha.includes('|C100|')) {
        ultimoC100 = linha;
    }
    if (linha.includes('|C170|') || linha.includes('|C190|')) {
        if (!ultimoC100) {
            erros.push(`Erro na linha ${index + 1}: ${linha.trim()} - sem C100 anterior.`);
        }
    }
});