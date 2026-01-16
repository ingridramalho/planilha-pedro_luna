// 🔥 Firebase - MANTENHA ESTA PARTE COMO ESTÁ
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA58b6PUV-gD_Y1smbQvhJo1-90R6XXlmc",
    authDomain: "planilha-pedroluna.firebaseapp.com",
    projectId: "planilha-pedroluna",
    storageBucket: "planilha-pedroluna.appspot.com",
    messagingSenderId: "571751777687",
    appId: "1:571751777687:web:927a13099f4e7ec376b0d2"
};

// --- ESTRUTURA DA PLANILHA ---

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CATEGORIAS = {
    recebimentos: ["Mae", "Pai", "Bolsa", "Extra 1", "Extra 2"],
    despesas: [
        { nome: "Aluguel", tipo: "fixo" },
        { nome: "Condomínio", tipo: "fixo" },
        { nome: "Luz", tipo: "fixo" },
        { nome: "Internet", tipo: "fixo" },
        { nome: "Mercado", tipo: "variavel" },
        { nome: "Pet", tipo: "variavel" },
        { nome: "Lazer/aleatório", tipo: "variavel" },
        { nome: "Cheque especial", tipo: "variavel" },
    ]
};

// --- CÓDIGO PRINCIPAL ---

let db;
let planilhaData = {};
const seletorAno = document.getElementById("ano");

function inicializarFirebase() {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
}

function gerarTabelas() {
    const rec = document.querySelector("#tabela-recebimentos tbody");
    const des = document.querySelector("#tabela-despesas tbody");
    rec.innerHTML = "";
    des.innerHTML = "";

    CATEGORIAS.recebimentos.forEach(cat => {
        const l = rec.insertRow();
        l.insertCell().innerText = cat;
        for (let i = 0; i < 12; i++)
            l.insertCell().innerHTML = `<input type="number" id="recebimentos-${cat}-${i}" class="valor-input">`;
        l.insertCell().id = `recebimentos-${cat}-media`;
        l.lastChild.innerText = "R$ 0,00";
    });

    CATEGORIAS.despesas.forEach(cat => {
        const l = des.insertRow();
        l.insertCell().innerText = cat.nome;
        for (let i = 0; i < 12; i++)
            l.insertCell().innerHTML = `<input type="number" id="despesas-${cat.nome}-${i}" class="valor-input">`;
        l.insertCell().id = `despesas-${cat.nome}-media`;
        l.lastChild.innerText = "R$ 0,00";
    });

    document.querySelectorAll(".valor-input").forEach(i =>
        i.addEventListener("change", salvarValor)
    );

    gerarRodapes();
}

function gerarRodapes() {
    document.querySelector("#tabela-recebimentos tfoot").innerHTML = `
        <tr>
            <td>Total</td>
            ${MESES.map((_, i) => `<td id="total-recebimentos-${i}">R$ 0,00</td>`).join("")}
            <td id="media-total-recebimentos">R$ 0,00</td>
        </tr>`;

    document.querySelector("#tabela-despesas tfoot").innerHTML = `
        <tr>
            <td>Total</td>
            ${MESES.map((_, i) => `<td id="total-despesas-${i}">R$ 0,00</td>`).join("")}
            <td id="media-total-despesas">R$ 0,00</td>
        </tr>`;

    gerarResumo();
}

function gerarResumo() {
    document.getElementById("tabela-resumo").innerHTML = `
        <tr><th>Resumo</th>${MESES.map(m=>`<th>${m}</th>`).join("")}<th>Total</th></tr>
        <tr><td>Recebimentos</td>${MESES.map((_,i)=>`<td id="resumo-recebimentos-${i}">R$ 0,00</td>`).join("")}<td id="resumo-recebimentos-anual">R$ 0,00</td></tr>
        <tr><td>Despesas</td>${MESES.map((_,i)=>`<td id="resumo-despesas-${i}">R$ 0,00</td>`).join("")}<td id="resumo-despesas-anual">R$ 0,00</td></tr>
        <tr><td>Saldo</td>${MESES.map((_,i)=>`<td id="resumo-saldo-${i}">R$ 0,00</td>`).join("")}<td id="resumo-saldo-anual">R$ 0,00</td></tr>
    `;
}

function popularAnos() {
    const atual = new Date().getFullYear();
    for (let i = 0; i < 5; i++)
        seletorAno.innerHTML += `<option value="${atual-i}">${atual-i}</option>`;
    seletorAno.onchange = () => carregarDadosDoAno(seletorAno.value);
}

async function carregarDadosDoAno(ano) {
    const ref = doc(db, "financas", `ano_${ano}`);
    const snap = await getDoc(ref);
    planilhaData = snap.exists() ? snap.data() : {};
    preencher();
    recalcular();
}

async function salvarValor(e) {
    const [t, c, m] = e.target.id.split("-");
    const v = parseFloat(e.target.value) || 0;
    planilhaData[t] ??= {};
    planilhaData[t][c] ??= {};
    planilhaData[t][c][m] = v;
    recalcular();
    await setDoc(doc(db,"financas",`ano_${seletorAno.value}`), planilhaData, { merge:true });
}

function preencher() {
    document.querySelectorAll(".valor-input").forEach(i=>{
        const [t,c,m]=i.id.split("-");
        i.value = planilhaData[t]?.[c]?.[m] ?? "";
    });
}

function recalcular() {
    let tr=0, td=0;
    for(let i=0;i<12;i++){
        let r=0,d=0;
        CATEGORIAS.recebimentos.forEach(c=>r+=planilhaData.recebimentos?.[c]?.[i]||0);
        CATEGORIAS.despesas.forEach(c=>d+=planilhaData.despesas?.[c.nome]?.[i]||0);
        tr+=r; td+=d;
        document.getElementById(`total-recebimentos-${i}`).innerText=r.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
        document.getElementById(`total-despesas-${i}`).innerText=d.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
        document.getElementById(`resumo-saldo-${i}`).innerText=(r-d).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    }
    document.getElementById("resumo-recebimentos-anual").innerText=tr.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    document.getElementById("resumo-despesas-anual").innerText=td.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    document.getElementById("resumo-saldo-anual").innerText=(tr-td).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

async function init(){
    inicializarFirebase();
    popularAnos();
    gerarTabelas();
    await carregarDadosDoAno(seletorAno.value);
}
init();
