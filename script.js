// 1. PRIMEIRO importamos as funções do SDK do Firebase
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. DEPOIS importamos as configurações do seu arquivo local
import { db } from './firebase-config.js';

// 3. AGORA inicializamos o Auth garantindo que ele pegue a instância correta
const auth = getAuth();

// --- FUNÇÃO PARA ALTERNAR VISUALMENTE ENTRE LOGIN E CADASTRO ---
window.trocarAba = function(aba) {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const btnLogin = document.getElementById('btn-login-aba');
    const btnRegistro = document.getElementById('btn-registro-aba');

    if (!formLogin || !formRegistro || !btnLogin || !btnRegistro) return;

    if (aba === 'login') {
        formLogin.classList.add('active');
        formRegistro.classList.remove('active');
        btnLogin.classList.add('active');
        btnRegistro.classList.remove('active');
    } else if (aba === 'registro') {
        formRegistro.classList.add('active');
        formLogin.classList.remove('active');
        btnRegistro.classList.add('active');
        btnLogin.classList.remove('active');
    }
};

/* --- VALIDAÇÃO E EVENTO DE LOGIN --- */
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email-login').value;
        const senha = document.getElementById('senha-login').value;

        try {
            // Tenta realizar o login no Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            alert("Login realizado com sucesso! Bem-vindo(a).");
            
            // Redireciona ou atualiza a página aqui se necessário
            // window.location.href = "pagina-interna.html";

        } catch (error) {
            console.error("Erro ao logar:", error.code);
            
            // Se o e-mail não existir no sistema, avisa e joga para o cadastro
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                alert("Usuário não encontrado ou senha incorreta! Se você ainda não tem conta, faça seu cadastro.");
                trocarAba('registro'); // Move o usuário automaticamente para a aba de cadastro
            } else {
                alert("Erro ao entrar: " + error.message);
            }
        }
    });
}

/* --- CADASTRO CLIENTE */
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

            alert("Cadastro realizado com sucesso! Agora você pode fazer o login.");
            formRegistro.reset();
            trocarAba('login'); // Retorna o usuário para a tela de login após cadastrar

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

