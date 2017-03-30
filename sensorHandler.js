"use strict"

var doc = require('dynamodb-doc');
var dynamodb = new doc.DynamoDB();

var created = false;

exports.handler = function (event, context, callback) {

    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    let body = event["body-json"];
    var item = {
        "device": body.device,
        "timestamp": 0
    };


    if ("lights" in body) {
        item.lights = body.lights;
    } else if ("coffeeBrew" in body) {
        item.coffee = body.coffeeBrew;
    } else {
        context.fail('ERROR: Datatype unknown');
    }

    let timestamp = 0;

    if ("time" in body) {
        timestamp = new Date(body.time);
        item.timestamp = timestamp.getTime();

    } else {
        timestamp = new Date();
        item.
        timestamp = timestamp.getTime();
    }
    // Set the name YYYY-MM
    var tableName = timestamp.getFullYear() + "-" + ("0" + (timestamp.getMonth() + 1)).slice(-2);
    console.log("Item:\n", item);

    checkForTable(tableName);

    var i = setInterval(function () {
        if (created) {
            console.log("Putting item to: " + tableName);
            dynamodb.putItem({
                TableName: tableName,
                Item: item
            }, function (err, data) {
                if (err) {
                    clearInterval(i);
                    context.fail('ERROR: Dynamo failed: ' + err);
                } else {
                    console.log('Dynamo Success: ' + JSON.stringify(data, null, '  '));
                    clearInterval(i);
                    context.succeed('SUCCESS');
                }
            });
        } else {
            checkForTableStatus(tableName);
        }

    }, 500);

}

function checkForTable(name) {
    var params = {};
    dynamodb.listTables(params, function (err, data) {
        if (err) console.log(err); // an error occurred
        else {
            console.log(data);
            if (data.TableNames.indexOf(name) != -1) {
                created = true;
                return true;
            } else {
                console.log("Creating table: " + name);
                createTable(name);
            }
        }
    });
}

function checkForTableStatus(name) {
    var params = {
        TableName: name
    };
    dynamodb.describeTable(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log(data);           // successful response
            if (data.Table.TableStatus == 'ACTIVE') {
                created = true;
            }
            else return false;
        }
    });

}

function createTable(name) {
    var params = {
        TableName: name,
        KeySchema: [ // The type of of schema.  Must start with a HASH type, with an optional second RANGE.
            { // Required HASH type attribute
                AttributeName: 'device',
                KeyType: 'HASH'
            },
            { // Optional RANGE key type for HASH + RANGE tables
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
            }
        ],
        AttributeDefinitions: [ // The names and types of all primary and index key attributes only
            {
                AttributeName: 'device',
                AttributeType: 'S', // (S | N | B) for string, number, binary
            },
            {
                AttributeName: 'timestamp',
                AttributeType: 'N', // (S | N | B) for string, number, binary
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    };
    dynamodb.createTable(params, function (err, data) {
        if (err) {
            console.log(err); // an error occurred
            return false;
        }
        else {
            console.log(data); // successful response
            return true;
        }
    });
}

