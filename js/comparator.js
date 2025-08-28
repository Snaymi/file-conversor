document.addEventListener('DOMContentLoaded', function (){
        console.log('✅ Comparador pronto para receber arquivos')
    const btn1 = document.getElementById('btn-arquivo1');
    const input1 = document.getElementById('file-comparator1');
    const btn2 = document.getElementById('btn-arquivo2')
    const input2 = document.getElementById('file-comparator2');

    if (!input1) {
        console.log('❌ Botão arquivo1 não encontrado no DOM');
        return;
    }
    if (!input2) {
        console.log('❌ Botão arquivo2 não encontrado no DOM');
        return;
    }
    console.log('Botões arquivo1 e arquivo2 carregados, produzindo evento do click 🔁');
    console.log('Evento click Pronto ✅')
    btn1.addEventListener('click', function () {
        console.log('🖱️ Botão para selecionar arquivo 1 clicado');
        input1.click();
        console.log('Abrindo seletor de arquivos... 📁')
    })
    btn2.addEventListener('click', function(){
        console.log('🖱️ Botão para selecionar arquivo 2 clicado')
        input2.click();
        console.log('Abrindo seletor de arquivos... 📁')
    })
    input1.addEventListener('change', function(){
        const file1 = input1.files[0];
        console.log('📂 Primeiro arquivo selecionado: ', file1.name);
    });
    input2.addEventListener('change', function(){
        const file2 = input2.file[0];
        console.log('📁 Arquivo 2 selecionado: ', file2.name);
    });
});