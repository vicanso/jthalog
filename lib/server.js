var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var util = require('util');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var haproxyMsgList = [];

exports.start = function(options){
  options = options || {};

  server.on('listening', function(){
    var address = server.address();
    var msg = util.format('haproxy, UDP server listening on %s:%s', address.address, address.port);
    console.log(msg);
  });

  server.on('message', function(msg){
    console.log(msg.toString());
    save(msg.toString());
  });
  var port = options.port || '2900'
  var host = options.host || '127.0.0.1'
  server.bind(port, host);
};


function getLogFile(){
  var date = new Date();
  var str = date.getFullYear();

  str += '-';
  var month = date.getMonth() + 1;
  if(month < 10){
    str += ('0' + month);
  }else{
    str += month;
  }

  str += '-';
  var day = date.getDate();
  if(day < 10){
    str += ('0' + day);
  }else{
    str += day;
  }
  return str;
}


function save(log){
  haproxyMsgList.push(log);

}

exports.start();