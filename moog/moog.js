/**
 * Created by stephen on 11/01/2017.
 */

module.exports = function (RED) {
    var moog = require('node-moog');
    var MoogEvent = moog.MoogEvent;

    var myEvent;

    function MoogNode(config) {
        RED.nodes.createNode(this, config);
        this.url = config.url;
        this.user = config.user;
        this.pass = config.pass;
        var node = this;
        var moogRest;

        if (this.user && this.pass) {
            moogRest = moog.moogREST({'url': this.url, 'authUser': this.user, 'authPass': this.pass});
        } else {
            moogRest = moog.moogREST({'url': this.url});
        }

        this.on('input', function process(msg) {

            node.log('Connecting to ' + node.url);

            var messageObj;

            if (typeof msg.moog === 'object') {
                messageObj = msg.moog;
            } else if (msg.payload === 'object') {
                messageObj = msg.payload;
            } else {
                {
                    try {
                        messageObj = JSON.parse(msg.payload);
                    } catch (e) {
                        node.error('JSON.stringify(msg.payload) failed ' + e);
                        return;
                    }
                }
            }

            myEvent = new MoogEvent();
            myEvent.class = 'node-red';
            myEvent.description = messageObj.description;
            myEvent.severity = messageObj.severity;
            myEvent.source = messageObj.source;
            myEvent.agent_location = messageObj.location;
            myEvent.agent = messageObj.agent;
            myEvent.type = msg.topic;

            moogRest.sendEvent(myEvent, function (res, rtn) {
                if (res.statusCode === 200) {
                    node.log('moogRest message: ' + rtn);
                    node.status({fill: "green", shape: "dot", text: "connected"});
                } else {
                    node.error('moogRest rtn - ' + rtn);
                    node.error('moogRest res - ' + res.statusCode + " " + res.statusMessage);
                    node.error('Connection error for ' + node.url);
                    node.status({fill: "red", shape: "ring", text: res.statusCode + " " + res.statusMessage});
                }
            });

        });

        this.on('close', function () {
            node.log('Disconnected from ' + node.url);
        });
    }

    RED.nodes.registerType("moog", MoogNode);
};
