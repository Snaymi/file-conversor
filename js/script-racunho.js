const comparador = function() {
    /* Utils */
    const getElement = function (ElId) {
        const el = document.getElementById(ElId);
        if (!el) {
            console.error('Elemento de id: ' + ElId + ' não encontrado');
            return;
        }
        return el;
    }

    /* Adds click listeners to all needed buttons */
    const addButtonListeners = function() {
        const buttonInputMap = new Map([
            ['file-comparator1', 'btn-arquivo1'],
            ['file-comparator2', 'btn-arquivo2']
        ]);

        buttonInputMap.forEach(function(inputId, btnEl) {
            const inputEl = getElement(inputId);
            const btnElId = getElement(btnEl);
            if (!inputEl || !btnElId) {
                console.log('Botão para selecionar com id ' + btnElId + ' clicado');
                inputEl.click();
            }

            inputEl.addEventListener('change', function() {
                getElement('label-' + btnEl).innerText = 'Primeiro arquivo selecionado: ' + inputEl.files[0].name;
            });
        });
    }

    /* Start the script */
    const start = function() {
        document.addEventListener('DOMContentLoaded', addButtonListeners);
    }

    return {
        init: function() {
            start();
        }
    }
}
