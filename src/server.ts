import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import express, { Application, NextFunction, Request, Response } from "express";
// import http, { Server } from "http";
// import { Server as SocketServer, Socket } from "socket.io";
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
    const userMassages = client.db("home-service-directory").collection("massage");


    //Validation with id
    async function isValid(id: string) {
      try {
        const query = { _id: new ObjectId(id.toString()) };
        const user = await usersDetails.findOne(query);
        if (user?.email) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    }



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
      const options = await usersDetails.find(query).limit(3).toArray();
      res.send(options);
    });



    // Recommended for you
    app.get("/recommendedForYou", async (req: Request, res: Response) => {
      try {
        const pipeline = [
          {
            $match: {
              rating: {
                $exists: true,
                $ne: "",
              },
              $expr: { $gte: [{ $toDouble: "$rating" }, 4.20] },
              role: { $in: ['Electrician', 'Plumber', 'Landscaper', 'Cleaner'] },
            },
          },
          {
            $sample: { size: 10 },
          },
        ];

        const recommendedUsers = await usersDetails.aggregate(pipeline).toArray();

        res.send(recommendedUsers);
      } catch (error) {
        console.error("Error fetching recommended users:", error);
        res.status(500).send("An error occurred while fetching recommended users.");
      }
    });


    // Most Popular Electrician
    app.get("/mostPopularElectrician", async (req: Request, res: Response) => {
      try {
        const pipeline = [
          {
            $match: {
              rating: {
                $exists: true,
                $ne: "",
              },
              $expr: { $gte: [{ $toDouble: "$rating" }, 4.50] },
              role: { $in: ['Electrician'] },
            },
          },
          {
            $sample: { size: 10 },
          },
        ];

        const recommendedUsers = await usersDetails.aggregate(pipeline).toArray();

        res.send(recommendedUsers);
      } catch (error) {
        console.error("Error fetching recommended users:", error);
        res.status(500).send("An error occurred while fetching recommended users.");
      }
    })

    //You may like
    app.get("/youMayLike", async (req: Request, res: Response) => {
      try {
        const pipeline = [
          {
            $match: {
              rating: {
                $exists: true,
                $ne: "",
              },
              $expr: { $gte: [{ $toDouble: "$rating" }, 4.60] },
              role: { $in: ['Electrician', 'Plumber', 'Landscaper', 'Cleaner'] },
            },
          },
          {
            $sample: { size: 8 },
          },
          {
            $sort: { rating: -1 }, // Sort by 'rating' field in descending order
          },
        ];

        const recommendedUsers = await usersDetails.aggregate(pipeline).toArray();

        res.send(recommendedUsers);
      } catch (error) {
        console.error("Error fetching recommended users:", error);
        res.status(500).send("An error occurred while fetching recommended users.");
      }
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


    //chat






    //server service put
    app.put('/serveService/:id', async (req: Request, res: Response) => {
      const id = req.params.id;
      const updateUser = req.body;

      const { _id, ...updateData } = updateUser;

      const query = { _id: new ObjectId(id.toString()) };
      const options = {
        projection: { _id: 0, email: 1 },
      };

      try {
        const user = await usersCollection.findOne(query, options);
        if (user?.email) {
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

    //server service get
    app.get('/serveService/:id', async (req: Request, res: Response) => {
      const id = req.params.id;

      try {
        const query = { _id: new ObjectId(id.toString()) };

        type UserProjection = {
          [key: string]: 1 | 0;
        };
        const projection: UserProjection = {
          firstName: 0,
          lastName: 0,
          email: 0,
          photoURL: 0,
          area: 1,
          cover1: 1,
          cover2: 1,
          descriptionAboutYou: 1,
          expecting1: 1,
          expecting2: 1,
          expecting3: 1,
          expertise1: 1,
          expertise2: 1,
          expertise3: 1,
          expertiseMain1: 1,
          expertiseMain2: 1,
          expertiseMain3: 1,
          jobDescription: 1,
          location: 1,
          title: 1,
        };

        const user = await usersDetails.findOne(query, projection);

        if (user) {
          res.send(user);
        } else {
          res.status(404).json({ message: 'User not found.' });
        }
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching user data.' });
      }
    });

    // update profile pic
    app.put('/updatePP/:id', async (req, res) => {
      const id = req.params.id;
      const imageUrl = req.body.img; // Corrected to req.body.img
      const query = { _id: new ObjectId(id.toString()) };

      // Corrected syntax for $set operator
      const updateResult = await usersCollection.updateOne(query, { $set: { photoURL: imageUrl } });

      res.send(updateResult);
      console.log(updateResult);
    });


    // Listen
    const server = app.listen(config.port, () =>
      console.log(`This application is running on port ${config.port}`)
    );


    //Chat
    // https://www.youtube.com/watch?v=fH8VIb8exdA&ab_channel=RoadsideCoder

    const io = require('socket.io')(server, {
      pingTimeout: 60000,
      cors: {
        origin: 'http://localhost:5173',
      }
    })

    io.on('connection', (socket) => {
      console.log('connected to socket.io')

      socket.on('setup', (userData) => {
        socket.join(userData.id);
        console.log(userData[0].id);
        socket.emit('connected');
      })

      socket.on('join chat', (room) => {
        socket.join(room);
        console.log('user joined room: ' + room);
      })

    })






  } catch (error) {
    console.log(error);
  }
}

run();
