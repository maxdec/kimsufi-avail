'use strict';

var fs = require('fs');
var request = require('request');
var slack = require('slack-notify')(process.env.SLACK_WEBHOOK_URL);

var AVAIL_URL = 'https://ws.ovh.com/dedicated/r2/ws.dispatcher/getAvailability2';
var BUY_URL = 'https://www.kimsufi.com/en/order/kimsufi.cgi?hard=$SERVER';
var serversToCheck = ['150sk30'];//, '150sk20'];
checkAvail(serversToCheck);
// checkLocal(serversToCheck);

function checkLocal(servers) {
  fs.readFile('./example.json', function (err, data) {
    if (err) return console.error(err);
    var json = JSON.parse(data);
    var output = formatOutput(servers, json.answer.availability);
    sendSlack(output);
  });
}

function checkAvail(servers) {
  request.get(AVAIL_URL, function (err, response, body) {
    if (err) return console.error(err);
    if (response.statusCode !== 200) return console.log('Status', response.statusCode);
    if (response.statusCode === 200) {
      var json = JSON.parse(body);
      var output = formatOutput(servers, json.answer.availability);
      sendSlack(output);
    }
  });
}

function formatOutput(servers, availabilityList) {
  var lines = [];
  availabilityList.forEach(function (avail) {
    if (servers.indexOf(avail.reference) < 0) return;
    var availZones = [];
    avail.zones.forEach(function (zone) {
      if (zone.availability !== 'unknown') availZones.push(zone.zone + ' ('+ zone.availability + ')');
    });

    if (availZones.length > 0) {
      lines.push('*<' + BUY_URL.replace('$SERVER', avail.reference) + '|' + avail.reference + '>*');
      lines.push(availZones.join(' - '));
    }
  });

  return lines.join('\n');
}

function sendSlack(output) {
  if (!output) return;
  slack.send({
    channel: '@maxence',
    icon_url: 'http://www.kimsufi.com/uk/images/about-ks/ovh.png',
    text: output,
    unfurl_links: 0,
    username: 'Kimsufi'
  });
}
