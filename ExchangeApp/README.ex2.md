### Démarrer l'infrastructure HLF ExchangeNetwork nécessaire à votre application

Depuis la version 2.0 du SDK Node HLF, les outillages administrations (creation channel, deploiment chaincode ...) du SDK ont été supprimé.
Nous devons donc gérer la définition du réseau via un script dédié : `setup_hlf_v2.sh`

```
$ cd $FLAB
$ ./setup_hlf_v2.sh
...
$ docker ps -a
CONTAINER ID        IMAGE                                                                                                                                                                        COMMAND                  CREATED             STATUS              PORTS                                            NAMES
4d055e68c4af        dev-peer1.bank1.banksco.com-exchangeccv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a-db546fc6fefe125a35ae1546af6f32c88c84701514af2e4b4831e12987c1c1b4   "chaincode -peer.add…"   7 minutes ago       Up 7 minutes                                                         dev-peer1.bank1.banksco.com-exchangeCCv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a
462428b2b0a4        dev-peer1.bank2.banksco.com-exchangeccv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a-ccf5a0e24edd73a8cfb7c02226c91b86ec250c401bb8802084ee3a9219773452   "chaincode -peer.add…"   7 minutes ago       Up 7 minutes                                                         dev-peer1.bank2.banksco.com-exchangeCCv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a
6fc253b1748a        dev-peer0.bank2.banksco.com-exchangeccv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a-990d48289e3c983dc07ff11b92fc61b35bebfad318d59fc1ff65b3b52b901250   "chaincode -peer.add…"   7 minutes ago       Up 7 minutes                                                         dev-peer0.bank2.banksco.com-exchangeCCv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a
35d8cae41869        dev-peer0.bank1.banksco.com-exchangeccv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a-9143ea57be55fefd083691858ced89da07368dd17e5a7894994a33625d3fa9e9   "chaincode -peer.add…"   7 minutes ago       Up 7 minutes                                                         dev-peer0.bank1.banksco.com-exchangeCCv2-200ac0c867532de3471f65d4c1295fbde738280af737d5ecc86179fad20e410a
0acd96e9b5d0        hyperledger/fabric-orderer:amd64-2.1.0                                                                                                                                       "orderer"                9 minutes ago       Up 9 minutes        0.0.0.0:7050->7050/tcp                           orderer.banksco.com
1c84937973f6        hyperledger/fabric-peer:amd64-2.1.0                                                                                                                                          "peer node start"        9 minutes ago       Up 9 minutes        0.0.0.0:8056->7051/tcp, 0.0.0.0:8058->7053/tcp   peer1.bank2.banksco.com
1fb11a907c9b        hyperledger/fabric-peer:amd64-2.1.0                                                                                                                                          "peer node start"        9 minutes ago       Up 9 minutes        0.0.0.0:7056->7051/tcp, 0.0.0.0:7058->7053/tcp   peer1.bank1.banksco.com
0c667fccc50c        hyperledger/fabric-peer:amd64-2.1.0                                                                                                                                          "peer node start"        9 minutes ago       Up 9 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.bank1.banksco.com
d1361fa0f6d1        hyperledger/fabric-peer:amd64-2.1.0                                                                                                                                          "peer node start"        9 minutes ago       Up 9 minutes        0.0.0.0:8051->7051/tcp, 0.0.0.0:8053->7053/tcp   peer0.bank2.banksco.com
c09e8e5af44f        hyperledger/fabric-ca:1.4                                                                                                                                                    "sh -c 'fabric-ca-se…"   9 minutes ago       Up 9 minutes        0.0.0.0:8054->7054/tcp                           ca_bank2
5ad1d97e3ed7        hyperledger/fabric-ca:1.4                                                                                                                                                    "sh -c 'fabric-ca-se…"   9 minutes ago       Up 9 minutes        0.0.0.0:7054->7054/tcp                           ca_bank1
```

### Démarrer l'application ExchangeApp

Ouvrons une première console et exécutons les commandes qui suivent :

- Pour télécharger les dépendances fabric-client et fabric-ca-client (entre autre !)

```
$ cd $FLAB/ExchangeApp/v2.0
$ npm install
```

- Pour démarrer l'application

```
$ cd $FLAB/ExchangeApp/v2.0
$ node app
```

### Votre première utilisation de l'application

L'application que nous venons de démarrer offre des services REST sur le port 4000 que nous pouvons invoquer avec une commande curl.

Ouvrons une deuxième console et éxécutons les commandes qui suivent :

#### Requête de login :

- Enregistrer un utilisateur (Jim) dans l'organisation **Bank1**:

```
$ curl -s -X POST http://localhost:4000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=Jim&orgName=bank1' | jq
```

**La sortie :**

```
{
  "success": true,
  "message": "Jim enrolled Successfully",
  "token": "<le token de session>"
}
```

La réponse contient les champs suivant :

- le token de la session JWT : **vous aurez besoin de reprendre ce token dans les futures requêtes**.

A ce stade nous enregistrons le token dans une variable shell :

```
$ LOGIN=$(curl -s -X POST http://localhost:4000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=Jim&orgName=bank1' | jq '.token')
$ TOKEN=${LOGIN#"\""}
$ TOKEN=${TOKEN%"\""}
```

Pour en savoir plus sur JWT : https://tools.ietf.org/html/rfc7519.

[Constatons l'effet de cette commande sur les logs de l'application.](./logs/ex6/login.app.log)

[Nous pouvons aussi constater l'effet de l'enregistrement / enrollement de l'utilisateur Jim en inspectant les logs du composant `ca_bank1` .](./logs/ex6/login.hlfca.log)

Notons ensuite que le matériel crytographique nécessaire à l'authentification de Jim sur l'infrastructure HLF est stocké dans `/tmp/wallets-bank1`:

```
$ ls /tmp/wallets-bank1                                                                                                                                                                                                               130 ↵
Jim.id   admin.id
```

_NOTE:_ il s'agit ici d'un répertoire à sécuriser dans les installations de production. Dans les cas d'usages les plus sensibles des solutions type HSM seront les bienvenues.

#### Invoquer la chaincode pour faire un premier mouvement

```
$ curl -s -X POST \
    http://localhost:4000/channels/bankscochannel/chaincodes/excc \
    -H "authorization: Bearer $TOKEN" \
    -H "content-type: application/json" \
    -d '{
      "peers": ["peer0.bank1.banksco.com","peer1.bank1.banksco.com"],
          "fcn":"invoke",
          "args":["a","b","10"]
  }'
```

[Constatons l'effet de cette commande sur les logs de l'application.](./logs/ex6/invoke_cc.app.log)

Nous pouvons aussi constater l'effet de la création du channel sur les composants `peer0.bank1.banksco.com` et `peer1.bank1.banksco.com`:

```
$ docker logs peer0.bank1.banksco.com
...
2020-06-26 12:51:25.461 UTC [endorser] callChaincode -> INFO 080 finished chaincode: excc duration: 9ms channel=bankscochannel txID=f2413232
2020-06-26 12:51:25.463 UTC [comm.grpc.server] 1 -> INFO 081 unary call completed grpc.service=protos.Endorser grpc.method=ProcessProposal grpc.peer_address=172.24.0.1:33184 grpc.peer_subject="CN=fabric-common" grpc.code=OK grpc.call_duration=14.422ms
2020-06-26 12:51:27.571 UTC [gossip.privdata] StoreBlock -> INFO 082 [bankscochannel] Received block [7] from buffer
2020-06-26 12:51:27.574 UTC [committer.txvalidator] Validate -> INFO 083 [bankscochannel] Validated block [7] in 2ms
2020-06-26 12:51:27.575 UTC [gossip.privdata] prepareBlockPvtdata -> INFO 084 Successfully fetched all eligible collection private write sets for block [7] channel=bankscochannel
2020-06-26 12:51:27.588 UTC [kvledger] CommitLegacy -> INFO 085 [bankscochannel] Committed block [7] with 1 transaction(s) in 12ms (state_validation=0ms block_and_pvtdata_commit=7ms state_commit=2ms) commitHash=[b493fa43eb24f6e52f89ac8850dbee29b87edf90863d8ed1def8f4d278d17622]
2020-06-26 12:51:27.622 UTC [comm.grpc.server] 1 -> INFO 086 streaming call completed grpc.service=protos.Deliver grpc.method=DeliverFiltered grpc.peer_address=172.24.0.1:33204 grpc.peer_subject="CN=fabric-common" error="context finished before block retrieved: context canceled" grpc.code=Unknown grpc.call_duration=2.1082633s
```

Et sur les chaincodes `dev-peer0.bank1.banksco.com-exchangeCCv2` et `dev-peer1.bank1.banksco.com-exchangeCCv2` :

```
╰─$ docker logs dev-peer0.bank1.banksco.com-exchangeCCv2-<complétez avec l'id du container>
...
ex02 Invoke
Aval = 90, Bval = 210
```

Pour en savoir plus sur l'implémentation vous pouvez jeter un oeil sur le fichier `$FLAB/ExchangeApp/v2.0/app/invoke-transaction.js`.

#### Requeter la chaincode pour vérifier la position suite à notre premier mouvement

```
$ curl -s -X GET \
  "http://localhost:4000/channels/bankscochannel/chaincodes/excc?peer=peer1.bank1.banksco.com&fcn=query&args=%5B%22a%22%5D" \
  -H "authorization: Bearer ${TOKEN}" \
  -H "content-type: application/json"
```

Le résultat de la commande :

```
a now has 90 after the move
```

**Note:** remarquons ici que nous encodons les caratères spéciaux. La chaine `%5B%22a%22%5D` correspond à `["a"]`. Pour en savoir plus : https://www.w3schools.com/tags/ref_urlencode.asp

### Avant d'aller plus loin, prenons le temps d'inspecter l'application plus en détails

Comme nous l'avons vu, l'application ExchangeApp présente des services REST afin d'intéragir avec le réseau HLF ExchangeNetwork pour :

- enregister / enroller un nouvel utilisateur sur le réseau
- envoyer de nouvelles transactions (invoke)
- requeter le state of world HLF (query)

Le `main` de cette application se trouve dans le fichier `ExchangeApp/v2.0/app.js`. C'est ici qu'on démarre le serveur ExpressJS qui expose les `endpoints` REST défini dans ce même fichier.

Notons aussi qu'il existe deux fichiers de configuration :

- `ExchangeApp/v1.0/confing/app.json`: défini certaine valeurs par défaut comme le nom du channel, ou bien encore le login/password admin vers le composant Fabric CA.
- `ExchangeApp/v1.0/config/bank*-hlf.yaml` : défini le réseau HLF ExchangeNetwork et ses points d'accès.

Les implémentations des opérations techniques HLF sont développées dans les fichiers `ExchangeApp/v2.0/app`.
