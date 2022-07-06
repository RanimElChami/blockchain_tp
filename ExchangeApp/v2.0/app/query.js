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
const logger = log4js.getLogger('Query');
logger.setLevel('DEBUG');

const queryChaincode = async function (
    peer, channelName, chaincodeName, args, fcn, userName, orgName,
    orgConnectionProfile, walletsRootPath
) {
    try {
        // Create a new file system based wallet for managing identities.
        const wallet = await Wallets.newFileSystemWallet(walletsRootPath);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
            let message = util.format(`An identity for the user@${orgName} ${userName} does not exist in the wallet`);
            logger.error(message);
            return message
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

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction(fcn, ...args);
        logger.info(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

        return args[0] + ' now has ' + result.toString('utf8') +
            ' after the move';

    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        return error
    }
};

const getBlockByNumber = async function (peer, channelName, blockNumber, username, org_name) {
    /*
    try {
        // first setup the client for this org
        const client = await helper.getClientForOrg(org_name, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
        const channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            return message;
        }

        let response_payload = await channel.queryBlock(parseInt(blockNumber, peer));
        if (response_payload) {
            logger.debug(response_payload);
            return response_payload;
        } else {
            logger.error('response_payload is null');
            return 'response_payload is null';
        }
    } catch (error) {
        logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
        return error.toString();
    }
    */
};

const getTransactionByID = async function (peer, channelName, trxnID, username, org_name) {
    /*
    try {
        // first setup the client for this org
        const client = await helper.getClientForOrg(org_name, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
        const channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            return message;
        }

        let response_payload = await channel.queryTransaction(trxnID, peer);
        if (response_payload) {
            logger.debug(response_payload);
            return response_payload;
        } else {
            logger.error('response_payload is null');
            return 'response_payload is null';
        }
    } catch (error) {
        logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
        return error.toString();
    }
    */
};

const getBlockByHash = async function (peer, channelName, hash, username, org_name) {
    /*
    try {
        // first setup the client for this org
        const client = await helper.getClientForOrg(org_name, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
        const channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            return message;
        }

        let response_payload = await channel.queryBlockByHash(Buffer.from(hash), peer);
        if (response_payload) {
            logger.debug(response_payload);
            return response_payload;
        } else {
            logger.error('response_payload is null');
            return 'response_payload is null';
        }
    } catch (error) {
        logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
        return error.toString();
    }
    */
};

const getChainInfo = async function (peer, channelName, username, org_name) {
    /*
    try {
        // first setup the client for this org
        const client = await helper.getClientForOrg(org_name, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
        const channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            return message;
        }

        let response_payload = await channel.queryInfo(peer);
        if (response_payload) {
            logger.debug(response_payload);
            return response_payload;
        } else {
            logger.error('response_payload is null');
            return 'response_payload is null';
        }
    } catch (error) {
        logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
        return error.toString();
    }
    */
};

//getInstalledChaincodes
const getInstalledChaincodes = async function (peer, channelName, type, username, org_name) {
    /*
    try {
        // first setup the client for this org
        const client = await helper.getClientForOrg(org_name, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

        let response = null
        if (type === 'installed') {
            response = await client.queryInstalledChaincodes(peer, true); //use the admin identity
        } else {
            const channel = client.getChannel(channelName);
            if (!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                return message;
            }
            response = await channel.queryInstantiatedChaincodes(peer, true); //use the admin identity
        }
        if (response) {
            if (type === 'installed') {
                logger.debug('<<< Installed Chaincodes >>>');
            } else {
                logger.debug('<<< Instantiated Chaincodes >>>');
            }
            let details = [];
            for (let i = 0; i < response.chaincodes.length; i++) {
                logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
                    response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
                );
                details.push('name: ' + response.chaincodes[i].name + ', version: ' +
                    response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
                );
            }
            return details;
        } else {
            logger.error('response is null');
            return 'response is null';
        }
    } catch (error) {
        logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
        return error.toString();
    }
    */
};

const getChannels = async function (peer, username, org_name) {
    /*
    try {
        // first setup the client for this org
        const client = await helper.getClientForOrg(org_name, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

        let response = await client.queryChannels(peer);
        if (response) {
            logger.debug('<<< channels >>>');
            let channelNames = [];
            for (let i = 0; i < response.channels.length; i++) {
                channelNames.push('channel id: ' + response.channels[i].channel_id);
            }
            logger.debug(channelNames);
            return response;
        } else {
            logger.error('response_payloads is null');
            return 'response_payloads is null';
        }
    } catch (error) {
        logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
        return error.toString();
    }
    */
};

exports.queryChaincode = queryChaincode;
exports.getBlockByNumber = getBlockByNumber;
exports.getTransactionByID = getTransactionByID;
exports.getBlockByHash = getBlockByHash;
exports.getChainInfo = getChainInfo;
exports.getInstalledChaincodes = getInstalledChaincodes;
exports.getChannels = getChannels;
