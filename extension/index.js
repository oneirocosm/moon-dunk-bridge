'use strict';
const io = require("socket.io-client");
const { Convert } = require("easy-currencies");

const initOptions = {
	noLocking: true,
};
const pgp = require('pg-promise')(initOptions);

const cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword',
};

module.exports = function (nodecg) {

	if(!nodecg.bundleConfig) {
        nodecg.log.error("No bundleConfig found, nodecg-streamlabs will not work without a configuration. Exiting.");
        return;
    } else if(typeof nodecg.bundleConfig.socket_token !== "string") {
        nodecg.log.error("No socket_token value present in bundleConfig, nodecg-streamlabs will not work without a socket_token. Exiting");
        return;
    }

	let socket = io.connect(`https://sockets.streamlabs.com/?token=${nodecg.bundleConfig.socket_token}`, opts);

	socket.on("event", event => {
        // This wouldn't be necessary if it weren't for the rogue 'streamlabels' event that is not an array
        let unformatted = event.message instanceof Array ? event.message.pop() : event.message;
        
        // No message? Must be an error, so we skip it because we already do raw emits.
        if(!(unformatted instanceof Object)) {
            nodecg.log.error(`Event ${event.event_id} had no ites in its event.message property, skipping.`);
            return;
        }

        nodecg.log.debug("New streamlabs event: " + event.type);

        switch(event.type) {
            case "donation": {
				for (const instance of event.message) {
					writeToDb(nodecg, instance);
					// TODO - send donation info to queue
				}
			}
		}
	});

	//TODO - check processed and use result to update replicant

	nodecg.log.info('Hello, from your bundle\'s extension!');
	nodecg.log.info('I\'m where you put all your server-side code.');
	nodecg.log.info(`To edit me, open "${__filename}" in your favorite text editor or IDE.`);
	nodecg.log.info('You can use any libraries, frameworks, and tools you want. There are no limits.');
	nodecg.log.info('Visit https://nodecg.com for full documentation.');
	nodecg.log.info('Good luck!');
};

writeToDb = function(nodecg, instance) {
    const cn = {
        host: `${nodecg.bundleConfig.database_ip}`, // 'localhost' is the default;
        port: `${nodecg.bundleConfig.database_port}`, // 5432 is the default;
        database: `${nodecg.bundleConfig.database_name}`,
        user: `${nodecg.bundleConfig.database_user}`,
        password: `${nodecg.bundleConfig.database_password}`,
    };
	
	const amountUsd = await Convert(instance.amount).from(instance.currency).to("USD");

	// TODO - perform insertion
}