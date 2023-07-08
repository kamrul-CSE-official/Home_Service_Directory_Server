import { MongoClient, ServerApiVersion } from "mongodb";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";

const app: Application = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new MongoClient(config.database_url as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

client.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    const usersDetails = client
      .db("home-service-directory")
      .collection("users");

    app.get("/users", async (req: Request, res: Response) => {
      const query = {};
      const options = await usersDetails.find(query).toArray();
      res.send(options);
    });
  }
});

app.listen(config.port, () =>
  console.log(`This application runing ${config.port}`)
);
