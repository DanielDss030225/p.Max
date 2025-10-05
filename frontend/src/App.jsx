import { useState, useEffect, useRef } from "react";

function DadosIndividuo({ dados }) {
  if (!dados) return null;

  return (
    <div className="painel-individuo">
      <h2>📋 Dados do indivíduo</h2>
      <div className="linha"><span>RG:</span> {dados.rg}</div>
      <div className="linha"><span>Nome:</span> {dados.nome}</div>
      <div className="linha"><span>Nome da Mãe:</span> {dados.nomeMae}</div>
      <div className="linha"><span>Nome do Pai:</span> {dados.nomePai}</div>
      <div className="linha"><span>Data de Nascimento:</span> {dados.dataNascimento}</div>
      <div className="linha"><span>Sexo:</span> {dados.sexo}</div>
      <div className="linha"><span>Cor da Pele:</span> {dados.corPele || "Não informada"}</div>
      <div className="linha"><span>Cor dos Olhos:</span> {dados.corOlhos || "Não informada"}</div>
      <div className="linha"><span>Nacionalidade:</span> {dados.nacionalidade}</div>
      <div className="linha"><span>Naturalidade:</span> {dados.naturalidade}</div>
      <div className="linha"><span>UF:</span> {dados.uf}</div>
      <div className="linha"><span>Sinal de Desaparecimento:</span> {dados.sinalDesaparecimento}</div>
      <div className="linha"><span>Mandado de Prisão (Evento):</span> {dados.mandadoPrisaoEvento}</div>
      <div className="linha"><span>Mandado de Prisão (Atual):</span> {dados.mandadoPrisaoAtual}</div>
      <div className="linha"><span>Prontuário:</span> {dados.prontuario || "Não informado"}</div>
      <div className="linha"><span>Identidade Falsa:</span> {dados.identidadeFalsa}</div>

      <div className="linha"><span>Quantidade de Inquéritos:</span> {dados.quantidadeInqueritos || "0"}</div>
      <div className="linha"><span>Comarca do Inquérito:</span> {dados.comarcaInquerito || "Não informado"}</div>

      {dados.artigosInqueritos && dados.artigosInqueritos.length > 0 && (
        <div className="linha" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <span>Artigos dos Inquéritos:</span>
          <ul style={{ margin: "5px 0 0 10px" }}>
            {dados.artigosInqueritos.map((art, idx) => (
              <li key={idx}>{art}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function App() {
  const [rg, setRg] = useState("");
  const [dados, setDados] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [prontoParaPesquisa, setProntoParaPesquisa] = useState(false);
  const wsRef = useRef(null);
  const paginaTimerRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/init")
      .then(res => res.json())
      .then(data => setMensagem(data.mensagem))
      .catch(err => setMensagem("Erro ao inicializar sessão: " + err.message));

    const criarWebSocket = () => {
      const ws = new WebSocket("ws://localhost:8080");

      ws.onopen = () => console.log("[WS] Conexão aberta");

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.tipo === "URL") {
          if (!msg.mensagem.includes("pesquisaIndividuo.do")) {
            clearTimeout(paginaTimerRef.current);
            setProntoParaPesquisa(false);
          }
        }

        if (msg.tipo === "LOG") {
          setMensagem(msg.mensagem && msg.mensagem.trim() ? msg.mensagem : "Aguarde...");

          if (msg.mensagem.includes("Página de Pesquisa de Indivíduo carregada")) {
            clearTimeout(paginaTimerRef.current);
            paginaTimerRef.current = setTimeout(() => {
              setProntoParaPesquisa(true);
              setMensagem("✅ Sistema pronto para pesquisa. Informe o RG para iniciar.");
            }, 1000); // 1 segundo
          }
        }

        if (msg.tipo === "ERRO") setMensagem("Erro: " + msg.mensagem);

        if (msg.tipo === "DADOS_INDIVIDUO") {
          setDados(msg.dados);
          setCarregando(false);
        }
      };

      ws.onclose = () => setTimeout(criarWebSocket, 3000);
      wsRef.current = ws;
      return ws;
    };

    criarWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(paginaTimerRef.current);
    };
  }, []);

  const handlePesquisar = async () => {
    const rgSomenteNumeros = rg.replace(/\D/g, "");

    if (!rg) {
      setMensagem("⚠️ Informe o RG antes de pesquisar.");
      return;
    }

    if (rg !== rgSomenteNumeros) {
      setMensagem("⚠️ RG inválido! Apenas números são permitidos.");
      return;
    }

    if (rg.length < 5 || rg.length > 9) {
      setMensagem("⚠️ RG inválido! O RG deve ter entre 5 e 9 dígitos.");
      return;
    }

    setMensagem("Pesquisando...");
    setDados(null);
    setCarregando(true);

    try {
      const resp = await fetch("http://localhost:3000/api/pesquisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rg })
      });
      const data = await resp.json();
      setMensagem(data.mensagem && data.mensagem.trim() ? data.mensagem : "Aguarde...");
      if (data.sucesso) setDados(data.dados || null);
      else setCarregando(false);
    } catch (err) {
      setMensagem("Erro na pesquisa: " + err.message);
      setCarregando(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      padding: 20,
      background: "#fff",
      overflowY: "auto",
      maxHeight: "100vh"
    }}>
      <h1>Pesquisa MAX</h1>

  <input
  type="text"
  placeholder="Digite o RG"
  value={rg}
  onChange={(e) => setRg(e.target.value)}
  className="rg-input"
  disabled={!prontoParaPesquisa}
/>
<button
  onClick={handlePesquisar}
  className="rg-button"
  disabled={!prontoParaPesquisa}
>
  Pesquisar
</button>

<style>{`
  /* Input de RG estilizado */
  .rg-input {
    padding: 10px 15px;
    font-size: 16px;
    border: 2px solid #ccc;
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    width: 150px;
    margin-right: 10px;
  }
  .rg-input:focus {
    border-color: #4CAF50;
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
  }
  .rg-input:disabled {
    background: #f0f0f0;
    cursor: not-allowed;
  }

  /* Botão estilizado */
  .rg-button {
    padding: 10px 20px;
    font-size: 16px;
    background-color: #4CAF50;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .rg-button:hover:not(:disabled) {
    background-color: #45a049;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  .rg-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`}</style>

     

      <p>{mensagem && mensagem.trim() ? mensagem : "Aguarde..."}</p>

      {carregando && (
        <div className="overlay">
          <div className="spinner">Pesquisando dados...</div>
        </div>
      )}

      {dados && <DadosIndividuo dados={dados} />}

      <style>{`
        .overlay {
          position: fixed;
          top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.4);
          display:flex;
          justify-content:center;
          align-items:center;
          z-index: 1000;
          font-size: 1.5em;
          color: white;
        }
        .painel-individuo {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          max-width: 500px;
          margin: 20px 0 150px 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .painel-individuo h2 {
          text-align: left;
          margin-bottom: 15px;
        }
        .painel-individuo .linha {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #eee;
        }
        .painel-individuo .linha span {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default App;
