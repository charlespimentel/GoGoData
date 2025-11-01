/* Plugin CODAP GoGoBoard – versão final (Correção de exibição da placa no menu suspenso) */

document.addEventListener("DOMContentLoaded", () => {
    // --- Configurações Iniciais ---
    const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
    const mqttBroker = "wss://broker.hivemq.com:8884/mqtt";
    const topic = "plog/gogodata/#";

    // --- Variáveis de Estado ---
    let client;
    let collecting = false;
    let codapConnected = false;
    let dataContextCreated = false; 
    let boards = new Set();
    let dataBuffer = {}; 
    let sendTimer = {}; 

    // --- Elementos DOM ---
    // ATENÇÃO: Verifique se estes IDs estão corretos no seu HTML (status-message foi adicionado no HTML ajustado)
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
    
    // FUNÇÃO CORRIGIDA
    function updateBoardList(boardName) {
        if (!boards.has(boardName)) {
            boards.add(boardName);
            const option = document.createElement("option");
            option.value = boardName;
            option.textContent = boardName;
            
            // Adiciona a nova opção APÓS a primeira opção ("Todas")
            // Como "Todas" é a primeira, podemos inseri-la após o primeiro filho
            if (boardSelect.children.length > 0) {
                boardSelect.insertBefore(option, boardSelect.children[1]);
            } else {
                boardSelect.appendChild(option); // Fallback, mas não deve ocorrer se o HTML estiver certo
            }

            console.log("🧩 Nova GoGoBoard detectada:", boardName);
        }
    }


    function logData(data) {
        if (!logOutputEl) return;

        const entry = document.createElement("div");
        entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ${Object.entries(data)
            .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
            .filter(Boolean)
            .join(", ")}`;

        // Adiciona no topo do log (após a tag <b>)
        if (logOutputEl.children.length > 0 && logOutputEl.children[0].tagName === 'B') {
            logOutputEl.insertBefore(entry, logOutputEl.children[1]);
        } else {
            logOutputEl.prepend(entry);
        }

        // Limita o número de entradas no log
        let childCount = logOutputEl.children.length;
        if (logOutputEl.querySelector('b')) {
            childCount--;
        }

        while (childCount > 20) {
            logOutputEl.removeChild(logOutputEl.lastChild);
            childCount--;
        }
    }

    // --- Funções de Comunicação CODAP (Mantidas do ajuste anterior) ---

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
        client = mqtt.connect(mqttBroker, { clientId });
        updateStatus("Conectando ao broker...");

        client.on("connect", () => {
            console.log("✅ Conectado ao broker HiveMQ");
            updateStatus("Conectado. Aguardando dados...");
            client.subscribe(topic);
        });

        client.on("message", (topic, message) => {
            const payload = message.toString().trim();

            const parts = topic.split("/");
            const boardName = parts[2];
            const sensorName = parts[3];

            // 1. Verifica e Adiciona Placa (Mesmo que a coleta esteja parada)
            if (!boardName || !sensorName || !boardName.startsWith("GoGo-")) return;
            updateBoardList(boardName);

            // 2. Extrai o valor
            const valueMatch = payload.match(/=([\d.]+)/);
            const value = valueMatch ? parseFloat(valueMatch[1]) : null;
            if (value === null) return;

            // 3. Verifica o estado de coleta
            if (!collecting) return;

            // 4. Filtra pela placa selecionada
            const selectedBoard = boardSelect.value;
            if (selectedBoard !== "" && selectedBoard !== "Todas" && boardName !== selectedBoard) return;

            // 5. Armazena o valor no buffer
            if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
            dataBuffer[boardName][sensorName] = value;

            // 6. Lógica de Agrupamento com Timer
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
                updateStatus("Coleta ativa...");

                delete dataBuffer[boardName];
                delete sendTimer[boardName];

            }, 50);

        });

        client.on("error", (err) => {
            console.error("❌ Erro MQTT:", err);
            updateStatus("Erro na conexão MQTT");
        });

        client.on("close", () => {
            updateStatus("Desconectado do broker");
        });
    }

    // --- Event Listeners e Inicialização ---

    startBtn.addEventListener("click", () => {
        collecting = true;
        updateStatus("Coleta iniciada...");
        console.log("▶️ Coleta iniciada");
    });

    stopBtn.addEventListener("click", () => {
        collecting = false;
        updateStatus("Coleta pausada.");
        console.log("⏹️ Coleta pausada");
    });

    // Inicialização
    connectMQTT();
    updateStatus("Aguardando conexão...");
});
