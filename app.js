'use strict';

const fs = require('fs');
const request = require('request');

const AVAIL_URL = 'https://www.ovh.com/engine/api/dedicated/server/availabilities?country=fr';
const BUY_URL = 'https://www.kimsufi.com/fr/commande/kimsufi.xml?reference=$SERVER';

const PUSHOVER_URL = 'https://api.pushover.net/1/messages.json';
const PUSHOVER_USER = process.env.KS_PUSHOVER_USER;
const PUSHOVER_TOKEN = process.env.KS_PUSHOVER_TOKEN;

const SERVER_TO_CHECK = process.env.KS_SERVER // '1801sk17'; // '150sk20';
const DATACENTERS_FR = ['gra', 'rbx', 'sbg'];

if (!PUSHOVER_USER) {
  console.error('$KS_PUSHOVER_USER is missing');
  return
}
if (!PUSHOVER_TOKEN) {
  console.error('$KS_PUSHOVER_TOKEN is missing');
  return
}
if (!SERVER_TO_CHECK) {
  console.error('$KS_SERVER is missing');
  return
}

checkOnline(SERVER_TO_CHECK);
// checkLocal(SERVER_TO_CHECK);

function checkLocal(server) {
  fs.readFile('./example.json', function (err, data) {
    if (err) return console.error(err);
    const servers = JSON.parse(data);
    checkAvail(servers, server);
  });
}

function checkOnline(server) {
  request.get(AVAIL_URL, function (err, response, body) {
    if (err) return console.error(err);
    if (response.statusCode !== 200) return console.log('Status', response.statusCode);
    if (response.statusCode === 200) {
      var servers = JSON.parse(body);
      checkAvail(servers, server);
    }
  });
}

function isAvail(servers, server) {
  return servers.find(s => s.region == 'europe' && s.hardware == server && s.datacenters.find(dc => DATACENTERS_FR.includes(dc.datacenter) && dc.availability != 'unavailable') );
}

function checkAvail(servers, server) {
  const isAvailable = isAvail(servers, server);
  if (isAvailable) {
    console.log(`Server ${server} is available!`);
    sendCallback(`Server ${server} is available!`, BUY_URL.replace('$SERVER', server));
  } else {
    console.log(`Server ${server} is NOT available...`);
  }
}

function sendCallback(message, url) {
  request.post(PUSHOVER_URL).form({
    user: PUSHOVER_USER,
    token: PUSHOVER_TOKEN,
    message: message,
    url: url,
  });
}
