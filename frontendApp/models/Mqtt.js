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


  const Servers = db.define("servers", {
    id: {
    type: DataTypes.TEXT,
    primaryKey: true
    },
    userName: DataTypes.TEXT,
    url: DataTypes.TEXT,    //map or table
    status: DataTypes.JSON
    /*,
    userid: {
        type: DataTypes.TEXT,
        primaryKey: true
        },
   
    
    */


  })

  Servers.sync().then(() => {
    return Servers.create({
      serverID: "56f",
      userName: "A",
      url: "map",    //map or table
      average_speed: 20,
      status: "pending"
        /*,
        userid: {
            type: DataTypes.TEXT,
            primaryKey: true
            },
       */
    });
}); 



  module.exports= Servers; 

  Servers.findAll({
      attributes:["serverID", "userName", "url", "status"]
    }
  )
  .then(Servers=>
    {
        console.log(Servers);


    })
  .catch(err=>console.log(err));

