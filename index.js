"use strict"

//var Telegram = require('node-telegram-bot-api');
//var TelegramBotToken = '';
//var TelegramBot = new Telegram(TelegramBotToken,{polling: false});

var doc = require('dynamodb-doc');
var dynamodb = new doc.DynamoDB();

exports.handler = function (event, context, callback) {
    // TODO: Separate group messages from direct messages
    //var chat_id = event.message.chat.id;

    //TelegramBot.sendMessage(chat_id, "BlaBlaBlaReponse");
    console.log('Loading event');


    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    let table = "Lights"
    let spec = new QuerySpec();
    var params = {
        TableName: table,
        Item: {
            "timestamp": year,
            "title": title,
            "info": {
                "plot": "Nothing happens at all.",
                "rating": 0
            }
        }
    };

}
