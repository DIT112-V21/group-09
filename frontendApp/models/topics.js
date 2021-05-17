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


  const Topics = db.define("topics", {
    id: {
    type: DataTypes.TEXT,
    primaryKey: true
    
    },
    name: DataTypes.TEXT,
    url: DataTypes.TEXT,    
    status: DataTypes.JSON
    /*,
    userid: {
        type: DataTypes.TEXT,
        primaryKey: true
        }
    */
  })

  Topics.sync().then(() => {
    return Topics.create({
      id: "56A",
      name: "throttle",
      url: "topics/throttle",    //map or table
      status: "subscribed"
        /*,
        userid: {
            type: DataTypes.TEXT,
            primaryKey: true
            },
       */
    });
}); 



  module.exports= Topics; 

  Topics.findAll({
      attributes:["id", "name", "url", "status"]
    }
  )
  .then(Topics=>
    {
        console.log(Topics);


    })
  .catch(err=>console.log(err));

