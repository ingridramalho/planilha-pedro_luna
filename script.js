// 🔥 Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

//
// ⚠️⚠️⚠️ COPIE E COLE SUAS CREDENCIAIS DO FIREBASE AQUI ⚠️⚠️⚠️
// Para que o app funcione em qualquer computador, os dados precisam ser salvos online.
//
const firebaseConfig = {
  // 1. Substitua "SUA_API_KEY" pela sua "apiKey"
  apiKey: "SUA_API_KEY",
  // 2. Substitua "SEU_DOMINIO" pelo seu "authDomain"
  authDomain: "SEU_DOMINIO",
  // 3. Substitua "SEU_PROJECT_ID" pelo seu "projectId"
  projectId: "SEU_PROJECT_ID",
};

// O código abaixo se conecta ao Firebase e faz tudo funcionar.
// Ele só vai funcionar depois que você colocar suas credenciais acima.

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📌 Salvar gasto
async function salvarGasto() {
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);

  if (!descricao || !valor) return;

  try {
    await addDoc(collection(db, "gastos"), {
      descricao,
      valor
    });
    
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";

    carregarGastos();

  } catch (e) {
    console.error("Erro ao adicionar documento: ", e);
    alert("Erro ao salvar o gasto! Verifique se suas credenciais do Firebase estão corretas.");
  }
}

// 📌 Carregar gastos e calcular média
async function carregarGastos() {
  try {
    const querySnapshot = await getDocs(collection(db, "gastos"));

    let soma = 0;
    let lista = document.getElementById("lista");
    lista.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const gasto = doc.data();
      soma += gasto.valor;

      const li = document.createElement("li");
      li.innerText = `${gasto.descricao} - R$ ${gasto.valor.toFixed(2)}`;
      lista.appendChild(li);
    });

    const media = querySnapshot.size > 0 ? soma / querySnapshot.size : 0;
    document.getElementById("media").innerText = `R$ ${media.toFixed(2)}`;

  } catch (e) {
    console.error("Erro ao carregar gastos: ", e);
    // Não mostraremos um alerta ao carregar para não ser intrusivo, mas o erro aparecerá no console.
  }
}

// Inicia o app
carregarGastos();

// torna a função salvarGasto visível no HTML
