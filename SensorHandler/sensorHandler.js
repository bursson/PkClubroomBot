"use strict"


var mysql = require('mysql');


exports.handler = function (event, context, callback) {

    var connection = mysql.createConnection({
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT,
        database: "pkaula"
    });


    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    let body = event["body-json"];
    var item = {
        "device": body.device,
        "timestamp": 0
    };


    if ("lights" in body) {
        item.lights = (body.lights == 'true' || body.lights == 1);
    } else if ("coffeeBrew" in body) {
        item.coffee = body.coffeeBrew;
    } else {
        context.fail('ERROR: Datatype unknown');
    }

    let timestamp;

    // Timestamping done in AWS because Onion timestamps were unreliable
    timestamp = new Date();
    item.timestamp = timestamp.getTime();

    // Generate the correct tablename (YYYY-MM), January is 00

    console.log("Item:\n", item);
    connection.connect(function (err) {
        if (err) {
            console.error('Database connection failed: ' + err.stack);
            return;
        } else {
            console.log('Connected to database.');
            createTable("Valot", [['device', 'VARCHAR(255)'], ['timestamp', 'BIGINT'], ['datatype', 'VARCHAR(255)'], ['data', 'BOOLEAN']]).then(function (data) {
                insertRow("Valot", [['device', item.device],['timestamp',item.timestamp],['datatype','lights'],['data', item.lights]]).then(function(data){
                    connection.end()
                    context.succeed(data);
                })
            });
        }
    });
    
    // Create a table with tableName with fields, fields format: [[fieldname, fieldtype],[fieldname, fieldtype]]
    var createTable = function (tableName, fields) {
        return new Promise(function (resolve, reject) {
            //console.log(fields);
            var sqlraw = ['CREATE TABLE IF NOT EXISTS ', tableName, ' ('];
            fields.forEach(function (element) {
                //console.log(element)
                sqlraw.push(element[0]);
                sqlraw.push(' ');
                sqlraw.push(element[1]);
                sqlraw.push(',');
            }, this);
            sqlraw[sqlraw.length - 1] = ')';
            //console.log(sqlraw);
            var sql = sqlraw.join("");
            connection.query(sql, function (err, results, fields) {
                if (err) {
                    console.error(err)
                    reject(err);
                }
                else {
                    console.log(results);
                    resolve(results)
                }
            });
        })
    }
    // Insert a row to a table, fields format: [[fieldname, fieldvalue],[fieldname, fieldvalue]]
    var insertRow = function(tableName, fields) {
        return new Promise(function (resolve, reject) {
            //console.log(fields);
            var sqlraw = ['INSERT INTO ', tableName, ' ('];
            var values = [];
            fields.forEach(function (element) {
                sqlraw.push(element[0]);
                sqlraw.push(', ');
                values.push(element[1]);
            }, this);
            sqlraw[sqlraw.length - 1] = ')';
            sqlraw.push(' VALUES (');
            fields.forEach(function(element){
                sqlraw.push('?,')
            })
            sqlraw[sqlraw.length - 1] = '?)';
            //console.log(sqlraw);
            var sql = sqlraw.join("");
            //console.log(sql)
            connection.query(sql, values, function (err, results, fields) {
                if (err) {
                    console.error(err)
                    reject(err);
                }
                else {
                    console.log(results);
                    resolve(results)
                }
            });
        })
    }
}

