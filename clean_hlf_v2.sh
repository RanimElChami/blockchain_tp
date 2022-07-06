#!/usr/bin/env bash

docker-compose -f docker-compose-cc_lc_hlf_V2.yaml down
docker-compose -f ExchangeNetwork/CCLifeCycleHLFv2/docker-compose-cli.yaml down
rm -rf /tmp/wallet* && \
rm -f ExchangeNetwork/CCLifeCycleHLFv2/crypto-config/peerOrganizations/bank1.banksco.com/ca/fabric-ca-server.db && \
rm -f ExchangeNetwork/CCLifeCycleHLFv2/crypto-config/peerOrganizations/bank2.banksco.com/ca/fabric-ca-server.db
docker ps -a | grep dev- | awk '{print $1}' | xargs docker rm
docker images | grep dev | awk '{print $3}' | xargs docker rmi
