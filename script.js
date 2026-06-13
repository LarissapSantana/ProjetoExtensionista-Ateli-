// Importação das funções do SDK do Firebase
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, doc, setDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Importação das configurações do arquivo local
import { db } from './firebase-config.js';
// Inicialização do Auth garantindo que ele pegue a instância correta
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

/* --- EVENTO DE LOGIN --- */
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email-login').value;
        const senha = document.getElementById('senha-login').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Busca o perfil e dados do usuário no Firestore pelo UID
            const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const dadosUsuario = querySnapshot.docs[0].data();
                // Salva rigidamente no sessionStorage o perfil E o nome para uso rápido
                sessionStorage.setItem('perfil_cliente', dadosUsuario.perfil);
                sessionStorage.setItem('nome_cliente', dadosUsuario.nome);
            } else {
                sessionStorage.setItem('perfil_cliente', 'cnpj');
                sessionStorage.setItem('nome_cliente', user.displayName || "Cliente");
            }

            alert("Login realizado com sucesso! Bem-vindo(a).");
            window.location.reload(); 

        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro ao fazer login. Verifique as suas credenciais.");
        }
    });
}

/* --- MONITOR DE ESTADO DE AUTENTICAÇÃO E ATUALIZAÇÃO DA VITRINE --- */
onAuthStateChanged(auth, async (user) => {
    const secaoLoginCadastro = document.getElementById('secao-login-cadastro');
    const painelUsuario = document.getElementById('painel-usuario');
    const nomeUsuarioLogado = document.getElementById('nome-usuario-logado');
    // CORREÇÃO: Buscando pelo ID correto do painel para evitar que trave no "Carregando..."
    const tipoPerfilLogado = document.getElementById('tipo-perfil-logado');

    if (user) {
        if (secaoLoginCadastro) secaoLoginCadastro.style.display = 'none';
        if (painelUsuario) painelUsuario.style.display = 'block';

        // Se os dados não estiverem no sessionStorage (ex: F5 na página), busca no Firestore
        if (!sessionStorage.getItem('perfil_cliente') || !sessionStorage.getItem('nome_cliente')) {
            try {
                const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const dadosUsuario = querySnapshot.docs[0].data();
                    sessionStorage.setItem('perfil_cliente', dadosUsuario.perfil);
                    sessionStorage.setItem('nome_cliente', dadosUsuario.nome);
                }
            } catch (error) {
                console.error("Erro ao recuperar dados do usuário:", error);
            }
        }

        // CORREÇÃO: Exibe rigidamente o Nome Cadastrado (sem usar o e-mail fatiado)
        if (nomeUsuarioLogado) {
            const nomeCadastrado = sessionStorage.getItem('nome_cliente');
            nomeUsuarioLogado.textContent = nomeCadastrado || user.displayName || "Cliente";
        }

        // Define o texto do perfil (.tipo-perfil-logado)
        const perfilSalvo = sessionStorage.getItem('perfil_cliente') || 'cnpj';
        if (tipoPerfilLogado) {
            tipoPerfilLogado.textContent = perfilSalvo === 'cpf' ? 'Pessoa Física (Varejo)' : 'Empresa (Atacado)';
        }

    } else {
        if (secaoLoginCadastro) secaoLoginCadastro.style.display = 'block';
        if (painelUsuario) painelUsuario.style.display = 'none';
        sessionStorage.clear();
    }

    // Recalcula e atualiza os valores na tela inicial
    atualizarPrecosVitrine();
});

/* --- BOTÃO DE LOGOUT --- */
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (confirm("Deseja realmente sair da sua conta?")) {
            try {
                await signOut(auth);
                sessionStorage.clear();
                alert("Sessão encerrada.");
                window.location.reload();
            } catch (error) {
                console.error("Erro ao deslogar:", error);
            }
        }
    });
}

// Função para calcular o preço baseado no perfil do cliente 
window.calcularPrecoPorPerfil = function(nomeProduto, precoBase) {
    const perfil = sessionStorage.getItem('perfil_cliente') || 'cnpj';
    
    if (perfil !== 'cpf') {
        return precoBase; 
    }

    const nomeLower = nomeProduto.toLowerCase();

    if (nomeLower.includes('bolo') || nomeLower.includes('pote') || nomeLower.includes('bombom')) {
        return precoBase + 5.00;
    }
    
    if (nomeLower.includes('sanduíche') || nomeLower.includes('sanduiche') || nomeLower.includes('brownie')) {
        return precoBase + 3.00;
    }
    
    if (nomeLower.includes('cone')) {
        return precoBase + 2.50;
    }

    return precoBase; 
};

// Atualiza visualmente os preços dos cards na tela inicial baseado nas novas regras de acréscimo
function atualizarPrecosVitrine() {
    const precosOriginais = {
        "Bolo Black Meio Amargo": 13.00, "Bolo Brigadeiro com Maracujá": 13.00,
        "Bolo Doce de Leite com Ameixa": 13.00, "Bolo Doce de Leite com Coco": 13.00,
        "Bolo Ninho com Abacaxi": 13.00, "Bolo Ninho Branco": 13.00,
        "Bolo Ninho com Maracujá": 13.00, "Bolo Ninho com Morango": 13.00,
        "Bolo Ninho Trufado": 13.00, "Bolo Prestigio": 13.00,
        "Bolo Red Velvet": 13.00, "Bolo Suflair": 13.00,
        "Cone de Brigadeiro": 9.50, "Cone de Ferreiro": 9.50,
        "Cone de Raffaello": 9.50, "Cone de Kinder": 9.50,
        "Cone de Ninho com Nutella": 9.50, "Cone de Prestigio": 9.50,
        "Bombom de Uva": 14.00, "Brownie no pote de Maracujá": 14.00,
        "Brownie no pote de Doce de Leite": 14.00, "Brownie no pote de Dois Amores": 14.00,
        "Sanduíche de Brownie de Nutella": 7.00, "Sanduíche de Brownie de Ninho": 7.00,
        "Sanduíche de Brownie de Brigadeiro": 7.00, "Sanduíche de Brownie de Doce de Leite": 7.00,
        "Sanduíche de Brownie de Ovomaltine": 7.00
    };

    const cards = document.querySelectorAll('#produtos .card');
    cards.forEach(card => {
        const tituloElemento = card.querySelector('h3');
        if (!tituloElemento) return;
        
        const nomeProduto = tituloElemento.textContent.trim();
        const precoBase = precosOriginais[nomeProduto];

        if (precoBase) {
            // CORREÇÃO: Agora passamos também o nome do produto para decidir o acréscimo correto
            const precoFinal = window.calcularPrecoPorPerfil(nomeProduto, precoBase);
            const elementoPreco = card.querySelector('.preco');
            if (elementoPreco) {
                elementoPreco.textContent = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
            }

            const btnAdd = card.querySelector('.btn-acao-add');
            const btnComprar = card.querySelector('.btn-acao-comprar');

            if (btnAdd) {
                btnAdd.setAttribute('onclick', `window.confirmarAdicaoCarrinho(this, '${nomeProduto}', ${precoFinal})`);
            }
            if (btnComprar) {
                btnComprar.setAttribute('onclick', `window.confirmarCompraImediata(this, '${nomeProduto}', ${precoFinal})`);
            }
        }
    });
}

/* --- EVENTO DE CADASTRO COM CHECAGEM DE DUPLICIDADE --- */
const formRegistro = document.getElementById('form-registro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const perfilSelecionado = formRegistro.querySelector('input[name="perfil"]:checked');
        const tipoPerfil = perfilSelecionado ? perfilSelecionado.value : 'cpf'; 

        const nome = formRegistro.querySelector('input[placeholder*="Nome"]').value.trim();
        const email = formRegistro.querySelector('input[type="email"]').value.trim();
        const documento = document.getElementById('doc-input').value.trim();
        const senha = formRegistro.querySelector('input[placeholder="Crie uma senha"]').value;

        try {
            // 1. CHECAGEM DE E-MAIL DUPLICADO NO FIRESTORE
            const consultaEmail = query(collection(db, "usuarios"), where("email", "==", email));
            const snapshotEmail = await getDocs(consultaEmail);
            if (!snapshotEmail.empty) {
                alert("Este endereço de e-mail já está em uso por outra conta.");
                return; // Para a execução do cadastro aqui
            }

            // 2. CHECAGEM DE CPF/CNPJ DUPLICADO NO FIRESTORE
            const consultaDoc = query(collection(db, "usuarios"), where("documento", "==", documento));
            const snapshotDoc = await getDocs(consultaDoc);
            if (!snapshotDoc.empty) {
                alert(`Este ${tipoPerfil.toUpperCase()} já está cadastrado no sistema.`);
                return; // Para a execução do cadastro aqui
            }

            // 3. Se passou pelas duas checagens, cria o usuário no Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Define o nome de exibição nativo do Firebase Auth
            await updateProfile(user, { displayName: nome });

            // Salva os dados na coleção "usuarios" do Firestore
            await addDoc(collection(db, "usuarios"), {
                uid: user.uid,
                nome: nome,
                email: email,
                documento: documento,
                perfil: tipoPerfil, 
                dataCadastro: new Date()
            });

            alert("Cadastro realizado com sucesso! Agora pode iniciar sessão.");
            formRegistro.reset();
            window.trocarAba('login');

        } catch (error) {
            console.error("Erro ao cadastrar:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("Este endereço de e-mail já está em uso.");
            } else {
                alert("Erro ao realizar cadastro. Tente novamente.");
            }
        }
    });
}

// --- FUNÇÃO PARA ALTERNAR VISUALMENTE OS CAMPOS DE CPF E CNPJ ---
window.ajustarCampos = function(tipo) {
    const docInput = document.getElementById('doc-input');
    if (!docInput) return;

    if (tipo === 'cpf') {
        docInput.placeholder = "000.000.000-00";
        docInput.value = ""; 
    } else if (tipo === 'cnpj') {
        docInput.placeholder = "00.000.000/0001-00";
        docInput.value = ""; 
    }
};

/* --- FILTROS DE PESQUISA --- */
window.filtrarProdutos = function() {
    const buscaNome = document.getElementById('buscaNome');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroMassa = document.getElementById('filtroMassa');
    const filtroFavoritos = document.getElementById('filtroFavoritos'); 
    
    const cards = document.querySelectorAll('#produtos .card');
    if (!buscaNome || !filtroCategoria || !filtroMassa || !filtroFavoritos) return;

    const termoBusca = buscaNome.value.toLowerCase().trim();
    const categoriaSelecionada = filtroCategoria.value;
    const massaSelecionada = filtroMassa.value;
    const apenasFavoritosAtivo = filtroFavoritos.value === 'favoritos';

    cards.forEach(card => {
        const categoriaCard = card.getAttribute('data-categoria') || '';
        const massaCard = card.getAttribute('data-massa') || '';
        const tituloCard = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
        const iconeCoracao = card.querySelector('.coracao');
        const ehFavorito = iconeCoracao ? iconeCoracao.classList.contains('favoritado') : false;

        const bateCategoria = (categoriaSelecionada === 'todos' || categoriaCard === categoriaSelecionada);
        const bateMassa = (massaSelecionada === 'todos' || massaCard === massaSelecionada);
        const bateNome = tituloCard.includes(termoBusca);
        const bateFavorito = (!apenasFavoritosAtivo || ehFavorito);

        if (bateCategoria && bateMassa && bateNome && bateFavorito) {
            card.style.setProperty('display', 'block', 'important');
        } else {
            card.style.setProperty('display', 'none', 'important');
        }
    });
};

/* --- FAVORITOS --- */
window.toggleFavorito = async function(element, produtoId) {
    const usuarioLogado = auth.currentUser;
    if (!usuarioLogado) {
        alert("Precisa iniciar sessão para favoritar um produto!");
        document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
        window.trocarAba('login');
        return;
    }

    const iconeCoracao = element.querySelector('.coracao') || element;
    const favoritoRef = doc(db, "usuarios", usuarioLogado.uid, "favoritos", produtoId);

    try {
        if (iconeCoracao.classList.contains('favoritado')) {
            await deleteDoc(favoritoRef);
            iconeCoracao.classList.remove('favoritado');
        } else {
            await setDoc(favoritoRef, { idProduto: produtoId, adicionadoEm: new Date() });
            iconeCoracao.classList.add('favoritado');
        }
    } catch (erro) {
        console.error("Erro ao favoritar:", erro);
    }
};

/* --- CARRINHO LOCALSTORAGE --- */
function obterCarrinho() { return JSON.parse(localStorage.getItem('carrinho_atelie')) || []; }
function salvarCarrinho(carrinho) { localStorage.setItem('carrinho_atelie', JSON.stringify(carrinho)); atualizarContadorMenu(); }

window.mostrarContadorCard = function(botaoPedir) {
    const rodape = botaoPedir.parentElement;
    const containerOpcoes = rodape.querySelector('.card-opcoes-quantidade');
    rodape.classList.add('selecionado');
    if (containerOpcoes) containerOpcoes.style.display = 'flex';
};

window.alterarQtdInterna = function(botaoContador, alteracao) {
    const containerSeletor = botaoContador.parentElement;
    const spanNumero = containerSeletor.querySelector('.card-qtd-numero');
    let quantidadeAtual = parseInt(spanNumero.textContent) || 1;
    quantidadeAtual += alteracao;
    if (quantidadeAtual < 1) quantidadeAtual = 1;
    spanNumero.textContent = quantidadeAtual;
};

window.confirmarAdicaoCarrinho = function(botaoConfirmar, nome, preco) {
    const rodape = botaoConfirmar.closest('.card-rodape');
    const spanNumero = rodape.querySelector('.card-qtd-numero');
    const quantidade = parseInt(spanNumero.textContent) || 1;
    adicionarAoLocalStorage(nome, preco, quantidade);
    alert(`"${nome}" adicionado ao carrinho!`);
    restaurarEstadoCard(rodape, spanNumero);
};

window.confirmarCompraImediata = function(botaoConfirmar, nome, preco) {
    const rodape = botaoConfirmar.closest('.card-rodape');
    const spanNumero = rodape.querySelector('.card-qtd-numero');
    const quantidade = parseInt(spanNumero.textContent) || 1;
    adicionarAoLocalStorage(nome, preco, quantidade);
    restaurarEstadoCard(rodape, spanNumero);
    window.location.href = 'carrinho.html';
};

function adicionarAoLocalStorage(nome, preco, quantidade) {
    let carrinho = obterCarrinho();
    const produtoExistente = carrinho.find(item => item.nome === nome);
    if (produtoExistente) { produtoExistente.quantidade += quantidade; } 
    else { carrinho.push({ nome, preco, quantidade }); }
    salvarCarrinho(carrinho);
}

function restaurarEstadoCard(rodape, spanNumero) {
    const containerOpcoes = rodape.querySelector('.card-opcoes-quantidade');
    rodape.classList.remove('selecionado');
    if (containerOpcoes) containerOpcoes.style.display = 'none';
    spanNumero.textContent = "1";
}

function atualizarContadorMenu() {
    const contadorGlobal = document.getElementById('carrinho-contador');
    if (!contadorGlobal) return;
    const carrinho = obterCarrinho();
    const totalItens = carrinho.reduce((acumulado, item) => acumulado + item.quantidade, 0);
    contadorGlobal.textContent = totalItens;
    contadorGlobal.style.display = totalItens > 0 ? 'block' : 'none';
}

window.abrirCarrinho = function() { window.location.href = 'carrinho.html'; };

document.addEventListener('DOMContentLoaded', () => {
    atualizarContadorMenu();
});