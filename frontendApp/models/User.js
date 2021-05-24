//should be capital 
let config = require('electron-node-config');
let dbConfig = config.get('database.dbConfig');
const { Sequelize, Model, DataTypes  } = require('sequelize');



const db = new Sequelize(dbConfig.dbName, dbConfig.dbUser, dbConfig.dbPassword, {
    host: dbConfig.host,
    dialect: 'postgres' 
  });
execute();
  async function execute(){
  try {
    await db.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  }


  const Users = db.define("users", {
    userID: {
    type: DataTypes.TEXT,
    primaryKey: true
    },
    userName: DataTypes.TEXT,
    /*,
    missionID: {
        type: DataTypes.TEXT,
        primaryKey: true
        }
    
    */

  })

  module.exports= Users; 

  Users.findAll({
      attributes:["userID", "userName"]
    }
  )
  .then(Users=>
    {
        console.log(Users);
    })
  .catch(err=>console.log(err));
/*
printUser();
async function printUser() {
const jane = await Users.create({ userName: "Jane" });
console.log("Jane's auto-generated ID:", jane.id);
}
*/