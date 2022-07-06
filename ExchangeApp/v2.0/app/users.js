/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
const fs = require('fs');

const log4js = require('log4js');
const logger = log4js.getLogger('Users');
logger.setLevel('DEBUG');

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');

const loadPemFromFilePath = async function(pemFilePath) {
    return Buffer.from(fs.readFileSync(pemFilePath)).toString();
};

const enrollAdmin = async function (adminUserCred, orgName, orgConnectionProfile, walletsRootPath) {
    try {
        // Create a new CA client for interacting with the CA.
        const caInfo = orgConnectionProfile.certificateAuthorities['ca-'+orgName];
        const caTLSCACerts = await loadPemFromFilePath(caInfo.tlsCACerts.path);
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: caInfo.httpOptions.verify }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const wallet = await Wallets.newFileSystemWallet(walletsRootPath);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get(adminUserCred.username);
        if (identity) {
            logger.info('An identity for the admin@' + orgName + ' user ' + adminUserCred.username + ' already exists in the wallet');
            return identity;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: adminUserCred.username, enrollmentSecret: adminUserCred.secret });
        const mspid = orgConnectionProfile.organizations[orgConnectionProfile.client.organization].mspid;
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspid,
            type: 'X.509',
        };
        await wallet.put(adminUserCred.username, x509Identity);
        logger.info('Successfully enrolled admin@' + orgName + ' user ' + adminUserCred.username + ' and imported it into the wallet');
        return x509Identity;

    } catch (error) {
        logger.error(`Failed to enroll admin user ${adminUserCred.username}: ${error}`);
        process.exit(1);
    }
};

const getRegisteredUser = async function (adminUserCred, username, userOrg, orgConnectionProfile, walletsRootPath) {
    let secret = null;
    let wallet = null;
    let ca =  null;
    try {
        // Create a new CA client for interacting with the CA.
        const caInfo = orgConnectionProfile.certificateAuthorities['ca-' + userOrg];
        const caTLSCACerts = await loadPemFromFilePath(caInfo.tlsCACerts.path);
        ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: caInfo.httpOptions.verify }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        wallet = await Wallets.newFileSystemWallet(walletsRootPath);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
            logger.info(`An identity for the user@${userOrg} ${username} already exists in the wallet`);
            return {
                success: true,
                message: username + ' enrolled Successfully',
            };
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get(adminUserCred.username);

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserCred.username);

        // Register the user, enroll the user, and import the new identity into the wallet.
        secret = await ca.register({
            affiliation: userOrg.toLowerCase() + '.department1',
            enrollmentID: username,
            role: 'client'
        }, adminUser);

    } catch (error) {
        if (!error.toString().includes("already registered")) {
            logger.error(`Failed to register user@${userOrg} ${username}: ${error}`);
            return 'failed ' + error.toString();
        }
    }

    try {
        const enrollment = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: secret
        });
        const mspid = orgConnectionProfile.organizations[orgConnectionProfile.client.organization].mspid;
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspid,
            type: 'X.509',
        };
        await wallet.put(username, x509Identity);
        logger.info(`Successfully registered and enrolled client user@${userOrg} ${username} and imported it into the wallet`);

        return {
            success: true,
            message: username + ' enrolled Successfully',
        };
    } catch (error) {
        logger.error(`Failed to enroll user@${userOrg} ${username}: ${error}`);
        return 'failed ' + error.toString();
    }
};

exports.enrollAdmin = enrollAdmin;
exports.getRegisteredUser = getRegisteredUser;
