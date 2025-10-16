import puppeteer from "puppeteer";
//import WebSocket, { WebSocketServer } from "ws";

const USUARIO = "";
const SENHA = "";

let browser, page;
let currentURL = "";

// WebSocket server
//const wss = new WebSocketServer({ port: 8080 });

//wss.on("connection", (ws) => {
 // console.log("[WS] Cliente conectado");

//  if (currentURL) {
 //   ws.send(JSON.stringify({ tipo: "URL", mensagem: currentURL }));
  //  sendToFrontend("LOG", "Frontend reconectado. Status do backend enviado.");
  //}
//});



// Enviar mensagens ao frontend
function sendToFrontend(tipo, mensagem) {
  console.log(`[${tipo}] ${mensagem}`);

}

// Atualiza URL
async function updateURL(url) {
  if (url !== currentURL) {
    currentURL = url;
    sendToFrontend("URL", url);
  }
}

// Fecha pop-ups rapidamente
async function fecharPopups(page) {
  const popupSelectors = [
    '#avisoBrowser a[data-dismiss="modal"].btn',
    '#avisoBrowser button[data-dismiss="modal"].close',
    'button[aria-label="Fechar"]',
    'button.close',
    'div.modal-footer button.btn-primary',
    'a.close-button',
    '#fecharModal',
    '#btnFecharAviso'
  ];

  for (const selector of popupSelectors) {
    try {
      const popup = await page.$(selector);
      if (popup) {
        await Promise.all([
          popup.click(),
          page.waitForFunction(() => !document.querySelector("div.modal.show"), { timeout: 5000 })
        ]);
        sendToFrontend("Carregando recursos iniciais...");
        return true;
      }
    } catch {}
  }
  return false;
}

// Fluxo completo do login/navegação
export async function iniciarLoginAutomático(usuario, senha) {
  try {
    if (!usuario || !senha) {
      return { sucesso: false, mensagem: "Informe usuário e senha." };
    }

    if (!browser || !page) {
browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
      page = await browser.newPage();
    }

    if (!page.url().includes("https://web.sids.mg.gov.br/reds")) {
      await page.goto("https://web.sids.mg.gov.br/reds", { waitUntil: "networkidle2" });
      await updateURL(page.url());
      sendToFrontend("LOG", "Página inicial carregada");
    }

    if (page.url().includes("authenticationendpoint/login.do")) {
      await page.type("#usernameUserInput", usuario, { delay: 20 });
      await page.type("#password", senha, { delay: 20 });

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
        page.click("[data-testid='login-page-continue-login-button']")
      ]);

      await page.waitForSelector("ul#listaMenu", { visible: true, timeout: 30000 });
      await updateURL(page.url());
      sendToFrontend("LOG", "Login concluído");
    }

    let popupsFechados = true;
    while (popupsFechados) {
      popupsFechados = await fecharPopups(page);
    }

    if (!page.url().includes("consultaAvancada.do")) {
      await page.goto("https://web.sids.mg.gov.br/reds/consultas/consultaAvancada.do?operation=loadForSearch&tela=CA", { waitUntil: "networkidle2" });
      await updateURL(page.url());
      sendToFrontend("LOG", "Página de Consulta Avançada carregada");
    }

    if (!page.url().includes("pesquisaIndividuo.do")) {
      await page.goto("https://web.sids.mg.gov.br/reds/dialogs/pesquisaIndividuo.do?operation=loadForSearch", { waitUntil: "networkidle2" });
      await page.waitForSelector("input[name='rg']", { visible: true, timeout: 30000 });
      await updateURL(page.url());
      sendToFrontend("LOG", "Sistema pronto para pesquisa. Informe o RG para iniciar.");
      sendToFrontend("LOG", "Página de Pesquisa de Indivíduo carregada ✅");
    }

    return { sucesso: true, page, browser };
  } catch (err) {
    sendToFrontend("ERRO", `Erro no fluxo: ${err.message}`);
    if (browser) await browser.close();
    browser = null;
    page = null;
    return { sucesso: false, mensagem: "Erro no login/navegação", erro: err.message };
  }
}

// Pesquisar RG + Coletar dados
export async function pesquisarPorRG(rg) {
  if (!page) return { sucesso: false, mensagem: "Sessão não iniciada" };

  try {
    if (!page.url().includes("pesquisaIndividuo.do")) {
      await page.goto("https://web.sids.mg.gov.br/reds/dialogs/pesquisaIndividuo.do?operation=loadForSearch", { waitUntil: "networkidle2" });
      await page.waitForSelector("input[name='rg']", { visible: true, timeout: 30000 });
      await updateURL(page.url());
      sendToFrontend("LOG", "Sistema pronto para pesquisa. Informe o RG para iniciar.");
      sendToFrontend("LOG", "Página de Pesquisa de Indivíduo carregada ✅");
    }

    const inputRG = await page.waitForSelector("input[name='rg']", { visible: true, timeout: 10000 });
    await inputRG.click({ clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type("input[name='rg']", rg, { delay: 20 });

    await page.click("input[name='pesquisa']");

    await page.waitForFunction(
      (valor) => document.querySelector("input[name='num_rg']")?.value === valor,
      { timeout: 10000 },
      rg
    );

    // Coleta dados com artigos de inquérito
const dados = await page.evaluate(() => {
  const getValue = (name) => document.querySelector(`input[name='${name}']`)?.value?.trim() || "";

  let quantidadeInqueritos = "0";
  let comarcaInquerito = "";
  let artigos = [];

  // Procura a tabela principal de inquérito (geralmente a primeira relevante)
  const tabelas = Array.from(document.querySelectorAll("table[aria-hidden='true']"));

  // Encontrar a tabela que contém "Quantidade de Inqueritos"
  const tabelaInquerito = tabelas.find(table => 
    Array.from(table.querySelectorAll("tr")).some(tr => 
      tr.querySelector("td span.label")?.textContent.trim() === "Quantidade de Inqueritos:"
    )
  );

  if (tabelaInquerito) {
    tabelaInquerito.querySelectorAll("tr").forEach(tr => {
      const label = tr.querySelector("td span.label")?.textContent.trim() || "";
      const valor = tr.querySelector("td:nth-child(2) span.label")?.textContent.trim() || "";

      if (label === "Quantidade de Inqueritos:") {
        quantidadeInqueritos = valor;
      } else if (label === "Comarca Inquerito:") {
        comarcaInquerito = valor;
      } else if (label.includes("Lei/Artigo:")) {
        if (valor && valor.toLowerCase() !== "art" && !artigos.includes(valor)) {
          artigos.push(valor); // adiciona somente se ainda não estiver no array
        }
      }
    });
  }

  return {
    rg: getValue("num_rg"),
    nome: getValue("nom_completo"),
    nomeMae: getValue("nom_mae"),
    nomePai: getValue("nom_pai"),
    dataNascimento: getValue("dta_nascimento"),
    sexo: getValue("des_sexo"),
    corPele: getValue("des_cor_pele"),
    corOlhos: getValue("des_cor_olhos"),
    nacionalidade: getValue("des_nacionalidade"),
    naturalidade: getValue("des_naturalidade"),
    uf: getValue("uf"),
    sinalDesaparecimento: getValue("des_sinal_desaparecimento"),
    mandadoPrisaoEvento: getValue("des_mandado_prisao"),
    mandadoPrisaoAtual: getValue("des_mandado_prisao_atual"),
    prontuario: getValue("num_prontuario"),
    identidadeFalsa: getValue("identidade_falsa"),
    quantidadeInqueritos,
    comarcaInquerito,
    artigosInqueritos: artigos
  };
});



    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ tipo: "DADOS_INDIVIDUO", dados }));
      }
    });

    sendToFrontend("LOG", `Dados coletados do RG ${rg}`);
    return { sucesso: true, mensagem: "Pesquisa concluída ✅", dados };

  } catch (err) {
    sendToFrontend("Ops, RG não encontrado ou AcessoSIDS fora do ar, favor tentar novamente mais tarde.");
    return { sucesso: false, mensagem: "Ops, RG não encontrado ou AcessoSIDS fora do ar, favor tentar novamente mais tarde.", erro: err.message };
  }
}
