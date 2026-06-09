// 1. PRIMEIRO importamos as funções do SDK do Firebase
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// 2. DEPOIS importamos as configurações do seu arquivo local
import { db } from './firebase-config.js';
// Importe updateProfile lá no topo do seu script.js vindo do firebase-auth.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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

            await updateProfile(user, { displayName: nome });

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
    const filtroFavoritos = document.getElementById('filtroFavoritos'); // Captura o novo select
    
    const cards = document.querySelectorAll('#produtos .card');

    if (!buscaNome || !filtroCategoria || !filtroMassa || !filtroFavoritos) return;

    const termoBusca = buscaNome.value.toLowerCase().trim();
    const categoriaSelecionada = filtroCategoria.value;
    const massaSelecionada = filtroMassa.value;
    const apenasFavoritosAtivo = filtroFavoritos.value === 'favoritos'; // Descobre se o usuário escolheu "Meus Favoritos"

    cards.forEach(card => {
        const categoriaCard = card.getAttribute('data-categoria') || '';
        const massaCard = card.getAttribute('data-massa') || '';
        const tituloCard = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
        
        // Verifica se o ícone de coração dentro DESTE card possui a classe 'favoritado'
        const iconeCoracao = card.querySelector('.coracao');
        const ehFavorito = iconeCoracao ? iconeCoracao.classList.contains('favoritado') : false;

        // Condições de filtragem combinadas
        const bateCategoria = (categoriaSelecionada === 'todos' || categoriaCard === categoriaSelecionada);
        const bateMassa = (massaSelecionada === 'todos' || massaCard === massaSelecionada);
        const bateNome = tituloCard.includes(termoBusca);
        const bateFavorito = (!apenasFavoritosAtivo || ehFavorito); // Se o filtro estiver desativado, mostra tudo. Se estiver ativo, só mostra se ehFavorito for true.

        // O card só aparece se passar em absolutamente TODOS os filtros ativos simultaneamente
        if (bateCategoria && bateMassa && bateNome && bateFavorito) {
            card.style.setProperty('display', 'block', 'important');
        } else {
            card.style.setProperty('display', 'none', 'important');
        }
    });
};

// --- SISTEMA DE FAVORITOS INTEGRADO AO FIREBASE ---
// Altere ou verifique se a assinatura da função está capturando o element e o produtoId:
window.toggleFavorito = async function(element, produtoId) {
    const usuarioLogado = auth.currentUser;

    if (!usuarioLogado) {
        alert("Você precisa estar logado para favoritar um produto!");
        document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
        if (typeof window.trocarAba === 'function') {
            window.trocarAba('login');
        }
        return;
    }

    // Captura o span/i de coração interno
    const iconeCoracao = element.querySelector('.coracao') || element;
    const favoritoRef = doc(db, "usuarios", usuarioLogado.uid, "favoritos", produtoId);

    try {
        // Se já tem a classe 'favoritado', remove
        if (iconeCoracao.classList.contains('favoritado')) {
            await deleteDoc(favoritoRef);
            iconeCoracao.classList.remove('favoritado');
            console.log(`Removido dos favoritos: ${produtoId}`);
        } else {
            // Se não tem, adiciona
            await setDoc(favoritoRef, {
                idProduto: produtoId,
                adicionadoEm: new Date()
            });
            iconeCoracao.classList.add('favoritado');
            console.log(`Adicionado aos favoritos: ${produtoId}`);
        }
    } catch (erro) {
        console.error("Erro ao salvar favorito:", erro);
        alert("Não foi possível salvar nos favoritos.");
    }
};

// ==========================================================================
// SISTEMA DE CARRINHO COM LOCALSTORAGE (INTEGRAÇÃO ENTRE PÁGINAS)
// ==========================================================================

// Função auxiliar para carregar o carrinho do LocalStorage
function obterCarrinho() {
    return JSON.parse(localStorage.getItem('carrinho_atelie')) || [];
}

// Função auxiliar para salvar o carrinho no LocalStorage
function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinho_atelie', JSON.stringify(carrinho));
    atualizarContadorMenu();
}

// 1. Abre os controles de quantidade escondidos dentro do card
window.mostrarContadorCard = function(botaoPedir) {
    const rodape = botaoPedir.parentElement;
    const containerOpcoes = rodape.querySelector('.card-opcoes-quantidade');
    
    rodape.classList.add('selecionado');
    if (containerOpcoes) {
        containerOpcoes.style.display = 'flex';
    }
};

// 2. Controla o incremento e decremento (+ e -) no card
window.alterarQtdInterna = function(botaoContador, alteracao) {
    const containerSeletor = botaoContador.parentElement;
    const spanNumero = containerSeletor.querySelector('.card-qtd-numero');
    let quantidadeAtual = parseInt(spanNumero.textContent) || 1;
    
    quantidadeAtual += alteracao;
    if (quantidadeAtual < 1) quantidadeAtual = 1;
    
    spanNumero.textContent = quantidadeAtual;
};

// 3. AÇÃO: Botão Adicionar ao Carrinho
window.confirmarAdicaoCarrinho = function(botaoConfirmar, nome, preco) {
    const rodape = botaoConfirmar.closest('.card-rodape');
    const spanNumero = rodape.querySelector('.card-qtd-numero');
    const quantidade = parseInt(spanNumero.textContent) || 1;
    
    adicionarAoLocalStorage(nome, preco, quantidade);
    alert(`"${nome}" adicionado com sucesso ao carrinho!`);
    
    restaurarEstadoCard(rodape, spanNumero);
};

// 4. AÇÃO: Botão Comprar Já (Adiciona e vai direto para a página do carrinho)
window.confirmarCompraImediata = function(botaoConfirmar, nome, preco) {
    const rodape = botaoConfirmar.closest('.card-rodape');
    const spanNumero = rodape.querySelector('.card-qtd-numero');
    const quantidade = parseInt(spanNumero.textContent) || 1;
    
    adicionarAoLocalStorage(nome, preco, quantidade);
    restaurarEstadoCard(rodape, spanNumero);
    
    // Redireciona o usuário para a nova página do carrinho
    window.location.href = 'carrinho.html';
};

// Função interna para inserir ou somar a quantidade do item no LocalStorage
function adicionarAoLocalStorage(nome, preco, quantidade) {
    let carrinho = obterCarrinho();
    const produtoExistente = carrinho.find(item => item.nome === nome);
    
    if (produtoExistente) {
        produtoExistente.quantidade += quantidade;
    } else {
        carrinho.push({ nome, preco, quantidade });
    }
    
    salvarCarrinho(carrinho);
}

// Restaura o visual do card após a ação
function restaurarEstadoCard(rodape, spanNumero) {
    const containerOpcoes = rodape.querySelector('.card-opcoes-quantidade');
    rodape.classList.remove('selecionado');
    if (containerOpcoes) containerOpcoes.style.display = 'none';
    spanNumero.textContent = "1";
}

// Atualiza o número flutuante no ícone do menu 🛒
function atualizarContadorMenu() {
    const contadorGlobal = document.getElementById('carrinho-contador');
    if (!contadorGlobal) return;

    const carrinho = obterCarrinho();
    const totalItens = carrinho.reduce((acumulado, item) => acumulado + item.quantidade, 0);
    
    if (totalItens > 0) {
        contadorGlobal.textContent = totalItens;
        contadorGlobal.style.display = 'block';
    } else {
        contadorGlobal.style.display = 'none';
    }
}

// Configura o link do ícone do carrinho para abrir a nova página
window.abrirCarrinho = function() {
    window.location.href = 'carrinho.html';
};

// Executa automaticamente ao carregar a página inicial para atualizar o ícone 🛒
document.addEventListener('DOMContentLoaded', atualizarContadorMenu);