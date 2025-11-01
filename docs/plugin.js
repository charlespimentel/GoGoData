/* Plugin CODAP GoGoBoard – Versão Definitiva (Coleta Acionada pelo Menu Suspenso) */

document.addEventListener("DOMContentLoaded", () => {
    // --- Configurações Iniciais ---
    const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
    const mqttBroker = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";
    const topic = "plog/gogodata/#";
    
    // CREDENCIAIS
    const mqttUsername = "admin";
    const mqttPassword = "@Gogoboard1";

    // --- Variáveis de Estado ---
    let client;
    let collecting = false; // Controla se a coleta para a placa SELECIONADA está ativa
    let selectedBoardForCollection = null; // A placa atualmente selecionada para enviar dados ao CODAP
    let codapConnected = false;
    let dataContextCreated = false; 
    let boards = new Set();
    let dataBuffer = {}; 
    let sendTimer = {}; 

    // --- Elementos DOM ---
    const statusEl = document.getElementById("status-message"); 
    const boardSelect = document.getElementById("boardSelect");
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const logOutputEl = document.getElementById("dadosEnviados"); 

    // --- Funções Auxiliares ---

    function updateStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
        console.log("[STATUS]", msg);
    }

    function updateBoardList(boardName) {
        if (boardName && boardName.startsWith("GoGo-") && !boards.has(boardName)) {
            boards.add(boardName);
            
            const option = document.createElement("option");
            option.value = boardName;
            option.textContent = boardName;
            
            boardSelect.appendChild(option); 
            
            console.log(`🧩 Nova GoGoBoard detectada e adicionada: ${boardName}. Total: ${boards.size} placas.`);
        }
    }


    function logData(data) {
        if (!logOutputEl) return;

        const entry = document.createElement("div");
        entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ${Object.entries(data)
            .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
            .filter(Boolean)
            .join(", ")}`;

        if (logOutputEl.children.length > 0 && logOutputEl.children[0].tagName === 'B') {
            logOutputEl.insertBefore(entry, logOutputEl.children[1]);
        } else {
            logOutputEl.prepend(entry);
        }

        let childCount = logOutputEl.children.length;
        if (logOutputEl.querySelector('b')) {
            childCount--;
        }

        while (childCount > 20) {
            logOutputEl.removeChild(logOutputEl.lastChild);
            childCount--;
        }
    }

    // --- Funções de Comunicação CODAP (Inalteradas) ---

    function sendCaseToCODAP(data) {
        if (codapConnected && dataContextCreated) {
            codapInterface.sendRequest({
                action: "create",
                resource: "dataContext[GoGoBoard].item",
                values: [data]
            });
        }
    }

    function sendToCODAP(data) {
        try {
            if (!codapConnected && typeof codapInterface !== "undefined") {
                codapInterface.init({
                    name: "Dados GoGoBoard",
                    title: "GoGoBoard Data",
                    dimensions: { width: 400, height: 300 },
                    version: "2.0"
                });
                codapConnected = true;
                console.log("✨ Tentando conectar ao CODAP.");
            }

            if (codapConnected && !dataContextCreated) {
                const attributeNames = Object.keys(data).filter(key => key !== 'timestamp' && key !== 'board');

                const attributes = [
                    { name: 'timestamp', title: 'Carimbo de Tempo', type: 'date' },
                    { name: 'board', title: 'Placa', type: 'categorical' },
                    ...attributeNames.map(name => ({ 
                        name: name, 
                        title: name.charAt(0).toUpperCase() + name.slice(1), 
                        type: 'numeric' 
                    }))
                ];

                codapInterface.sendRequest({
                    action: "create",
                    resource: "dataContext",
                    values: {
                        name: "GoGoBoard",
                        collections: [{
                            name: "Dados Sensores",
                            attrs: attributes
                        }]
                    }
                }).then(result => {
                    if (result.success) {
                        dataContextCreated = true;
                        console.log("✔️ Data Context 'GoGoBoard' criado no CODAP.");
                        sendCaseToCODAP(data);
                    } else {
                        console.warn("⚠️ Data Context não criado (possivelmente já existe). Tentando enviar o caso.");
                        dataContextCreated = true;
                        sendCaseToCODAP(data); 
                    }
                });
            } else if (dataContextCreated) {
                sendCaseToCODAP(data);
            }

        } catch (e) {
            console.warn("⚠️ Erro ao interagir com o CODAP (Verifique se o plugin está embutido).", e);
        }
    }

    // --- Comunicação MQTT ---

    function connectMQTT() {
        client = mqtt.connect(mqttBroker, { 
            clientId: clientId,
            username: mqttUsername, 
            password: mqttPassword  
        });
        updateStatus("Conectando ao broker privado...");

        client.on("connect", () => {
            console.log("✅ Conectado ao broker HiveMQ Cloud");
            updateStatus("Conectado. Escolha uma placa para coletar dados.");
            client.subscribe(topic);
        });

        client.on("message", (topic, message) => {
            const payload = message.toString().trim();

            const parts = topic.split("/");
            const boardName = parts[2];
            const sensorName = parts[3];

            // 1. A ÚNICA FUNÇÃO IMEDIATA: IDENTIFICAR E ADICIONAR A PLACA
            if (boardName && boardName.startsWith("GoGo-")) {
                updateBoardList(boardName); 
            }
            
            // Verifica se a extração do nome da placa e do sensor foi bem-sucedida
            if (!boardName || !sensorName || !boardName.startsWith("GoGo-")) {
                return;
            }
            
            // 2. EXTRAÇÃO DE VALOR E FILTRAGEM DE COLETAS
            
            // Se não estiver coletando, ou a placa não for a selecionada, apenas processamos a detecção e saímos.
            if (!collecting || boardName !== selectedBoardForCollection) return; 

            const valueMatch = payload.match(/=([\d.]+)/);
            const value = valueMatch ? parseFloat(valueMatch[1]) : null;
            if (value === null) return;

            // 3. Armazena o valor no buffer da placa ATIVA
            if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
            dataBuffer[boardName][sensorName] = value;

            // 4. Lógica de Agrupamento com Timer (Para enviar um caso completo da placa selecionada)
            if (sendTimer[boardName]) {
                clearTimeout(sendTimer[boardName]);
            }

            sendTimer[boardName] = setTimeout(() => {
                const caseObj = {
                    timestamp: new Date().toISOString(),
                    board: boardName,
                    ...dataBuffer[boardName]
                };

                sendToCODAP(caseObj);
                logData(caseObj);
                updateStatus(`Coleta ativa: ${selectedBoardForCollection}...`);

                delete dataBuffer[boardName];
                delete sendTimer[boardName];

            }, 50);

        });

        client.on("error", (err) => {
            console.error("❌ Erro MQTT:", err);
            updateStatus("Erro na conexão MQTT. Verifique as credenciais ou o endereço."); 
        });

        client.on("close", () => {
            updateStatus("Desconectado do broker");
        });
    }

    // --- Event Listeners e Inicialização ---

    // 🎯 NOVO TRIGGER: MUDANÇA NO MENU SUSPENSO
    boardSelect.addEventListener("change", () => {
        const newSelection = boardSelect.value;
        
        if (newSelection === "" || newSelection === "Todas") {
            // Se 'Todas' ou vazio, para a coleta
            collecting = false;
            selectedBoardForCollection = null;
            updateStatus("Escolha uma placa específica para iniciar a coleta.");
        } else {
            // Se uma placa específica for escolhida, define-a como alvo
            selectedBoardForCollection = newSelection;
            
            // Inicia a coleta
            collecting = true;
            updateStatus(`Coleta da placa ${selectedBoardForCollection} iniciada.`);
            console.log(`▶️ Coleta iniciada para a placa: ${selectedBoardForCollection}`);
        }
    });

    // BOTÕES: AGORA SERVEM APENAS PARA PAUSAR/REINICIAR A PLACA JÁ SELECIONADA
    startBtn.addEventListener("click", () => {
        if (!selectedBoardForCollection) {
            updateStatus("ERRO: Selecione uma placa no menu suspenso primeiro.");
            return;
        }
        collecting = true;
        updateStatus(`Coleta REINICIADA: ${selectedBoardForCollection}.`);
        console.log(`▶️ Coleta reiniciada para a placa: ${selectedBoardForCollection}`);
    });

    stopBtn.addEventListener("click", () => {
        if (!selectedBoardForCollection) {
            updateStatus("Coleta pausada (Nenhuma placa selecionada).");
            return;
        }
        collecting = false;
        updateStatus(`Coleta PAUSADA: ${selectedBoardForCollection}.`);
        console.log(`⏹️ Coleta pausada para a placa: ${selectedBoardForCollection}`);
    });

    // Inicialização
    connectMQTT();
    updateStatus("Aguardando conexão...");
});
