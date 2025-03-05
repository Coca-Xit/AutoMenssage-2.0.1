# Discord Bot de Envio Automático de Mensagens

Este bot é uma solução para configurar o envio automático de mensagens em canais de servidores do Discord. Ele permite configurar mensagens programadas para serem enviadas em horários específicos, assim como editar ou enviar mensagens manualmente.

## Funcionalidades

- **Configuração de Mensagens Automáticas**: O bot permite cadastrar, editar e enviar mensagens programadas para canais específicos.
- **Integração com Selfbot**: O bot usa uma conta de selfbot para enviar as mensagens programadas.
- **Banco de Dados**: As configurações são armazenadas localmente em um arquivo `database.json`.
- **Comandos**:
  - `/configurar_mensagens`: Inicia o processo de configuração de mensagens automáticas, oferecendo opções para cadastrar, editar ou enviar mensagens.

## Como Funciona

1. **Cadastro de Mensagens**: Você pode cadastrar mensagens para um servidor e canal específicos, junto com o horário em que elas devem ser enviadas.
2. **Edição de Mensagens**: As mensagens cadastradas podem ser editadas a qualquer momento.
3. **Envio Instantâneo**: Você pode enviar uma mensagem manualmente para qualquer canal a qualquer momento.
4. **Envio Automático**: O bot verifica a cada minuto o banco de dados para encontrar mensagens programadas que correspondem ao horário atual. Se encontrar, o bot enviará a mensagem no canal especificado.

## Como Configurar

### Pré-requisitos

1. **Node.js**: Você precisa ter o Node.js instalado na sua máquina. Caso não tenha, baixe e instale [aqui](https://nodejs.org/).
2. **Dependências**: Este bot utiliza várias bibliotecas que podem ser instaladas via NPM.

### Passo 1: Clone o Repositório

Clone este repositório para sua máquina local.

```bash
git clone https://github.com/Coca-Xit/AutoMenssage-2.0.1.git
cd AutoMenssage-2.0.1

```
### Passo 2: Instale as Dependências
Instale as dependências necessárias usando o comando:

```
npm install
```

### Passo 3: Configure o .env
Edite o arquivo .env na pasta da aplicação:

```
SELFBOT_TOKEN=(discord token account)
DISCORD_TOKEN=(discord token bot)
CLIENT_ID=(bot id)
GUILD_ID=(your private server id)
```


### Passo 4: Executando o Bot
Execute o bot com o comando:
```
node index.js

```
## Comandos

O bot oferece o comando /configurar_mensagens para gerenciar o envio automático de mensagens. Ao invocar esse comando, o bot abrirá um menu de seleção com as seguintes opções:

1. **Cadastrar Mensagem**: Permite cadastrar uma nova mensagem, associando-a a um servidor, canal, mensagem e horário.
2. **Editar Mensagem**: Permite editar uma mensagem já cadastrada.

3. **Enviar Mensagem**: Permite enviar uma mensagem manualmente para um canal específico.


## Licença

Este projeto é licenciado sob a MIT License.
