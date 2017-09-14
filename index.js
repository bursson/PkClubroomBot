"use strict"

var AWS = require("aws-sdk");

var mysql = require('mysql');

// For manipulating timezones
var moment = require('moment-timezone');

// Telegram bot library, API key from Lambda environment variables
var TelegramBot = require('node-telegram-bot-api')
var TelegramBotToken = process.env.TelegramBotApiKey;

var bot = new TelegramBot(TelegramBotToken, { polling: false })

// Milliseconds for the maximum delay when lights are concidered to be on
const MAX_DELAY_FOR_ON = 60000

exports.handler = function (event, context, callback) {

    var connection = mysql.createConnection({
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT,
        database: "pkaula"
    });

    // Print info to CloudWatch for possible debugging
    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    var chat_id = event.message.chat.id;

    // Only process message if it is a botcommand (Telegram sends a lot of other info)
    if (!("text" in event.message)) {
        context.succeed("Nothing here for me")
    }
    else if (!event.message.hasOwnProperty("entities")) {
        context.succeed("Nothing here for me")
    }
    else if (event.message.entities[0].type != "bot_command") {
        context.succeed("Nothing here for me")
    } else {

        // Split message
        var msg = event.message.text.toLowerCase().split(' ');
        if (msg[0] == null) context.succeed("No message");
        console.log(msg);

        // Act according to the command
        if (msg[0] == "/valot" || msg[0] == "/valot@aws_valobot") {
            var task = getLastLights().then(function (data) {

                data = data[0].timestamp
                console.log("data is " + data);
                // Get current AWS time and compare it to the last data
                var awstime = moment.tz(Date.now(), "GMT")
                var timestamp = moment.tz(Number(data), "GMT")
                console.log(timestamp.format())
                console.log("AWS: " + awstime.format())
                var response = "";

                // If the lights were on inside the tolerance
                if (awstime - timestamp < MAX_DELAY_FOR_ON) {
                    response = "Valot ovat päällä";
                } else {
                    // If not send the last time they were on
                    timestamp.tz("Europe/Helsinki")
                    response = "Valot olivat viimeksi päällä klo " + timestamp.format('HH:mm DD.MM.')
                }
                console.log(response);
                bot.sendMessage(chat_id, response).then(function (data) {
                    context.succeed(data);
                })
                //context.succeed("Message handled")
            })

        } else {
            console.log("Unkown command: " + msg[0])
            bot.sendMessage(chat_id, "Unknown command: " + msg[0]).then(function (data) {
                context.succeed(data);
            })
        }
    }
    // Gets the last timestamp when the lights were on. Returns a Promise which resolves
    // after the value has been fetched from DynamoDB
    function getLastLights() {
        return new Promise(function (resolve, reject) {
            connection.connect(function (err, results) {
                if (err) {
                    console.error('Database connection failed: ' + err.stack);
                    reject('Database connection failed: ' + err.stack)
                } else {
                    console.log('Connected to database.');
                    connection.query('SELECT * FROM Valot WHERE data=1 ORDER BY timestamp DESC LIMIT 1', function (err, results, fields) {
                        if (err) {
                            console.error(err)
                            reject(err);
                        }
                        else {
                            console.log(results);
                            resolve(results);
                        }
                    });
                }
            });
        })


    }

}



