#!/usr/bin/env bash

echo "-- STARTING NETWORK ----"
docker-compose -f docker-compose-cc_lc_hlf_V2.yaml up -d


echo "-- CREATING CHANNEL ----"
docker exec cliBank1 \
bash -c "peer channel create -o orderer.banksco.com:7050 -c \${CHANNEL_NAME} -f ./channel-artifacts/channel.tx --tls true --cafile \${ORDERER_TLS_CA}"



echo "-- JOINING BANK1 PEERS TO CHANNEL ----"
docker exec cliBank1 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK1_PRADDR} && \
peer channel join -b bankscochannel.block"

docker exec cliBank1 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER1_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER1_BANK1_PRADDR} && \
peer channel join -b bankscochannel.block"

echo "-- JOINING BANK2 PEERS TO CHANNEL ----"
docker exec cliBank2 \
bash -c "peer channel fetch newest \${CHANNEL_NAME}.block -o orderer.banksco.com:7050 -c \${CHANNEL_NAME} --tls --cafile \${ORDERER_TLS_CA}"

docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK2_PRADDR} && \
peer channel join -b bankscochannel.block"

docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER1_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER1_BANK2_PRADDR} && \
peer channel join -b bankscochannel.block"



echo "-- MANAGING ANCHORS ON BANK1 ----"
docker exec cliBank1 \
bash -c "peer channel update -o orderer.banksco.com:7050 -c \$CHANNEL_NAME -f ./channel-artifacts/Bank1MSPanchors.tx --tls --cafile \$ORDERER_TLS_CA"

echo "-- MANAGING ANCHORS ON BANK2 ----"
docker exec cliBank2 \
bash -c "peer channel update -o orderer.banksco.com:7050 -c \$CHANNEL_NAME -f ./channel-artifacts/Bank2MSPanchors.tx --tls --cafile \$ORDERER_TLS_CA"



echo "-- PACKAGING AND INSTALLING CHAINCODE ON BANK1 ----"
docker exec cliBank1 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK1_PRADDR} && \
peer lifecycle chaincode package exchangeCC.tgz --lang golang -p github.com/exchangeCC --label exchangeCCv2"

docker exec cliBank1 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK1_PRADDR} && \
peer lifecycle chaincode install exchangeCC.tgz"

docker exec cliBank1 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER1_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER1_BANK1_PRADDR} && \
peer lifecycle chaincode install exchangeCC.tgz"

echo "-- PACKAGING AND INSTALLING CHAINCODE ON BANK2 ----"
docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK2_PRADDR} && \
peer lifecycle chaincode package exchangeCC.tgz --lang golang -p github.com/exchangeCC --label exchangeCCv2"

docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK2_PRADDR} && \
peer lifecycle chaincode install exchangeCC.tgz"

docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER1_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER1_BANK2_PRADDR} && \
peer lifecycle chaincode install exchangeCC.tgz"



echo "-- MANAGING CHAINCODE APPROVAL ON BANK1 ---"
docker exec cliBank1 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK1_PRADDR} && \
peer lifecycle chaincode queryinstalled >&log.txt"

PACKAGE_ID=`docker exec cliBank1 \
bash -c "sed -n '/Package/{s/^Package ID: //; s/, Label:.*$//; p;}' log.txt"`

docker exec \
-e PACKAGE_ID=${PACKAGE_ID} \
cliBank1 bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK1_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK1_PRADDR} && \
peer lifecycle chaincode approveformyorg --package-id \${PACKAGE_ID} \
--channelID \$CHANNEL_NAME --name excc --version 2.0 --signature-policy \"OR('Bank1MSP.member','Bank2MSP.member')\" --init-required \
--sequence 1 --waitForEvent --tls=true --cafile \$ORDERER_TLS_CA
"

docker exec cliBank1 \
bash -c "peer lifecycle chaincode checkcommitreadiness --channelID \$CHANNEL_NAME \
--name excc --version 2.0 --signature-policy \"OR('Bank1MSP.member','Bank2MSP.member')\" --init-required --sequence 1 \
--tls true --cafile \$ORDERER_TLS_CA --output json
"

echo "-- MANAGING CHAINCODE APPROVAL AND COMMIT ON BANK2 ---"
docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK2_PRADDR} && \
peer lifecycle chaincode queryinstalled >&log.txt"

PACKAGE_ID=`docker exec cliBank2 \
bash -c "sed -n '/Package/{s/^Package ID: //; s/, Label:.*$//; p;}' log.txt"`

docker exec \
-e PACKAGE_ID=${PACKAGE_ID} \
cliBank2 bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK2_PRADDR} && \
peer lifecycle chaincode approveformyorg --package-id \${PACKAGE_ID} \
--channelID \$CHANNEL_NAME --name excc --version 2.0 --signature-policy \"OR('Bank1MSP.member','Bank2MSP.member')\" --init-required \
--sequence 1 --waitForEvent --tls=true --cafile \$ORDERER_TLS_CA
"

docker exec cliBank2 \
bash -c "peer lifecycle chaincode checkcommitreadiness --channelID \$CHANNEL_NAME \
--name excc --version 2.0 --signature-policy \"OR('Bank1MSP.member','Bank2MSP.member')\" --init-required --sequence 1 \
--tls true --cafile \$ORDERER_TLS_CA --output json
"

docker exec cliBank2 \
bash -c "peer lifecycle chaincode commit --channelID \$CHANNEL_NAME --name excc --version 2.0 \
--signature-policy \"OR('Bank1MSP.member','Bank2MSP.member')\" --init-required --sequence 1 --waitForEvent \
--peerAddresses \$PEER0_BANK2_PRADDR \
--tlsRootCertFiles \$PEER0_BANK2_TLS_CA \
--peerAddresses \$PEER0_BANK1_PRADDR \
--tlsRootCertFiles \$PEER0_BANK1_TLS_CA \
--tls=true --cafile \$ORDERER_TLS_CA"


echo "-- INITIALIZING CHAINCODE FROM BANK2 ---"
docker exec cliBank2 \
bash -c "export CORE_PEER_TLS_ROOTCERT_FILE=\${PEER0_BANK2_TLS_CA} && export CORE_PEER_ADDRESS=\${PEER0_BANK2_PRADDR} && \
peer chaincode invoke -o orderer.banksco.com:7050 --tls true --cafile \$ORDERER_TLS_CA -C \$CHANNEL_NAME -n excc \
--peerAddresses \$PEER0_BANK2_PRADDR --tlsRootCertFiles \$PEER0_BANK2_TLS_CA \
--peerAddresses \$PEER0_BANK1_PRADDR --tlsRootCertFiles \$PEER0_BANK1_TLS_CA --isInit -c '{\"Args\":[\"init\",\"a\",\"100\",\"b\",\"200\"]}'"



docker stop cliBank1 > /dev/null && docker rm cliBank1 > /dev/null
docker stop cliBank2 > /dev/null && docker rm cliBank2 > /dev/null

echo "-- EXCHANGE NETWORK IS READY ---"