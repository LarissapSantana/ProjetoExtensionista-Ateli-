import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAHUXFJ01d6PLJw4QMzwixGwkISi1pmBY4",
    authDomain: "atelie-jenifer.firebaseapp.com",
    projectId: "atelie-jenifer",
    storageBucket: "atelie-jenifer.firebasestorage.app",
    messagingSenderId: "866581941467",
    appId: "1:866581941467:web:752e37d6c7110b1e1090fe",
    measurementId: "G-J4H9DLL265"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);