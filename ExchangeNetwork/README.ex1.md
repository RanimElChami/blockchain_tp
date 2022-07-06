### Génération de la PKI (public key infrastructure) du réseau Exchange Network

Pour créer le réseau HLF v2 que nous allons utiliser le long de cette formation, nous avons besoins de générer le
matériel cryptographique necessaire pour sécuriser le réseau et authentifier les transactions.

Pour cette génération, nous allons utiliser un script shell. Dans une console shell, éxecutez les
commandes qui suivent :

```
$ cd $FLAB/ExchangeNetwork/CCLifeCycleHLFv2
$ ./exntw.sh -m gen_pki
bank1.banksco.com
bank2.banksco.com
```

Une fois la PKI générée, le matériel cryptographique du MSP (membership service provider) est stocké dans le répertoire
`crypto-config`. Pour en savoir plus sur la facon dont est généré ce matériel, n'hésitez pas à lire le script `exntw.sh`.

**NOTE 1 :** nous utilisons l'image `hyperledger/fabric-tools:2.2.0` afin de ne pas à avoir à compiler les outils
cryptogen et configtxgen.

### Generation du genesis block et des transactions d'initialisation du réseau Exchange Network

Une fois la PKI du réseau générée nous pouvons initialiser la blockchain du reseau Exchange Network. Executez la commande
suivante dans un terminal :

```
$ ./exntw.sh -m gen_cha
2020-04-29 15:32:47.197 UTC [common.tools.configtxgen] main -> INFO 001 Loading configuration
2020-04-29 15:32:47.387 UTC [common.tools.configtxgen.localconfig] completeInitialization -> INFO 002 orderer type: solo
2020-04-29 15:32:47.387 UTC [common.tools.configtxgen.localconfig] Load -> INFO 003 Loaded configuration: /exchntw/configtx.yaml
2020-04-29 15:32:47.820 UTC [common.tools.configtxgen] doOutputBlock -> INFO 004 Generating genesis block
2020-04-29 15:32:47.823 UTC [common.tools.configtxgen] doOutputBlock -> INFO 005 Writing genesis block
2020-04-29 15:32:50.430 UTC [common.tools.configtxgen] main -> INFO 001 Loading configuration
2020-04-29 15:32:50.519 UTC [common.tools.configtxgen.localconfig] Load -> INFO 002 Loaded configuration: /exchntw/configtx.yaml
2020-04-29 15:32:50.519 UTC [common.tools.configtxgen] doOutputChannelCreateTx -> INFO 003 Generating new channel configtx
2020-04-29 15:32:51.027 UTC [common.tools.configtxgen] doOutputChannelCreateTx -> INFO 004 Writing new channel tx
2020-04-29 15:32:52.688 UTC [common.tools.configtxgen] main -> INFO 001 Loading configuration
2020-04-29 15:32:52.960 UTC [common.tools.configtxgen.localconfig] Load -> INFO 002 Loaded configuration: /exchntw/configtx.yaml
2020-04-29 15:32:52.960 UTC [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 003 Generating anchor peer update
2020-04-29 15:32:53.318 UTC [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 004 Writing anchor peer update
2020-04-29 15:32:55.123 UTC [common.tools.configtxgen] main -> INFO 001 Loading configuration
2020-04-29 15:32:55.327 UTC [common.tools.configtxgen.localconfig] Load -> INFO 002 Loaded configuration: /exchntw/configtx.yaml
2020-04-29 15:32:55.327 UTC [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 003 Generating anchor peer update
2020-04-29 15:32:55.780 UTC [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 004 Writing anchor peer update
```

Après l'execution de cette commande, le genesis block et les transactions d'initialisations sont stockés dans le repertoire
`channel-artifacts`. Pour en savoir plus, n'hésitez pas à lire le script `exntw.sh`.

**NOTE :** nous avons défini les capabilities qui vont nous permettre d'utiliser le lifecycle chaincode HLFv2 :

- Channel : 2_0
- Orderer : 2_0
- Application : 2_0

### Démarrage et interconnection entre les composants HLF

Dans votre terminal, lancer les commandes suivantes :

```
$ docker-compose -f docker-compose-cli.yaml up -d
```

Puis vérifiez votre infrastructure :

```
$ docker ps -a
CONTAINER ID        IMAGE                                    COMMAND             CREATED             STATUS              PORTS                                            NAMES
562ff3cdd42e        hyperledger/fabric-tools:2.2.0     "/bin/sh"           2 minutes ago       Up About a minute                                                    cliBank1
c3ec8f7b2bb4        hyperledger/fabric-tools:2.2.0     "/bin/sh"           2 minutes ago       Up About a minute                                                    cliBank2
7e18233e8bd2        hyperledger/fabric-peer:2.2.0      "peer node start"   2 minutes ago       Up 2 minutes        0.0.0.0:7056->7051/tcp, 0.0.0.0:7058->7053/tcp   peer1.bank1.banksco.com
a85820851b48        hyperledger/fabric-peer:2.2.0      "peer node start"   2 minutes ago       Up 2 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.bank1.banksco.com
8c1dee0c1f78        hyperledger/fabric-peer:2.2.0      "peer node start"   2 minutes ago       Up 2 minutes        0.0.0.0:8051->7051/tcp, 0.0.0.0:8053->7053/tcp   peer0.bank2.banksco.com
b648627fe3e7        hyperledger/fabric-peer:2.2.0      "peer node start"   2 minutes ago       Up 2 minutes        0.0.0.0:8056->7051/tcp, 0.0.0.0:8058->7053/tcp   peer1.bank2.banksco.com
a1315b921ef3        hyperledger/fabric-orderer:2.2.0   "orderer"           2 minutes ago       Up 2 minutes        0.0.0.0:7050->7050/tcp                           orderer.banksco.com
```

#### Création du channel

D'abord nous devons nous 'connecter' à l'un des container client.

De ces containers clients, nous utilisons le binaire HLF peer qui sert à la fois pour le service peer daemon
(démarré pour les instances `peerX.bankY.banksco.com`) et pour être utilisé comme d'un client GRPC HLF.

Notez que ce client utilise les variables d'environnement des containers clients afin de nous faciliter la vie.

Pour le container cliBank1 :

```
      - CORE_PEER_ID=cliBank1
      - CORE_PEER_ADDRESS=peer0.bank1.banksco.com:7051
      - CORE_PEER_LOCALMSPID=Bank1MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer0.bank1.banksco.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer0.bank1.banksco.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer0.bank1.banksco.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/users/Admin@bank1.banksco.com/msp
      - CHANNEL_NAME=bankscochannel
      - ORDERER_TLS_CA=/opt/exchangentw/crypto/ordererOrganizations/banksco.com/orderers/orderer.banksco.com/msp/tlscacerts/tlsca.banksco.com-cert.pem
      - PEER0_BANK1_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer0.bank1.banksco.com/tls/ca.crt
      - PEER0_BANK1_PRADDR=peer0.bank1.banksco.com:7051
      - PEER1_BANK1_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer1.bank1.banksco.com/tls/ca.crt
      - PEER1_BANK1_PRADDR=peer1.bank1.banksco.com:7051
      - PEER0_BANK2_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer0.bank2.banksco.com/tls/ca.crt
      - PEER0_BANK2_PRADDR=peer0.bank2.banksco.com:7051
      - PEER1_BANK2_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer1.bank2.banksco.com/tls/ca.crt
      - PEER1_BANK2_PRADDR=peer1.bank2.banksco.com:7051
```

Pour le container cliBank2 :

```
      - CORE_PEER_ID=cliBank2
      - CORE_PEER_ADDRESS=peer0.bank2.banksco.com:7051
      - CORE_PEER_LOCALMSPID=Bank2MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer0.bank2.banksco.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer0.bank2.banksco.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer0.bank2.banksco.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/users/Admin@bank2.banksco.com/msp
      - CHANNEL_NAME=bankscochannel
      - ORDERER_TLS_CA=/opt/exchangentw/crypto/ordererOrganizations/banksco.com/orderers/orderer.banksco.com/msp/tlscacerts/tlsca.banksco.com-cert.pem
      - PEER0_BANK2_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer0.bank2.banksco.com/tls/ca.crt
      - PEER0_BANK2_PRADDR=peer0.bank2.banksco.com:7051
      - PEER1_BANK2_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank2.banksco.com/peers/peer1.bank2.banksco.com/tls/ca.crt
      - PEER1_BANK2_PRADDR=peer1.bank2.banksco.com:7051
      - PEER0_BANK1_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer0.bank1.banksco.com/tls/ca.crt
      - PEER0_BANK1_PRADDR=peer0.bank1.banksco.com:7051
      - PEER1_BANK1_TLS_CA=/opt/exchangentw/crypto/peerOrganizations/bank1.banksco.com/peers/peer1.bank1.banksco.com/tls/ca.crt
      - PEER1_BANK1_PRADDR=peer1.bank1.banksco.com:7051
```

Nous allons commencer par le client `cliBank1`

```
$ docker exec -it cliBank1 sh
```

Une fois connecté à ce container, nous pouvons lancer la commande pour créer le channel HLF `bankscochannel`.

```
# peer channel create -o orderer.banksco.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls true --cafile $ORDERER_TLS_CA
2020-04-29 15:36:57.532 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:36:57.819 UTC [cli.common] readBlock -> INFO 002 Received block: 0
```

**NOTE:** vous pouvez suivre le comportement de cette commande via les logs du container orderer : `docker logs -f orderer.banksco.com`

#### Connection des peers sur le channel (JOIN)

Une fois le channel HLF créé, nous allons connecter les peers de l'organisation `Bank1` au channel `bankscochannel`.
Nous restons donc 'connecté' au client de l'organisation `Bank1`.

Commencons par connecter le peer `peer0.bank1` au channel :

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK1_TLS_CA   # NOTE: nous definissons ici le CA X509 qui trust peer0.bank1
# export CORE_PEER_ADDRESS=$PEER0_BANK1_PRADDR             # NOTE: nous definissons ici l'adresse du peer cible de nos requetes
# peer channel join -b bankscochannel.block
2020-04-29 15:37:22.382 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:37:22.575 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
```

**NOTE:** depuis la VM et sur une autre console, vous pouvez vérifier la connection au peer0.bank1 vers le channel porté par l'orderer en regardant les logs du peer :

```
$ docker logs -f peer0.bank1.banksco.com
2020-04-29 15:37:22.397 UTC [ledgermgmt] CreateLedger -> INFO 021 Creating ledger [bankscochannel] with genesis block
2020-04-29 15:37:22.399 UTC [fsblkstorage] newBlockfileMgr -> INFO 022 Getting block information from block storage
2020-04-29 15:37:22.421 UTC [kvledger] CommitLegacy -> INFO 023 [bankscochannel] Committed block [0] with 1 transaction(s) in 16ms (state_validation=2ms block_and_pvtdata_commit=7ms state_commit=1ms) commitHash=[]
2020-04-29 15:37:22.424 UTC [ledgermgmt] CreateLedger -> INFO 024 Created ledger [bankscochannel] with genesis block
2020-04-29 15:37:22.432 UTC [gossip.gossip] JoinChan -> INFO 025 Joining gossip network of channel bankscochannel with 2 organizations
2020-04-29 15:37:22.432 UTC [gossip.gossip] learnAnchorPeers -> INFO 026 No configured anchor peers of Bank2MSP for channel bankscochannel to learn about
2020-04-29 15:37:22.432 UTC [gossip.gossip] learnAnchorPeers -> INFO 027 No configured anchor peers of Bank1MSP for channel bankscochannel to learn about
2020-04-29 15:37:22.573 UTC [gossip.state] NewGossipStateProvider -> INFO 028 Updating metadata information for channel bankscochannel, current ledger sequence is at = 0, next expected block is = 1
2020-04-29 15:37:22.574 UTC [endorser] callChaincode -> INFO 029 finished chaincode: cscc duration: 187ms channel= txID=f36a6590
2020-04-29 15:37:22.574 UTC [comm.grpc.server] 1 -> INFO 02a unary call completed grpc.service=protos.Endorser grpc.method=ProcessProposal grpc.peer_address=192.168.208.8:38908 grpc.code=OK grpc.call_duration=190.4225ms
2020-04-29 15:37:28.577 UTC [gossip.election] beLeader -> INFO 02b fa361885a1236562a4cfb5787259e4b49d03dba601c51424ffd0f6703b56a596 : Becoming a leader
2020-04-29 15:37:28.577 UTC [gossip.service] func1 -> INFO 02c Elected as a leader, starting delivery service for channel bankscochannel
2020-04-29 15:37:28.577 UTC [deliveryClient] StartDeliverForChannel -> INFO 02d This peer will retrieve blocks from ordering service and disseminate to other peers in the organization for channel bankscochannel
```

Puis nous continuons avec le peer `peer1.bank1` :

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_BANK1_TLS_CA
# export CORE_PEER_ADDRESS=$PEER1_BANK1_PRADDR
# peer channel join -b bankscochannel.block
2020-04-29 15:40:49.278 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:40:49.565 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
```

Nous allons maintenant connecter les peers de l'organisation `Bank2` au channel `bankscochannel`.
Pour se faire nous nous 'deconnectons' du client de l'organisation `Bank1` et nous nous 'connectons' sur le client de l'organisation `Bank2`:

```
# exit
$ docker exec -it cliBank2 sh
```

A la différence de l'organisation `Bank1` ou nous avons utilisé le client pour créer le channel, sur le client de l'organisation `Bank2` nous allons 'fetch' le channel pour récupérer le `genesis.block` qui va nous permettre de connecter les peers au channel :

```
# peer channel fetch newest $CHANNEL_NAME.block -o orderer.banksco.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_TLS_CA
2020-04-29 15:41:35.173 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:41:35.177 UTC [cli.common] readBlock -> INFO 002 Received block: 0
```

Nous pouvons ensuite rejouer les opérations pour les peer de l'organisation `Bank2`. Commencons par le peer `peer0.bank2` :

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER0_BANK2_PRADDR
# peer channel join -b bankscochannel.block
2020-04-29 15:42:01.706 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:42:01.850 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
```

Puis continuons avec le peer `peer1.bank2` et deconnectons nous :

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER1_BANK2_PRADDR
# peer channel join -b bankscochannel.block
2020-04-29 15:42:26.677 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:42:26.893 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
# exit
```

### Mise à jours du channel avec la définition des peers ancre

Les peers ancres sont utilisés comme points de référence pour le protocole de découverte des peers entre les organisations.  
Pour en savoir plus : https://hyperledger-fabric.readthedocs.io/en/release-1.1/glossary.html#anchor-peer

```
$ docker exec -it cliBank1 sh
# peer channel update -o orderer.banksco.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Bank1MSPanchors.tx --tls --cafile $ORDERER_TLS_CA
2020-04-29 15:42:58.972 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:42:59.164 UTC [channelCmd] update -> INFO 002 Successfully submitted channel update
# exit

$ docker exec -it cliBank2 sh
# peer channel update -o orderer.banksco.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Bank2MSPanchors.tx --tls --cafile $ORDERER_TLS_CA
2020-04-29 15:43:20.081 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-04-29 15:43:20.277 UTC [channelCmd] update -> INFO 002 Successfully submitted channel update
# exit
```

### Installation et instantiation de la chaincode compatible lifecyle HLF V2

#### Vendoring des librairies de la chaincode

Depuis HLFv2, les dépendances stub des chaincodes GoLang ne sont plus fournies dans l'image de build des chaincodes (`build-ccenv`).
Nous devons donc les intégrer nous même dans le packaging de la chaincode.

```
$ cd $FLAB/ExchangeCC/v2.0/src/github.com/exchangeCC
$ go mod vendor -v
$ cd -
```

#### Packaging et installation

Nous pouvons à présent déployer la chaincode sur le réseau constitué des peers suivants :

- `peer0.bank1`
- `peer0.bank2`
- `peer1.bank2`

Commencons par l'installation de la chaincode sur `peer0.bank1`:

```
$ docker exec -it cliBank1 sh
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK1_TLS_CA
# export CORE_PEER_ADDRESS=$PEER0_BANK1_PRADDR
# peer lifecycle chaincode package exchangeCC.tgz --lang golang -p github.com/exchangeCC --label exchangeCCv2
# peer lifecycle chaincode install exchangeCC.tgz
## you may have following error. In such case retry the command...
Error: failed to endorse chaincode install: rpc error: code = Unavailable desc = transport is closing
# peer lifecycle chaincode install exchangeCC.tgz
2020-04-29 17:23:40.776 UTC [cli.lifecycle.chaincode] submitInstallProposal -> INFO 001 Installed remotely: response:<status:200 payload:"\nMexchangeCCv2:915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62\022\014exchangeCCv2" >
2020-04-29 17:23:40.777 UTC [cli.lifecycle.chaincode] submitInstallProposal -> INFO 002 Chaincode code package identifier: exchangeCCv2:915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62
# exit
```

Vérifions maintenant que la chaincode a bien été installée :

```
$ docker exec -ti peer0.bank1.banksco.com /bin/sh
# ls /var/hyperledger/production/lifecycle/chaincodes/
exchangeCCv2.915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62.tar.gz
```

Installons maintenant sur sur `peer0.bank2`. Dans une autre console :

```
$ docker exec -it cliBank2 sh
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER0_BANK2_PRADDR
# peer lifecycle chaincode package exchangeCC.tgz --lang golang -p github.com/exchangeCC --label exchangeCCv2
# peer lifecycle chaincode install exchangeCC.tgz
## you may have following error. In such case retry the command...
Error: failed to endorse chaincode install: rpc error: code = Unavailable desc = transport is closing
# peer lifecycle chaincode install exchangeCC.tgz
2020-04-29 17:32:07.603 UTC [cli.lifecycle.chaincode] submitInstallProposal -> INFO 001 Installed remotely: response:<status:200 payload:"\nMexchangeCCv2:915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62\022\014exchangeCCv2" >
2020-04-29 17:32:07.603 UTC [cli.lifecycle.chaincode] submitInstallProposal -> INFO 002 Chaincode code package identifier: exchangeCCv2:915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62
```

Puis sur `peer1.bank2` :

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER1_BANK2_PRADDR
# peer lifecycle chaincode install exchangeCC.tgz
2020-04-29 17:46:45.616 UTC [cli.lifecycle.chaincode] submitInstallProposal -> INFO 001 Installed remotely: response:<status:200 payload:"\nMexchangeCCv2:915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62\022\014exchangeCCv2" >
2020-04-29 17:46:45.616 UTC [cli.lifecycle.chaincode] submitInstallProposal -> INFO 002 Chaincode code package identifier: exchangeCCv2:915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62
```

#### Approval et commit

Nous allons maintenant approuver la chaincode sur chacune des organisations.

Sur `cliBank1` :

```
# peer lifecycle chaincode queryinstalled >&log.txt
# export PACKAGE_ID=`sed -n '/Package/{s/^Package ID: //; s/, Label:.*$//; p;}' log.txt`
# peer lifecycle chaincode approveformyorg --package-id ${PACKAGE_ID} \
--channelID $CHANNEL_NAME --name excc --version 2.0 --signature-policy "OR('Bank1MSP.member','Bank2MSP.member')" --init-required \
--sequence 1 --waitForEvent --tls=true --cafile $ORDERER_TLS_CA
2020-04-29 17:47:32.310 UTC [cli.lifecycle.chaincode] setOrdererClient -> INFO 001 Retrieved channel (bankscochannel) orderer endpoint: orderer.banksco.com:7050
2020-04-29 17:47:35.078 UTC [chaincodeCmd] ClientWait -> INFO 002 txid [7f3bbcbc6f4459887eecda2db001675ba3acdb028f9eeaadba47556a13086b67] committed with status (VALID) at
# peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
  --name excc --version 2.0 --signature-policy "OR('Bank1MSP.member','Bank2MSP.member')" --init-required --sequence 1 \
  --tls true --cafile $ORDERER_TLS_CA --output json
{
	"approvals": {
		"Bank1MSP": true,
		"Bank2MSP": false
	}
}
```

Sur `cliBank2` :

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER0_BANK2_PRADDR
# peer lifecycle chaincode queryinstalled >&log.txt
# export PACKAGE_ID=`sed -n '/Package/{s/^Package ID: //; s/, Label:.*$//; p;}' log.txt`
# peer lifecycle chaincode approveformyorg -o orderer.banksco.com:7050 --tls=true --cafile $ORDERER_TLS_CA --channelID $CHANNEL_NAME \
--package-id ${PACKAGE_ID} --init-required --name excc --version 2.0 --signature-policy "OR('Bank1MSP.member','Bank2MSP.member')" \
--sequence 1 --waitForEvent
2020-04-29 17:48:49.732 UTC [chaincodeCmd] ClientWait -> INFO 001 txid [015f76027791b27e6ddc71ff508893ba76eccad9de00d3e7e04b43bf244ac997] committed with status (VALID) at
# peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
  --name excc --version 2.0 --signature-policy "OR('Bank1MSP.member','Bank2MSP.member')" --init-required --sequence 1 \
  --tls true --cafile $ORDERER_TLS_CA --output json
{
	"approvals": {
		"Bank1MSP": true,
		"Bank2MSP": true
	}
}
```

Nous pouvons désormais commiter la chaincode maintenant que les deux organisations se sont mis d'accord.

Toujour sur `cliBank2` :

```
# peer lifecycle chaincode commit --channelID $CHANNEL_NAME --name excc --version 2.0 \
--signature-policy "OR('Bank1MSP.member','Bank2MSP.member')" --init-required --sequence 1 --waitForEvent \
--peerAddresses $PEER0_BANK2_PRADDR \
--tlsRootCertFiles $PEER0_BANK2_TLS_CA \
--peerAddresses $PEER0_BANK1_PRADDR \
--tlsRootCertFiles $PEER0_BANK1_TLS_CA \
--tls=true --cafile $ORDERER_TLS_CA
2020-04-29 17:50:19.636 UTC [cli.lifecycle.chaincode] setOrdererClient -> INFO 001 Retrieved channel (bankscochannel) orderer endpoint: orderer.banksco.com:7050
2020-04-29 17:50:23.394 UTC [chaincodeCmd] ClientWait -> INFO 002 txid [f988b79c4e1cf3ae8265afd66563429925a571b7d121c7c368c1adebc68d059f] committed with status (VALID) at peer0.bank2.banksco.com:7051
2020-04-29 17:50:23.921 UTC [chaincodeCmd] ClientWait -> INFO 003 txid [f988b79c4e1cf3ae8265afd66563429925a571b7d121c7c368c1adebc68d059f] committed with status (VALID) at peer0.bank1.banksco.com:7051
```

Remarquons que les chaincodes ont été demarré sur chacun des peers ou elles ont été installées :

```
╰─$ docker ps -a
CONTAINER ID        IMAGE                                                                                                                                                                        COMMAND                  CREATED             STATUS              PORTS                                            NAMES
5a2cd2d3294a        dev-peer1.bank2.banksco.com-exchangeccv2-915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62-ad4bf373e36549e252cf6f98c1d91c96e070ea975141ecf7084a2ef1f8880d39   "chaincode -peer.add…"   2 seconds ago       Created                                                              dev-peer1.bank2.banksco.com-exchangeCCv2-915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62
b6bacd63f86b        dev-peer0.bank2.banksco.com-exchangeccv2-915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62-1827c354fde8a794446bc5e0544aba979363f435aa3cccf668164601ae94e49d   "chaincode -peer.add…"   2 seconds ago       Created                                                              dev-peer0.bank2.banksco.com-exchangeCCv2-915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62
7f63729313d5        dev-peer0.bank1.banksco.com-exchangeccv2-915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62-807313ec61eb4293e96eb734035f5d663b54f0328cc14134b54c82bf5b74c75e   "chaincode -peer.add…"   3 seconds ago       Created                                                              dev-peer0.bank1.banksco.com-exchangeCCv2-915c2c236308ba1c1dbbea21cc483a6e7b17c7a5d2be062d6fda39c8a2fdec62
562ff3cdd42e        hyperledger/fabric-tools:2.2.0                                                                                                                                         "/bin/sh"                2 hours ago         Up 2 hours                                                           cliBank1
c3ec8f7b2bb4        hyperledger/fabric-tools:2.2.0                                                                                                                                         "/bin/sh"                2 hours ago         Up 2 hours                                                           cliBank2
7e18233e8bd2        hyperledger/fabric-peer:2.2.0                                                                                                                                          "peer node start"        2 hours ago         Up 2 hours          0.0.0.0:7056->7051/tcp, 0.0.0.0:7058->7053/tcp   peer1.bank1.banksco.com
a85820851b48        hyperledger/fabric-peer:2.2.0                                                                                                                                          "peer node start"        2 hours ago         Up 2 hours          0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.bank1.banksco.com
8c1dee0c1f78        hyperledger/fabric-peer:2.2.0                                                                                                                                          "peer node start"        2 hours ago         Up 2 hours          0.0.0.0:8051->7051/tcp, 0.0.0.0:8053->7053/tcp   peer0.bank2.banksco.com
b648627fe3e7        hyperledger/fabric-peer:2.2.0                                                                                                                                          "peer node start"        2 hours ago         Up 2 hours          0.0.0.0:8056->7051/tcp, 0.0.0.0:8058->7053/tcp   peer1.bank2.banksco.com
a1315b921ef3        hyperledger/fabric-orderer:2.2.0                                                                                                                                       "orderer"                2 hours ago         Up 2 hours          0.0.0.0:7050->7050/tcp                           orderer.banksco.com
```

Nous pouvons désormais initialiser la chaincode excc v2.0 en initialisant les comptes des compagnies `a` à 100 et `b` à 200.

Prenons par exemple le peer `peer0.bank2`.

```
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER0_BANK2_PRADDR

# peer chaincode invoke -o orderer.banksco.com:7050 --tls true --cafile $ORDERER_TLS_CA -C $CHANNEL_NAME -n excc \
--peerAddresses $PEER0_BANK2_PRADDR --tlsRootCertFiles $PEER0_BANK2_TLS_CA \
--peerAddresses $PEER0_BANK1_PRADDR --tlsRootCertFiles $PEER0_BANK1_TLS_CA --isInit -c '{"Args":["init","a","100","b","200"]}'
2020-04-29 18:04:21.528 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200
# exit
```

**NOTE 1 :** nous pouvons vérifier que les peers synchronisent leurs blocks à la fin de l'opération en vérifiant les logs :

```
$ docker logs peer0.bank2.banksco.com
...
2020-04-29 18:04:23.582 UTC [gossip.privdata] StoreBlock -> INFO 07f [bankscochannel] Received block [6] from buffer
2020-04-29 18:04:23.584 UTC [committer.txvalidator] Validate -> INFO 080 [bankscochannel] Validated block [6] in 1ms
2020-04-29 18:04:23.584 UTC [gossip.privdata] prepareBlockPvtdata -> INFO 081 Successfully fetched all eligible collection private write sets for block [6] channel=bankscochannel
2020-04-29 18:04:23.678 UTC [kvledger] CommitLegacy -> INFO 082 [bankscochannel] Committed block [6] with 1 transaction(s) in 93ms (state_validation=0ms block_and_pvtdata_commit=68ms state_commit=8ms) commitHash=[af265bb7a6991df8b5ba45373f67c645d738073a0d37e990b2353dacc28dff90]

$ docker logs peer0.bank1.banksco.com
...
2020-04-29 18:04:23.582 UTC [gossip.privdata] StoreBlock -> INFO 07f [bankscochannel] Received block [6] from buffer
2020-04-29 18:04:23.584 UTC [committer.txvalidator] Validate -> INFO 080 [bankscochannel] Validated block [6] in 1ms
2020-04-29 18:04:23.584 UTC [gossip.privdata] prepareBlockPvtdata -> INFO 081 Successfully fetched all eligible collection private write sets for block [6] channel=bankscochannel
2020-04-29 18:04:23.678 UTC [kvledger] CommitLegacy -> INFO 082 [bankscochannel] Committed block [6] with 1 transaction(s) in 93ms (state_validation=0ms block_and_pvtdata_commit=68ms state_commit=8ms) commitHash=[af265bb7a6991df8b5ba45373f67c645d738073a0d37e990b2353dacc28dff90]]
```

### Invoke et Query sur la chaincode excc

Nous pouvons désormais faire des requêtes sur la chaincode `excc`. Voici un example sur `peer0.bank1` :

```
$ docker exec -it cliBank1 sh
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BANK1_TLS_CA
# export CORE_PEER_ADDRESS=$PEER0_BANK1_PRADDR
# peer chaincode query -C $CHANNEL_NAME -n excc -c '{"Args":["query","a"]}'
100
...
```

Nous allons maintenant exécuter notre première transaction du compte a vers le compte b (a va payer 10 à b).
Cette opération nécessite une transaction HLF et donc ce que nous appellons une opération d'invocation :

```
# peer chaincode invoke -o orderer.banksco.com:7050  --tls true --cafile $ORDERER_TLS_CA  -C $CHANNEL_NAME -n excc\
 -c '{"Args":["invoke","a","b","10"]}'
2020-04-29 18:08:40.642 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200
```

Nous pouvons noter que cette opération d'invocation implique l'écriture d'un nouveau block dans la blockchain :

```
# exit
$ docker logs peer0.bank1.banksco.com
...

2020-04-29 18:08:42.669 UTC [gossip.privdata] StoreBlock -> INFO 087 [bankscochannel] Received block [7] from buffer
2020-04-29 18:08:42.674 UTC [committer.txvalidator] Validate -> INFO 088 [bankscochannel] Validated block [7] in 4ms
2020-04-29 18:08:42.680 UTC [gossip.privdata] prepareBlockPvtdata -> INFO 089 Successfully fetched all eligible collection private write sets for block [7] channel=bankscochannel
2020-04-29 18:08:42.721 UTC [kvledger] CommitLegacy -> INFO 08a [bankscochannel] Committed block [7] with 1 transaction(s) in 37ms (state_validation=4ms block_and_pvtdata_commit=23ms state_commit=6ms) commitHash=[d7b33cfe6b0568703a69b46590a35be846b01f14d1b8e7d34489b16141104181]

$ docker logs peer0.bank2.banksco.com
...

2020-04-29 18:08:42.669 UTC [gossip.privdata] StoreBlock -> INFO 087 [bankscochannel] Received block [7] from buffer
2020-04-29 18:08:42.674 UTC [committer.txvalidator] Validate -> INFO 088 [bankscochannel] Validated block [7] in 4ms
2020-04-29 18:08:42.680 UTC [gossip.privdata] prepareBlockPvtdata -> INFO 089 Successfully fetched all eligible collection private write sets for block [7] channel=bankscochannel
2020-04-29 18:08:42.721 UTC [kvledger] CommitLegacy -> INFO 08a [bankscochannel] Committed block [7] with 1 transaction(s) in 37ms (state_validation=4ms block_and_pvtdata_commit=23ms state_commit=6ms) commitHash=[d7b33cfe6b0568703a69b46590a35be846b01f14d1b8e7d34489b16141104181]
```

Pour finir, nous allons faire une dernière requête pour vérifier l'état du compte a sur le peer `peer1.bank2` :

```
$ docker exec -it cliBank2 sh
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_BANK2_TLS_CA
# export CORE_PEER_ADDRESS=$PEER1_BANK2_PRADDR
# peer chaincode query -C $CHANNEL_NAME -n excc -c '{"Args":["query","a"]}'
90
...
```

### Installation et instantiation de la chaincode

Installez la chaincode sur `peer1.bank1` et requêtez l'état du compte `a`.

### Nettoyer votre environnement avant le prochain exercice !

```
$ docker-compose -f docker-compose-cli.yaml stop && docker-compose -f docker-compose-cli.yaml rm -f
$ docker ps -a | grep dev- | awk '{print $1}' | xargs docker rm
$ docker images | grep dev | awk '{print $3}' | xargs docker rmi
```
