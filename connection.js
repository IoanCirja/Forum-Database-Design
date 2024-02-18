const mysql = require('mysql');

var con = mysql.createConnection(
    {
        host:"localhost",
        user:"root",
        password:"Twins020406!",
        database:"forum",
    }
)
con.connect(function(err){
    if(err) throw err;
    console.log("We connected to DB!");
})


module.exports = con