import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
import app from "./app";
import config from "./config";
import { getUserFromDbTest } from "./app/module/user/user.service";

let db: Db;
let collection: Collection;

// Database connection
const bootstrap = async () => {
  try {
    const options: MongoClientOptions = {
      // Add any desired options here
    };

    const client = new MongoClient(config.database_url as string, options);

    await client.connect();
    console.log("Database connected! 😍");

    db = client.db("home-service-directory"); // Specify the database name
    collection = db.collection("users"); // Specify the collection name

    const users = await collection.find().toArray();
    console.log("USERS: ", users);

    app.listen(config.port, () => {
      console.log(`This application is running on port ${config.port} 🏃`);
    });

    client.close();
  } catch (err) {
    console.log("Error connecting to the database:", err);
  }
};

bootstrap();

export { db, collection }; // Export the db and collection objects
