const mysql = require('mysql');

module.exports = mysql.createPool({
    connectionLimit: 100, //important for ddos
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'rootroot',
    database: 'hypertube'
});