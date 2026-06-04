import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const auth = getAuth();

/*CADASTRO CLIENTE*/
const formRegistro = document.getElementById('form-registro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = formRegistro.querySelector('input[placeholder*="Nome"]').value;
        const email = formRegistro.querySelector('input[type="email"]').value;
        const documento = document.getElementById('doc-input').value;
        const senha = formRegistro.querySelector('input[placeholder="Crie uma senha"]').value;
        const tipoPerfil = formRegistro.querySelector('input[name="perfil"]:checked').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            await addDoc(collection(db, "usuarios"), {
                uid: user.uid,
                nome: nome,
                email: email,
                documento: documento,
                perfil: tipoPerfil,
                dataCadastro: new Date()
            });

            alert("Cadastro realizado com sucesso!");
            formRegistro.reset();
            trocarAba('login'); 

        } catch (error) {
            console.error("Erro ao cadastrar:", error.code);
            if (error.code === 'auth/email-already-in-use') {
                alert("Este e-mail já está em uso.");
            } else if (error.code === 'auth/weak-password') {
                alert("A senha deve ter pelo menos 6 dígitos.");
            } else {
                alert("Erro ao cadastrar: " + error.message);
            }
        }
    });
}
window.filtrarProdutos = function() {
    const buscaNome = document.getElementById('buscaNome');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroMassa = document.getElementById('filtroMassa');
    
    // Selecionamos os CARDS dentro da seção de produtos
    const cards = document.querySelectorAll('#produtos .card');

    if (!buscaNome || !filtroCategoria || !filtroMassa) return;

    const termoBusca = buscaNome.value.toLowerCase().trim();
    const categoriaSelecionada = filtroCategoria.value;
    const massaSelecionada = filtroMassa.value;

    cards.forEach(card => {
        const categoriaCard = card.getAttribute('data-categoria') || '';
        const massaCard = card.getAttribute('data-massa') || '';
        const tituloCard = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';

        // Validações
        const bateCategoria = (categoriaSelecionada === 'todos' || categoriaCard === categoriaSelecionada);
        const bateMassa = (massaSelecionada === 'todos' || massaCard === massaSelecionada);
        const bateNome = tituloCard.includes(termoBusca);

        // Força o sumisso do flexbox e grid com o important
        if (bateCategoria && bateMassa && bateNome) {
            card.style.setProperty('display', 'block', 'important');
        } else {
            card.style.setProperty('display', 'none', 'important');
        }
    });
};

window.toggleFavorito = (id) => {
    console.log(`Produto favoritado: ${id}`);
};