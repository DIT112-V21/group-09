let config = require('electron-node-config');
let dbConfig = config.get('database.dbConfig');
const {Connection}= require ('postgresql-client')
const {Client}= require('pg')
const client = new Client({
    
            host: dbConfig.host,
			port: dbConfig.port,
			database: dbConfig.dbName,
			user: dbConfig.dbUser,
			password: dbConfig.dbPassword
    
})

execute()

async function execute(){
try{


    await client.connect()
    console.log("Connect successfuly")
    const results= await client.query("select * from public.missions")
    console.table(results.rows)
   
    
}
catch{
    console.log("Error")
}
finally{
await client.end()
console.log("disconnected")
}

}

