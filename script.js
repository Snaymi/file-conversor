document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM CARREGADA');

    const btn = document.getElementById('btn-arquivo');
    const arquivo = document.getElementById('file-input');

    if (!btn) {
        console.error('Botão #btn-arquivo não encontrado!');
        return;
    }

    if (!arquivo) {
        console.error('Elemento #file-input não encontrado!');
        return;
    }

    btn.addEventListener('click', function () {
        console.log('Abrindo box para receber arquivo.');
        arquivo.click(); // Simula o clique no input de arquivo
    });

    arquivo.addEventListener('change', function () {
        console.log('Evento disparado para identificação do arquivo');
        const file = arquivo.files[0];
        if (file) {
            console.log('Arquivo Recebido!');
            console.log('Nome:', file.name);
            console.log('Tipo:', file.type);
            const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log('Tamanho do arquivo:', tamanhoMB, 'MB');
            console.log(arquivo);
        } else {
            console.log('Nenhum arquivo selecionado');
        }
    });
});