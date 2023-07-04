import { connect } from "mongoose";
import app from "./app";
import config from "./config";

//Database connection
const boostrap = async () => {
  try {
    await connect(config.database_url as string);
    console.log(`Database connection successful 😍`);

    app.listen(config.port, () => {
      console.log(`This server is running ${config.port}`);
    });
  } catch (err) {
    console.log("Error to DB connection ", err);
  }
};
boostrap();
