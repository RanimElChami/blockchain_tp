/*
 * Copyright (c) IBM Corp. All Rights Reserved.  2018
 * Unauthorized copying/modification of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('SampleWebApp');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const http = require('http');
const util = require('util');
const app = express();
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const users = require('./app/users.js');
const invoke = require('./app/invoke-transaction.js');
const query = require('./app/query.js');

//////////////////////////////// SETUP CONFIGURATONS ////////////////////////////
const appConfPath = path.resolve(__dirname, 'config', 'app.json');
const appConf = JSON.parse(fs.readFileSync(appConfPath, 'utf8'));
const orgsHLFConnectionProfile = new Map();
const orgsWalletsPath = new Map();
const orgsAdminIdentity = new Map();

appConf.orgs.forEach(orgName => {
    let cpPath = path.resolve(__dirname, 'config', orgName + '-hlf.yaml');
    orgsHLFConnectionProfile.set(orgName, yaml.safeLoad(fs.readFileSync(cpPath)));
    orgsWalletsPath.set(orgName, appConf.walletsPathPrefix + '-' + orgName);
    let identity = users.enrollAdmin(appConf.admins[0], orgName, orgsHLFConnectionProfile.get(orgName), orgsWalletsPath.get(orgName));
    orgsAdminIdentity.set(orgName, identity);
});

const host = process.env.HOST || appConf.host;
const port = process.env.PORT || appConf.port;

//////////////////////////////// SETUP EXPRESS SERVER ////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
	secret: 'thisismysecret'
}).unless({
	path: ['/users']
}));
app.use(bearerToken());
app.use(function(req, res, next) {
	if (req.originalUrl.indexOf('/users') >= 0) {
		return next();
	}

    const token = req.token;
    jwt.verify(token, app.get('secret'), function(err, decoded) {
		if (err) {
			res.send({
				success: false,
				message: 'Failed to authenticate token. Make sure to include the ' +
					'token returned from /users call in the authorization header ' +
					' as a Bearer token'
			});
			// return;
		} else {
			// add the decoded user name and org name to the request object
			// for the downstream code to use
			req.username = decoded.username;
			req.orgname = decoded.orgName;
			logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
			return next();
		}
	});
});



//////////////////////////////// START SERVER /////////////////////////////////
const server = http.createServer(app).listen(port, function () {});
logger.info('****************** SERVER STARTED ************************');
logger.info('**************  http://' + host + ':' + port +
	'  ******************');
server.timeout = 240000;

function getErrorMessage(field) {
    return {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
}


///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
// Register and enroll user
app.post('/users', function(req, res) {
    const username = req.body.username;
    const orgName = req.body.orgName;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);
	logger.debug('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
    const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(appConf.jwt_expiretime),
        username: username,
        orgName: orgName
    }, app.get('secret'));
    users.getRegisteredUser(
        appConf.admins[0], username, orgName,
        orgsHLFConnectionProfile.get(orgName), orgsWalletsPath.get(orgName), true).then(function(response) {
		if (response && typeof response !== 'string') {
			response.token = token;
			res.json(response);
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});

// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName', function(req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	const peers = req.body.peers;
	const chaincodeName = req.params.chaincodeName;
	const channelName = req.params.channelName;
	const fcn = req.body.fcn;
	const args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	invoke.invokeChaincode(
	    peers, channelName, chaincodeName, fcn, args, req.username, req.orgname,
        orgsHLFConnectionProfile.get(req.orgname), orgsWalletsPath.get(req.orgname))
	.then(function(message) {
		res.send(message);
	});
});

// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', function(req, res) {
	logger.debug('==================== QUERY BY CHAINCODE ==================');
	const channelName = req.params.channelName;
	const chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	args = args.replace(/'/g, '"');
	args = JSON.parse(args);
	logger.debug(args);

	query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname,
        orgsHLFConnectionProfile.get(req.orgname), orgsWalletsPath.get(req.orgname))
	.then(function(message) {
		res.send(message);
	});
});

// //  Query Get Block by BlockNumber
// app.get('/channels/:channelName/blocks/:blockId', function(req, res) {
// 	logger.debug('==================== GET BLOCK BY NUMBER ==================');
// 	let blockId = req.params.blockId;
// 	let peer = req.query.peer;
// 	logger.debug('channelName : ' + req.params.channelName);
// 	logger.debug('BlockID : ' + blockId);
// 	logger.debug('Peer : ' + peer);
// 	if (!blockId) {
// 		res.json(getErrorMessage('\'blockId\''));
// 		return;
// 	}
//
// 	query.getBlockByNumber(peer, req.params.channelName, blockId, req.username, req.orgname)
// 		.then(function(message) {
// 			res.send(message);
// 		});
// });
//
// // Query Get Transaction by Transaction ID
// app.get('/channels/:channelName/transactions/:trxnId', function(req, res) {
// 	logger.debug(
// 		'================ GET TRANSACTION BY TRANSACTION_ID ======================'
// 	);
// 	logger.debug('channelName : ' + req.params.channelName);
// 	let trxnId = req.params.trxnId;
// 	let peer = req.query.peer;
// 	if (!trxnId) {
// 		res.json(getErrorMessage('\'trxnId\''));
// 		return;
// 	}
//
// 	query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname)
// 		.then(function(message) {
// 			res.send(message);
// 		});
// });
//
// // Query Get Block by Hash
// app.get('/channels/:channelName/blocks', function(req, res) {
// 	logger.debug('================ GET BLOCK BY HASH ======================');
// 	logger.debug('channelName : ' + req.params.channelName);
// 	let hash = req.query.hash;
// 	let peer = req.query.peer;
// 	if (!hash) {
// 		res.json(getErrorMessage('\'hash\''));
// 		return;
// 	}
//
// 	query.getBlockByHash(peer, hash, req.params.channelName, req.username, req.orgname).then(
// 		function(message) {
// 			res.send(message);
// 		});
// });
//
// //Query for Channel Information
// app.get('/channels/:channelName', function(req, res) {
// 	logger.debug(
// 		'================ GET CHANNEL INFORMATION ======================');
// 	logger.debug('channelName : ' + req.params.channelName);
// 	let peer = req.query.peer;
//
// 	query.getChainInfo(peer, req.params.channelName, req.username, req.orgname).then(
// 		function(message) {
// 			res.send(message);
// 		});
// });
//
// // Query to fetch all Installed/instantiated chaincodes
// app.get('/chaincodes', function(req, res) {
// 	const peer = req.query.peer;
// 	const installType = req.query.type;
// 	//TODO: add Constnats
// 	if (installType === 'installed') {
// 		logger.debug(
// 			'================ GET INSTALLED CHAINCODES ======================');
// 	} else {
// 		logger.debug(
// 			'================ GET INSTANTIATED CHAINCODES ======================');
// 	}
//
// 	query.getInstalledChaincodes(peer, req.params.channelName, installType, req.username, req.orgname)
// 	.then(function(message) {
// 		res.send(message);
// 	});
// });
//
// // Query to fetch channels
// app.get('/channels', function(req, res) {
// 	logger.debug('================ GET CHANNELS ======================');
// 	logger.debug('peer: ' + req.query.peer);
// 	const peer = req.query.peer;
// 	if (!peer) {
// 		res.json(getErrorMessage('\'peer\''));
// 		return;
// 	}
//
// 	query.getChannels(peer, req.username, req.orgname)
// 	.then(function(
// 		message) {
// 		res.send(message);
// 	});
// });
