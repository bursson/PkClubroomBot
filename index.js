"use strict"
// TODO: Reduce this
var AWS = require("aws-sdk");
var doc = require('dynamodb-doc');
var dynamodbclient = new AWS.DynamoDB.DocumentClient();
var dynamodb = new doc.DynamoDB();

// For manipulating timezones
var moment = require('moment-timezone');

// Telegram bot library, API key from Lambda environment variables
var TelegramBot = require('node-telegram-bot-api')
var TelegramBotToken = process.env.TelegramBotApiKey;

var bot = new TelegramBot(TelegramBotToken, { polling: false })

exports.handler = function (event, context, callback) {
    // TODO: Separate group messages from direct messages
    var chat_id = event.message.chat.id;

    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    // Split message
    var msg = event.message.text.toLowerCase().split(' ');
    if (msg[0] == null) return;
    console.log(msg);

    // Act according to the command
    switch (msg[0]) {
        case "/valot":
            var value = getLastLights().then(function (data) {

                // Get current AWS time and compare it to the last data
                var awstime = moment.tz(Date.now(), "GMT")
                var timestamp = moment.tz(Number(data), "GMT")
                console.log(timestamp.format())
                console.log("AWS: " + awstime.format())
                var response = "";

                // If the lights were on inside the tolerance
                if (awstime - timestamp < 15000) {
                    response = "Valot ovat päällä";
                } else {
                    // If not send the last time they were on
                    timestamp.tz("Europe/Helsinki")
                    console.log(timestamp.format('HH:mm DD-MM'))
                    response = "Valot olivat viimeksi päällä klo " + timestamp.format('HH:mm DD.MM.')
                }

                bot.sendMessage(chat_id, response)

            })
        default:
            bot.sendMessage(chat_id, "Unknown command")
    }


}

// Gets the last timestamp when the lights were on. Returns a Promise which resolves
// after the value has been fetched from DynamoDB
function getLastLights() {
    return new Promise(function (resolve, reject) {
        // Get the name of table for current month
        var currentTime = new Date();
        var tableName = currentTime.getFullYear() + "-" + currentTime.getMonth();

        var params = {
            TableName: tableName
        };
        // Check if the table exists and is active
        var desc = dynamodb.describeTable(params).promise().then(function (data) {
            console.log(data);           // successful response
            if (data.Table.TableStatus == 'ACTIVE') {
                console.log("Table found")
                var params = {
                    TableName: tableName,
                    FilterExpression: "#l = :t",
                    ExpressionAttributeNames: {
                        "#l": "lights"

                    },
                    ExpressionAttributeValues: {
                        ":t": true
                    }
                };

                // Scan the table for relevant data
                return dynamodbclient.scan(params).promise().then(function (data) {
                    console.log(data);
                    console.log(data.Items[data.Items.length - 1].timestamp)
                    // Resolve the timestamp
                    resolve(data.Items[data.Items.length - 1].timestamp)
                }
                );

            } else {
                reject("No table found")
            }
        })
    })

}


