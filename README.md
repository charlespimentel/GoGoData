# GoGoData

Repositório para armazenamento do código-fonte e documentação do projeto **GoGoData**, um plugin que integra a placa GoGoBoard ao ambiente CODAP (Common Online Data Analysis Platform) utilizando o protocolo MQTT para transporte de dados em tempo real.

## Visão geral

O plugin é executado dentro de um iframe no CODAP e se conecta a um broker MQTT (HiveMQ Cloud por padrão) via WebSocket seguro (WSS). As mensagens recebidas são parseadas, convertidas em casos e enviadas para um *dataContext* no CODAP, permitindo visualização em tabelas e gráficos. Uma fila interna garante que os dados recebidos antes da inicialização do CODAP sejam preservados, e diferentes formatos de payload (CSV ou JSON) podem ser tratados conforme configurado no firmware da GoGoBoard.

## Principais recursos

- Conexão MQTT com reconexão automática, indicador visual de status e log dos últimos dados recebidos.
- Inicialização resiliente do CODAP com fila de mensagens para evitar perda de dados durante o carregamento.
- Dataset `GoGoBoardData` pré-configurado com atributos `timestamp`, `board`, `sensor` e `value` para organizar leituras de sensores.
- Botão de teste que publica cinco leituras fictícias para validar a comunicação entre plugin, MQTT e CODAP.

## Estrutura do repositório

- `V2.0 (Final)/`: versão estável do plugin com `index.html`, `plugin.js` e dependências locais (`codap-plugin-api.js`, `iframe-phone.js`).
- `código base/`: protótipo inicial com scripts e HTML de integração via porta serial.
- `Documentação/`: documentação funcional e administrativa do plugin GoGoData.
- `Https/`: materiais de apoio para configuração de certificado HTTPS local com mkcert.
- Diretórios `V1.x/`: iterações anteriores mantidas para referência histórica.

## Pré-requisitos

1. **Servidor HTTPS local**: utilize a extensão Live Server (VS Code) configurada com certificados gerados via [mkcert](https://github.com/FiloSottile/mkcert).
2. **Certificados**: crie arquivos `localhost.pem` e `localhost-key.pem` e associe-os nas preferências do Live Server para servir `index.html` em `https://localhost:<porta>`.
3. **Acesso ao broker MQTT**: credenciais de usuário e senha válidas para o broker configurado (HiveMQ Cloud por padrão).

## Executando o plugin localmente

1. Clone este repositório e abra a pasta `V2.0 (Final)` no Visual Studio Code.
2. Configure o Live Server para HTTPS apontando para os certificados gerados (veja seção anterior).
3. Abra o arquivo `index.html` e inicie o Live Server. O navegador abrirá a interface do plugin em `https://localhost:5500` (ou porta equivalente).
4. No CODAP, importe o plugin usando o URL HTTPS servido localmente.
5. Verifique o indicador de status na interface. Ao receber dados válidos do broker, o indicador ficará verde e o log exibirá as leituras recebidas.

## Configuração do MQTT

Os parâmetros de conexão podem ser ajustados no arquivo `V2.0 (Final)/plugin.js`:

```javascript
const brokerUrl = "wss://38543d8f57c14b2f8ef0c5c4e3130977.s1.eu.hivemq.cloud:8884/mqtt";
const options = {
  username: "admin",
  password: "Gogoboard!1",
  clean: true,
  connectTimeout: 2000,
  reconnectPeriod: 1000
};
```

- **Broker**: substitua `brokerUrl` por outro endpoint WSS caso utilize um broker diferente.
- **Credenciais**: atualize `username` e `password` conforme as credenciais da instância MQTT.
- **Tópicos**: por padrão o plugin se inscreve em `plog/#`. Ajuste `client.subscribe()` para restringir tópicos específicos.

## Formato das mensagens

- **Tópico**: `plog/<nome-da-gogo>/<sensor>`
- **Payload**: string contendo `sensor=valor` (ex.: `canal luz=846.00`).
- O plugin converte cada mensagem em um objeto `{ timestamp, board, sensor, value }` e envia ao CODAP. Ajustes adicionais podem ser feitos em `client.on("message", ...)` caso o firmware utilize outro formato (CSV ou JSON, por exemplo).

## Integração com o CODAP

1. Aguardar a detecção automática da API `codapInterface`. O plugin tentará novamente a cada 5 segundos até a conexão ser estabelecida.
2. Após a conexão, o plugin cria o *dataContext* `GoGoBoardData` com a coleção `leituras` e atributos necessários.
3. Caso o CODAP ainda não esteja pronto, as mensagens ficam armazenadas em `codapSendQueue` e são reenviadas ao CODAP quando a conexão for concluída.

## Testes com dados fictícios

- Utilize o botão **🧪 Enviar Dados** para gerar cinco leituras simuladas em intervalos de 2 segundos.
- As leituras aparecem no log da interface e são enviadas ao CODAP, permitindo validar a configuração sem depender do hardware.

## Documentação adicional

Consulte a pasta `Documentação/` para detalhes do fluxo de desenvolvimento, ajustes administrativos do plugin e orientações para manutenção do broker MQTT e do firmware da GoGoBoard.
