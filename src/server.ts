import { MongoClient, MongoClientOptions } from "mongodb";
import app from "./app";
import config from "./config";

// Database connection
const bootstrap = async () => {
  try {
    const options: MongoClientOptions = {
      // Add any desired options here
    };

    const client = new MongoClient(config.database_url as string, options);

    await client.connect();
    console.log("Database connected!😍");

    app.listen(config.port, () => {
      console.log(`This application is running on port ${config.port} 🏃`);
    });

    client.close();
  } catch (err) {
    console.log("Error connecting to the database:", err);
  }
};

bootstrap();
