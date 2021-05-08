
const {Connection}= require ('postgresql-client')
const {Client}= require('pg')
const client = new Client({
	user: "altansuk_group9",
	password: 'SmartRover',
	host: 'altansukh.com',
	port: 5432,
	database: 'altansuk_rover'

})

execute()

async function execute(){
try{


    await client.connect()
    
    //connection test
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

