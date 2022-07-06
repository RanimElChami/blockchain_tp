# Formation Hyperledger Fabric (HLF)

Avant de commencer assurons nous de bien définir la variable d'environnement `FLAB` :

Exemple si c'est votre répertoire courant:

```
export FLAB="$PWD"
```

Sur les environnement de formations IBM (VM zLinux) :

```
export FLAB="$HOME/training-fabric"
```

**Prérequis pour la formation :**

- NodeJS (>=10.16.3 <11.0)
- NPM (>=6.9.0 <7.0)
- [jq](https://stedolan.github.io/jq/)

# HLFv2 avec cycle de vie chaincode HLFv2

## Exercice 1 : monter notre premier réseau HLF (OPS starter kit)

Dans cet exercice nous allons démarrer un réseau HLF avec les outils HLF exclusivement. De plus nous allons faire notre première
instanciation de chaincode compatible LifeCycle HLFv2 toujours avec ces même outils.

**OBJECTIFS :**

- savoir initialiser la PKI d'une organisation HLF
- savoir initialiser la connectivité entre les différents composants HLF
- savoir instancier / deployer une chaincode HLF compatible LifeCycle HLFv2
- savoir invoker / requeter une chaincode HLF

[Lien vers exercice 1.](./ExchangeNetwork/README.ex1.md)

## Exercice 2 : utiliser le sdk appplicatif

**Il est nécessaire d'avoir fini l'exercice 1 pour pouvoir faire cet exo 2.**

**OBJECTIFS:**

- savoir démarrer une application HLF avec NodeJS.
- savoir enregistrer / enroller un nouvel utilisateur dans HLF grace au composant HLF CA.
- envoyer une transaction sur réseau HLFv2 et requeter les valeurs enregistrées.

[Lien vers exercice 2.](./ExchangeApp/README.ex2.md)

## Exercice 3 : HLF Explorer

Prenez l'exemple de l'exercice 1 ou 2, avec le réseau démarré, examiner le contenu du dossier `Explorer` et essayer
de lancer le HLF Explorer

**OBJECTIFS:**

- Analyser un fichier docker-compose.yml
- Découvrir HLF Explorer


## Documentations

http://hyperledger-fabric.readthedocs.io/en/latest/

https://hyperledger-fabric.readthedocs.io/en/latest/smartcontract/smartcontract.html?highlight=system-chaincode#system-chaincode

https://hyperledger-fabric.readthedocs.io/en/release-1.4/arch-deep-dive.html?highlight=the-ordering-service-delivers-a-transactions-to-the-peers#the-ordering-service-delivers-a-transactions-to-the-peers

https://hyperledger-fabric-ca.readthedocs.io/en/latest/users-guide.html#enrolling-a-peer-identity

https://tools.ietf.org/html/rfc7519.
