import { MongoClient, ObjectID, ObjectId, ServerApiVersion } from "mongodb";
import express, { Application, NextFunction, Request, Response } from "express";
import http, { Server } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import * as admin from "firebase-admin";
import * as serviceAccount from "../home-service-derectory-firebase-adminsdk-84yuo-9645810360.json";

import cors from "cors";
import config from "./config";
import CustomRequest from "./types";

const app: Application = express();

// Firebase admin initialization
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

// Middleware
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

async function verifyToken(req: CustomRequest, res: Response, next: NextFunction) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      if (decodedUser?.email) {
        req.decodedUserEmail = decodedUser.email;
        next();
      } else {
        res.status(401).json({ message: 'User email not found in decoded token.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error verifying token.' });
    }
  } else {
    res.status(401).json({ message: 'Authorization header not found or invalid.' });
  }
}




async function run() {
  try {
    await client.connect();

    const usersDetails = client
      .db("home-service-directory")
      .collection("users");

    const usersCollection = client.db("home-service-directory").collection("users");


    app.get('/user', verifyToken, async (req: CustomRequest, res: Response) => {
      const email = req.query.email as string;
      if (req.decodedUserEmail === email) {
        const query: any = { email: email };
        const cursor = usersCollection.find(query);
        const user = await cursor.toArray();
        res.json(user);
      } else {
        res.status(401).json({ message: 'User not authorized!' });
      }
    });

    app.get("/users", async (req: Request, res: Response) => {
      const query = {};
      const options = await usersDetails.find(query).toArray();
      res.send(options);
    });

    //SignUp
    app.post("/signUp", async (req: Request, res: Response) => {
      const userExistsQuery = { email: req.body.email };
      const cursor = usersCollection.find(userExistsQuery);
      const user = await cursor.toArray();
      if (user.length === 0) {
        // User not found, proceed with sign-up logic
        const signUpData = req.body;
        console.log(signUpData);
        const result = await usersCollection.insertOne(signUpData);
        res.send(result);
      } else {
        console.log('This user already exists.');
        // You might want to send a response indicating that the user already exists.
        res.status(409).json({ message: 'User already exists.' });
      }
    });



    //server service
    app.put('/serveService/:id', async (req: Request, res: Response) => {
      const id = req.params.id;
      const updateUser = req.body;

      // Exclude the _id field from the updateUser object
      const { _id, ...updateData } = updateUser;

      const query = { _id: new ObjectId(id.toString()) };
      const options = {
        projection: { _id: 0, email: 1 },
      };

      try {
        const user = await usersCollection.findOne(query, options);
        if (user?.email) {
          // Merge the existing user data with the updateData
          const mergedData = { ...user, ...updateData };

          const updateResult = await usersCollection.updateOne(query, { $set: mergedData });

          if (updateResult.modifiedCount === 1) {
            console.log('Data updated successfully:', updateResult);
            res.send(mergedData); // Send the merged data in the response
          } else {
            console.log('Data update failed.');
            res.status(500).json({ message: 'Data update failed.' });
          }

        } else {
          console.log('No match found for the given id:', id);
          res.status(404).json({ message: 'No match found for the given id.' });
        }
      } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: 'Error updating data.' });
      }
    });


    // Listen
    app.listen(config.port, () =>
      console.log(`This application is running on port ${config.port}`)
    );
  } catch (error) {
    console.log(error);
  }
}

run();
