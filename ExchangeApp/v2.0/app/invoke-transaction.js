/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
const util = require('util');
const { Gateway, Wallets } = require('fabric-network');

const log4js = require('log4js');
const logger = log4js.getLogger('Invoke');
logger.setLevel('DEBUG');

const invokeChaincode = async function (
    peerNames, channelName, chaincodeName, fcn, args, userName, orgName,
    orgConnectionProfile, walletsRootPath
) {
    let error_message = null;
    let tx_id_string = null;

    try {
        // Create a new file system based wallet for managing identities.
        const wallet = await Wallets.newFileSystemWallet(walletsRootPath);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
            let message = util.format(`An identity for the user@${orgName} ${userName} does not exist in the wallet`);
            logger.error(message);
            throw new Error(message);
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(orgConnectionProfile, { wallet, identity: userName, discovery: { enabled: false, asLocalhost: false } });
        logger.debug(`Successfully connected ...`);

        // Get the network (channel) our contract is deployed to.
        logger.debug(`Getting network ...`);
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        logger.debug(`Getting contract ...`);
        const contract = network.getContract(chaincodeName);

        // Submit the specified transaction.
        const tx = contract.createTransaction(fcn);
        tx.setEndorsingPeers(peerNames);
        await tx.submit(...args);
        tx_id_string = tx.getTransactionId();
        logger.info(`Transaction ${tx_id_string} has been submitted ...`);

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        logger.error('Failed to invoke due to error: ' + error.stack ? error.stack : error);
        error_message = error.toString();
    }

    if (!error_message) {
        let message = util.format(
            'Successfully invoked the chaincode %s to the channel \'%s\' for transaction ID: %s',
            orgName, channelName, tx_id_string);
        logger.info(message);

        return tx_id_string;
    } else {
        let message = util.format('Failed to invoke chaincode. cause:%s', error_message);
        logger.error(message);
        return message;
    }
};

exports.invokeChaincode = invokeChaincode;
