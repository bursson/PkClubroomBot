"use strict"

//var Telegram = require('node-telegram-bot-api');
//var TelegramBotToken = '';
//var TelegramBot = new Telegram(TelegramBotToken,{polling: false});
var AWS = require("aws-sdk");
var doc = require('dynamodb-doc');
var dynamodbclient = new AWS.DynamoDB.DocumentClient();
var dynamodb = new doc.DynamoDB();

var moment = require('moment-timezone');

var TelegramBot = require('node-telegram-bot-api')
var TelegramBotToken = '331050054:AAFuGtDrR4g7InjUPIwCGaRH1Pmpd8XUsAM';

var bot = new TelegramBot(TelegramBotToken, {polling: false})

exports.handler = function (event, context, callback) {
    // TODO: Separate group messages from direct messages
    var chat_id = event.message.chat.id;

    console.log('Loading event');
    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));
    var msg = event.message.text.toLowerCase().split(' ');
    if (msg[0] == null) return;
    console.log(msg);
    switch (msg[0]){
        case "/valot":
            //bot.sendMessage(chat_id, "Got it")
            var value = getLastLights().then(function(data){
                var awstime = moment.tz(Date.now(), "GMT")
                var timestamp = moment.tz(Number(data), "GMT")
                console.log(timestamp.format())
                console.log("AWS: " + awstime.format())
                timestamp.tz("Europe/Helsinki")
                console.log(timestamp.format('HH:mm DD-MM'))
                bot.sendMessage(chat_id, "Valot olivat viimeksi päällä klo " + timestamp.format('HH:mm DD.MM.') )
            })
            
            //context.succeed("Responded with light status")
    }
    

}

function getLastLights() {
    return new Promise(function (resolve, reject) {
        var currentTime = new Date();
        var tableName = currentTime.getFullYear() + "-" + currentTime.getMonth();

        var params = {
            TableName: tableName
        };
        var desc = dynamodb.describeTable(params).promise().then(function (data) {
            console.log(data);           // successful response
            if (data.Table.TableStatus == 'ACTIVE') {
                console.log("Table found")
                var params = {
                    TableName: tableName
                };

                return dynamodbclient.scan(params).promise().then(function (data) {
                    console.log(data.Items[data.Items.length-1].timestamp)                    
                    resolve (data.Items[data.Items.length-1].timestamp)
                }
                );

            }else{
                reject("No table found")
            }
        })
    })

}


