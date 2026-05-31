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

document.getElementById('btn-login-aba').addEventListener('click', () => trocarAba('login'));
document.getElementById('btn-registro-aba').addEventListener('click', () => trocarAba('registro'));

function trocarAba(aba) {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const btnLogin = document.getElementById('btn-login-aba');
    const btnRegistro = document.getElementById('btn-registro-aba');

    if (aba === 'login') {
        formLogin.classList.add('active');
        formRegistro.classList.remove('active');
        btnLogin.classList.add('active');
        btnRegistro.classList.remove('active');
    } else {
        formLogin.classList.remove('active');
        formRegistro.classList.add('active');
        btnLogin.classList.remove('active');
        btnRegistro.classList.add('active');
    }
}
const radiosPerfil = document.querySelectorAll('input[name="perfil"]');
const inputDoc = document.getElementById('doc-input');

radiosPerfil.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const perfil = e.target.value; // Pega o valor do rádio clicado ('cpf' ou 'cnpj')
        
        inputDoc.value = ""; // Limpa o campo para evitar confusão
        if (perfil === 'cpf') {
            inputDoc.placeholder = "000.000.000-00";
        } else {
            inputDoc.placeholder = "00.000.000/0001-00";
        }
    });
});