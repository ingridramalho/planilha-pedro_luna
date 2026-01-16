// 🔥 Firebase - MANTENHA ESTA PARTE COMO ESTÁ
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

//
// ⚠️⚠️⚠️ COPIE E COLE SUAS CREDENCIAIS DO FIREBASE AQUI ⚠️⚠️⚠️
//
const firebaseConfig = {
    apiKey: "AIzaSyA58b6PUV-gD_Y1smbQvhJo1-90R6XXlmc",
    authDomain: "planilha-pedroluna.firebaseapp.com",
    projectId: "planilha-pedroluna",
    storageBucket: "planilha-pedroluna.firebasestorage.app",
    messagingSenderId: "571751777687",
    appId: "1:571751777687:web:927a13099f4e7ec376b0d2",
    measurementId: "G-MH1LWR0WQV"
};

// --- ESTRUTURA DA PLANILHA ---

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CATEGORIAS = {
    recebimentos: [
        "Mae", "Pai", "Bolsa", "Extra 1", "Extra 2"
    ],
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
let planilhaData = {}; // Objeto para guardar todos os dados do ano
const seletorAno = document.getElementById('ano');

/**
 * Inicializa o Firebase
 */
function inicializarFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch (e) {
        console.error("Erro ao inicializar o Firebase: ", e);
        alert("ERRO CRÍTICO: As credenciais do Firebase em 'script.js' não são válidas. A planilha não funcionará.");
    }
}

/**
 * Gera as tabelas de recebimentos e despesas dinamicamente
 */
function gerarTabelas() {
    const tabelas = {
        recebimentos: document.querySelector("#tabela-recebimentos tbody"),
        despesas: document.querySelector("#tabela-despesas tbody")
    };

    // Limpa tabelas existentes
    tabelas.recebimentos.innerHTML = '';
    tabelas.despesas.innerHTML = '';

    // Gerar linhas de Recebimentos
    CATEGORIAS.recebimentos.forEach(cat => {
        const linha = tabelas.recebimentos.insertRow();
        linha.insertCell().innerText = cat;
        for (let i = 0; i < 12; i++) {
            linha.insertCell().innerHTML = `<input type="number" id="recebimentos-${cat}-${i}" class="valor-input">`;
        }
        linha.insertCell().outerHTML = `<td id="recebimentos-${cat}-media" class="media">R$ 0,00</td>`;
    });

    // Gerar linhas de Despesas
    CATEGORIAS.despesas.forEach(cat => {
        const linha = tabelas.despesas.insertRow();
        linha.insertCell().innerText = cat.nome;
        for (let i = 0; i < 12; i++) {
            linha.insertCell().innerHTML = `<input type="number" id="despesas-${cat.nome}-${i}" class="valor-input">`;
        }
        linha.insertCell().outerHTML = `<td id="despesas-${cat.nome}-media" class="media">R$ 0,00</td>`;
    });

    // Adicionar evento 'change' para salvar os dados
    document.querySelectorAll('.valor-input').forEach(input => {
        input.addEventListener('change', salvarValor);
    });

    gerarRodapes();
}

/**
 * Gera os rodapés com os totais
 */
function gerarRodapes() {
    const tfootRecebimentos = document.querySelector("#tabela-recebimentos tfoot");
    tfootRecebimentos.innerHTML = `
        <tr>
            <td>Total</td>
            ${MESES.map((_, i) => `<td id="total-recebimentos-${i}" class="total-mes">R$ 0,00</td>`).join('')}
            <td id="media-total-recebimentos" class="total-geral">R$ 0,00</td>
        </tr>
    `;

    const tfootDespesas = document.querySelector("#tabela-despesas tfoot");
    tfootDespesas.innerHTML = `
        <tr>
            <td>Total</td>
            ${MESES.map((_, i) => `<td id="total-despesas-${i}" class="total-mes">R$ 0,00</td>`).join('')}
            <td id="media-total-despesas" class="total-geral">R$ 0,00</td>
        </tr>
         <tr>
            <td>Total Fixos</td>
            ${MESES.map((_, i) => `<td id="total-fixos-${i}" class="total-mes">R$ 0,00</td>`).join('')}
            <td id="media-total-fixos" class="total-geral">R$ 0,00</td>
        </tr>
         <tr>
            <td>Total Não Fixos</td>
            ${MESES.map((_, i) => `<td id="total-nao-fixos-${i}" class="total-mes">R$ 0,00</td>`).join('')}
            <td id="media-total-nao-fixos" class="total-geral">R$ 0,00</td>
        </tr>
    `;
     gerarResumo();
}
/**
 * Gera a tabela de resumo
 */
function gerarResumo() {
    const tabelaResumo = document.getElementById("tabela-resumo");
    tabelaResumo.innerHTML = `
        <thead>
            <tr>
                <th>Resumo</th>
                ${MESES.map(mes => `<th>${mes}</th>`).join('')}
                <th>Total Anual</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Total Recebimentos</td>
                ${MESES.map((_, i) => `<td id="resumo-recebimentos-${i}">R$ 0,00</td>`).join('')}
                <td id="resumo-recebimentos-anual" class="total-anual">R$ 0,00</td>
            </tr>
            <tr>
                <td>Total Despesas</td>
                ${MESES.map((_, i) => `<td id="resumo-despesas-${i}">R$ 0,00</td>`).join('')}
                <td id="resumo-despesas-anual" class="total-anual">R$ 0,00</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td>Saldo</td>
                ${MESES.map((_, i) => `<td id="resumo-saldo-${i}" class="saldo">R$ 0,00</td>`).join('')}
                <td id="resumo-saldo-anual" class="total-anual saldo">R$ 0,00</td>
            </tr>
        </tfoot>
    `;
}

/**
 * Preenche o seletor de anos
 */
function popularAnos() {
    const anoAtual = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
        const ano = anoAtual - i;
        const option = document.createElement("option");
        option.value = ano;
        option.innerText = ano;
        seletorAno.appendChild(option);
    }
    seletorAno.onchange = () => carregarDadosDoAno(seletorAno.value);
}

/**
 * Carrega dados do Firebase para o ano selecionado
 * @param {number} ano 
 */
async function carregarDadosDoAno(ano) {
    if (!db) return;
    const docRef = doc(db, "financas", `ano_${ano}`);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            planilhaData = docSnap.data();
        } else {
            // Se não existe, cria um objeto vazio para o ano
            console.log("Nenhum dado para o ano " + ano + ". Começando do zero.");
            planilhaData = {}; 
        }
        preencherTabelasComDados();
        recalcularTudo();
    } catch (error) {
        console.error("Erro ao carregar dados: ", error);
        alert("Não foi possível carregar os dados do Firebase.");
    }
}

/**
 * Salva o valor de uma célula no Firebase
 * @param {Event} event 
 */
async function salvarValor(event) {
    const input = event.target;
    const [tipo, categoria, mes] = input.id.split('-');
    const valor = parseFloat(input.value) || 0;

    // Atualiza o objeto local
    if (!planilhaData[tipo]) planilhaData[tipo] = {};
    if (!planilhaData[tipo][categoria]) planilhaData[tipo][categoria] = {};
    planilhaData[tipo][categoria][mes] = valor;

    recalcularTudo();

    // Salva no Firebase
    if (!db) return;
    const ano = seletorAno.value;
    const docRef = doc(db, "financas", `ano_${ano}`);
    try {
        // Usamos set com merge para não sobrescrever outros campos
        await setDoc(docRef, planilhaData, { merge: true }); 
    } catch (error) {
        console.error("Erro ao salvar dados: ", error);
        alert("Erro ao salvar! Verifique a conexão e as permissões do Firebase.");
    }
}


/**
 * Preenche as tabelas com os dados carregados
 */
function preencherTabelasComDados() {
    document.querySelectorAll('.valor-input').forEach(input => {
        const [tipo, categoria, mes] = input.id.split('-');
        const valor = planilhaData[tipo]?.[categoria]?.[mes] || '';
        input.value = valor;
    });
}

/**
 * Recalcula todos os totais e médias e atualiza a interface
 */
function recalcularTudo() {
    const totais = {
        recebimentos: Array(12).fill(0),
        despesas: Array(12).fill(0),
        fixos: Array(12).fill(0),
        naoFixos: Array(12).fill(0)
    };

    // Calcula médias e totais de recebimentos
    CATEGORIAS.recebimentos.forEach(cat => {
        let soma = 0;
        let mesesComValor = 0;
        for (let i = 0; i < 12; i++) {
            const valor = planilhaData.recebimentos?.[cat]?.[i] || 0;
            if (valor > 0) {
                soma += valor;
                mesesComValor++;
            }
            totais.recebimentos[i] += valor;
        }
        const media = mesesComValor > 0 ? soma / mesesComValor : 0;
        document.getElementById(`recebimentos-${cat}-media`).innerText = media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    });

    // Calcula médias e totais de despesas
    CATEGORIAS.despesas.forEach(cat => {
        let soma = 0;
        let mesesComValor = 0;
        for (let i = 0; i < 12; i++) {
            const valor = planilhaData.despesas?.[cat.nome]?.[i] || 0;
             if (valor > 0) {
                soma += valor;
                mesesComValor++;
            }
            totais.despesas[i] += valor;
            if (cat.tipo === 'fixo') {
                totais.fixos[i] += valor;
            } else {
                totais.naoFixos[i] += valor;
            }
        }
        const media = mesesComValor > 0 ? soma / mesesComValor : 0;
        document.getElementById(`despesas-${cat.nome}-media`).innerText = media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    });

    // Atualiza os rodapés e resumo
    let totalAnualRecebimentos = 0;
    let totalAnualDespesas = 0;
    let totalAnualFixos = 0;
    let totalAnualNaoFixos = 0;

    for (let i = 0; i < 12; i++) {
        totalAnualRecebimentos += totais.recebimentos[i];
        totalAnualDespesas += totais.despesas[i];
        totalAnualFixos += totais.fixos[i];
        totalAnualNaoFixos += totais.naoFixos[i];

        // Rodapés
        document.getElementById(`total-recebimentos-${i}`).innerText = totais.recebimentos[i].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById(`total-despesas-${i}`).innerText = totais.despesas[i].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById(`total-fixos-${i}`).innerText = totais.fixos[i].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById(`total-nao-fixos-${i}`).innerText = totais.naoFixos[i].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Resumo
        document.getElementById(`resumo-recebimentos-${i}`).innerText = totais.recebimentos[i].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById(`resumo-despesas-${i}`).innerText = totais.despesas[i].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const saldoMes = totais.recebimentos[i] - totais.despesas[i];
        const saldoCell = document.getElementById(`resumo-saldo-${i}`);
        saldoCell.innerText = saldoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        saldoCell.className = saldoMes < 0 ? 'saldo-negativo' : 'saldo-positivo';
    }

    // Totais e médias anuais
    document.getElementById('media-total-recebimentos').innerText = (totalAnualRecebimentos / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('media-total-despesas').innerText = (totalAnualDespesas / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('media-total-fixos').innerText = (totalAnualFixos / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('media-total-nao-fixos').innerText = (totalAnualNaoFixos / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    document.getElementById('resumo-recebimentos-anual').innerText = totalAnualRecebimentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('resumo-despesas-anual').innerText = totalAnualDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const saldoAnual = totalAnualRecebimentos - totalAnualDespesas;
    const saldoAnualCell = document.getElementById('resumo-saldo-anual');
    saldoAnualCell.innerText = saldoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    saldoAnualCell.className = saldoAnual < 0 ? 'saldo-negativo' : 'saldo-positivo';
}

/**
 * Função de inicialização
 */
async function init() {
    inicializarFirebase();
    popularAnos();
    gerarTabelas();
    await carregarDadosDoAno(seletorAno.value);
}

// Inicia a aplicação
init();
