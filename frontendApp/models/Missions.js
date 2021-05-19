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


  const Missions = db.define("missions", {
    id: {
    type: DataTypes.TEXT,
    primaryKey: true
    },
    name: DataTypes.TEXT,
    source: DataTypes.TEXT,    //map or table
    average_speed: 
    {
    type: DataTypes.INTEGER,
    defaultValue: 20

    },
    content: DataTypes.JSON
    /*,
    userid: {
        type: DataTypes.TEXT,
        primaryKey: true
        },
   
    
    */

  })


  Missions.sync().then(() => {
    return Missions.create({
      id: "56f",
      name: "A",
      source: "map",    //map or table
      average_speed: 20,
      content: {
       
      }
        /*,
        userid: {
            type: DataTypes.TEXT,
            primaryKey: true
            },
       */
    });
}); 

 // module.exports= Missions; 

  Missions.findAll({
    attributes:["id", "name", "source", "average_speed", "content"]
  })
  .then(Missions=>
    {
        console.log(Missions);


    })
  .catch(err=>console.log(err));




  