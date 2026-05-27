function filtrarProdutos() {
    const busca = document.getElementById('buscaNome').value.toLowerCase();
    const categoria = document.getElementById('filtroCategoria').value;
    const precoMax = parseFloat(document.getElementById('filtroPreco').value);
    
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const nomeProduto = card.querySelector('h3').innerText.toLowerCase();
        const categoriaProduto = card.getAttribute('data-categoria');
        const precoProduto = parseFloat(card.getAttribute('data-preco'));

        const bateNome = nomeProduto.includes(busca);
        const bateCategoria = (categoria === 'todos' || categoria === categoriaProduto);
        const batePreco = precoProduto <= precoMax;

        if (bateNome && bateCategoria && batePreco) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

function trocarAba(tipo) {
    document.querySelectorAll('.form-acesso').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));

    if (tipo === 'login') {
        document.getElementById('form-login').classList.add('active');
        event.currentTarget.classList.add('active');
    } else {
        document.getElementById('form-registro').classList.add('active');
        event.currentTarget.classList.add('active');
    }
}

function ajustarCampos(perfil) {
    const inputDoc = document.getElementById('doc-input');
    if (perfil === 'cpf') {
        inputDoc.placeholder = "000.000.000-00";
    } else {
        inputDoc.placeholder = "00.000.000/0001-00";
    }
}