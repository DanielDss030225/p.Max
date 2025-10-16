import { useState, useEffect, useRef } from "react";
const API_URL = "https://p-max.onrender.com";

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
  //const wsRef = useRef(null);
  //const paginaTimerRef = useRef(null);

  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [senha, setSenha] = useState(localStorage.getItem("senha") || "");
  const [logado, setLogado] = useState(!!(localStorage.getItem("usuario") && localStorage.getItem("senha")));
  const [erroLogin, setErroLogin] = useState("");
  const [appKey, setAppKey] = useState(0); // Força re-render após login/logout

  // Inicialização do WebSocket e fetch
useEffect(() => {
  if (!logado) return;

  fetch(`${API_URL}/api/init`, {
    headers: {
      "x-usuario": localStorage.getItem("usuario"),
      "x-senha": localStorage.getItem("senha")
    }
  })
    .then(res => res.json())
    .then(data => {
      setMensagem(data.mensagem);
      if (data.sucesso) setProntoParaPesquisa(true); // ⚡ importante
    })
    .catch(err => setMensagem("Erro ao inicializar sessão: " + err.message));
}, [logado]);

const handleLogout = () => {
  localStorage.removeItem("usuario");
  localStorage.removeItem("senha");

  setDados(null);
  setMensagem("Você saiu do sistema.");
  setProntoParaPesquisa(false);
  setRg("");

  setUsuario("");
  setSenha("");
  setLogado(false);

  setAppKey(prev => prev + 1); // força re-render
};


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
    const resp = await fetch(`${API_URL}/api/pesquisar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rg })
    });

    const data = await resp.json();
    setMensagem(data.mensagem?.trim() || "Aguarde...");

    if (data.sucesso) {
      setDados(data.dados || null);
    }
  } catch (err) {
    setMensagem("Erro na pesquisa: " + err.message);
  } finally {
    setCarregando(false); // garante que sempre para o carregamento
  }
};

  // Se não logado, renderiza a tela de login
  if (!logado) {
    return (
      <div className="login-container" key={appKey}>
        <h1>Dados</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!usuario.trim() || !senha.trim()) {
            setErroLogin("Preencha todos os campos.");
            return;
          }
          localStorage.setItem("usuario", usuario);
          localStorage.setItem("senha", senha);
          setLogado(true);
          setAppKey(prev => prev + 1); // força re-render
        }}>
          <input
            type="text"
            placeholder="Usuário do Reds"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha do Reds"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button type="submit">Entrar</button>
        </form>
        {erroLogin && <p className="erro">{erroLogin}</p>}

        <style>{`
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f0f0f0;
  gap: 10px; /* espaço entre os elementos */
  padding-right: 100px;
  padding-left: 100px;
}

.login-container form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px; /* espaço entre inputs e botão */
}

.login-container input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 220px;
  font-size: 16px;
}

.login-container button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.erro {
  color: red;
  margin-top: 5px;
}
      
        `}</style>
      </div>
    );
  }

  // Tela principal
  return (
    <div key={appKey} style={{
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
<div id="DivUserName"> 
                <span id="usuarioName"> <strong>{usuario}</strong></span>

<button
    onClick={handleLogout}
    className="logout-button"
  >
    Trocar Usuário
  </button>
</div>
   <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
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
  
</div>

<style>{`
#DivUserName {
margin-bottom: 15px;
    
}
#usuarioName {
margin-right:10px;
 padding: 10px 15px;
    font-size: 16px;
    border: 2px solid #ccc;
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    width: 150px; 
}
  .rg-input {
    padding: 10px 15px;
    font-size: 16px;
    border: 2px solid #ccc;
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    width: 150px;
  }
  .rg-input:focus {
    border-color: #4CAF50;
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
  }
  .rg-input:disabled {
    background: #f0f0f0;
    cursor: not-allowed;
  }

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

  /* Estilo do botão Logout */
  /* Estilo do botão Logout */
.logout-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #e0e0e0; /* cinza bem claro */
  color: #000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.logout-button:hover,
.logout-button:focus {
  background-color: #bdbdbd; /* cinza mais escuro ao foco/hover */
  outline: none;
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
