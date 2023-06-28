import { connect } from "mongoose";
import app from "./app";

const port: number = 5000;

//Database connection
const databaseConnection = async () => {
  try {
    await connect("mongodb://127.0.0.1:27017/Home-Service-Directory");
    console.log(`Database connection successful 😍`);
  } catch (err) {
    console.log("Error to DB connection ", err);
  }
};
databaseConnection();

app.listen(port, () => {
  console.log(`This server is running ${port}`);
});

//https://web.programming-hero.com/level2-batch-1/video/level2-batch-1-6-5-create-model-using-interface-schema-and-insert-data-
