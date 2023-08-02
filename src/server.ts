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
    const userState = client.db("home-service-directory").collection("notification");


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


    //Set Message Notifation
    async function massageState(senderId: string, receiverId: string) {
      const query = { for: receiverId };
      const existingDocument = await userState.findOne(query);

      if (!existingDocument) {
        // If there is no document for the receiverId, create a new one.
        const newMessageNotification = {
          for: receiverId,
          data: [{ senderId: senderId, receiverId: receiverId, massageState: 1 }],
        };
        await userState.insertOne(newMessageNotification);
      } else {
        // If the document exists, check if there is a matching senderId and receiverId in the data array.
        const dataMatchIndex = existingDocument.data.findIndex(
          item => item.senderId === senderId && item.receiverId === receiverId
        );

        if (dataMatchIndex !== -1) {
          // If there is a match, increment the state by 1 for the matching senderId and receiverId.
          await userState.updateOne(
            { _id: existingDocument._id, 'data.senderId': senderId, 'data.receiverId': receiverId },
            { $inc: { 'data.$.massageState': 1 } }
          );
        } else {
          // If there is no match, add a new entry to the data array with state = 1.
          await userState.updateOne(
            { _id: existingDocument._id },
            { $push: { data: { senderId: senderId, receiverId: receiverId, massageState: 1 } } }
          );
        }
      }
    }
    //Get Message Notifation
    app.get('/massageNotifationGet', async (req: Request, res: Response) => {
      async function sumMessageStates(receiverId: string): Promise<number> {
        const query = { for: receiverId };
        const document = await userState.findOne(query);

        if (!document) {
          return 0; // Return 0 if the document doesn't exist
        }

        // Use MongoDB aggregation pipeline to sum the massageState values in the data array
        const sumResult = await userState.aggregate([
          { $match: { for: receiverId } },
          { $unwind: '$data' },
          { $group: { _id: '$_id', totalState: { $sum: '$data.massageState' } } }
        ]).toArray();

        if (sumResult.length === 0) {
          return 0; // Return 0 if the data array is empty
        }

        return sumResult[0].totalState;
      };
      const { id } = req.query;
      if (await isValid(id as string)) {
        const totalState = await sumMessageStates(id as string);
        res.status(200).json(totalState);
      };
    });




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









    //chat post
    app.post('/chat', async (req: Request, res: Response) => {
      try {
        const { sender, recever, message, time, date } = req.body;
        if (await isValid(sender) && await isValid(recever)) {
          const chat = {
            message: message,
            time: time,
            date: date,
            send: sender
          }
          // Assuming 'userMassages' is your MongoDB collection
          const query = { sender, recever };
          const existingDocument = await userMassages.findOne(query);

          if (!existingDocument) {
            // If conversation doesn't exist, create a new one with the first message
            const newConversation = {
              sender,
              recever,
              message: [chat],
            };
            // Insert the new conversation into the collection
            await userMassages.insertOne(newConversation);
            massageState(sender, recever);

          } else {
            // If conversation already exists, push the new message to the 'message' array
            existingDocument.message.push(chat);

            // Update the document with the new message
            await userMassages.updateOne(query, { $set: { message: existingDocument.message } });
            massageState(sender, recever);
          }
          res.status(200).json({ message: 'New message added successfully' });
        }

      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred' });
      }
    });
    //Get single chat throw id's
    app.get('/chat', async (req: Request, res: Response) => {
      try {
        const { sender, recever } = req.query;
        // Find chat messages where both sender and receiver match the provided IDs
        const query = {
          $or: [
            { sender, recever },
            { sender: recever, recever: sender },
          ],
        };

        const chatMessages = await userMassages.find(query).toArray();
        res.status(200).json(chatMessages);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred' });
      }
    });


    //get user name, id, img
    async function Connector(id: string) {
      try {
        // const { id } = req.query;

        if (await isValid(id as string)) {
          const query = { _id: new ObjectId(id as string) };

          // Use generic version of findOne to specify the return type explicitly
          const userInfo = await usersDetails.findOne<{ firstName: string; lastName: string; email: string; photoURL: string, id: string }>(query);

          if (userInfo) {
            const user = { name: `${userInfo.firstName} ${userInfo.lastName}`, photoURL: userInfo.photoURL, id: id };
            return user;
            // res.json(user);
          } else {
            // res.status(404).send('User not found');
          }
        } else {
          // res.status(404).send('Invalid user ID');
        }
      } catch (err) {
        console.log('Error: ', err);
        // res.status(500).send('Internal server error');
      }

    }


    //Get all chat throw users id's
    app.get('/allConnectors', async (req: Request, res: Response) => {
      try {
        const { id } = req.query;
        const userID = id as string;

        if (await isValid(userID)) {
          const query = { $or: [{ sender: userID }, { receiver: userID }] };
          const userChatMessages = await userMassages.find(query).toArray();

          let info: {
            name: string;
            photoURL: string;
            id: string;
          }[] = [];

          for (let i = 0; i < userChatMessages.length; i++) {
            if (userID !== userChatMessages[i]?.sender) {
              const data: {
                name: string;
                photoURL: string;
                id: string;
              } | undefined = await Connector(userChatMessages[i]?.sender);

              if (data !== undefined) {
                console.log(data);
                info.push(data);
              }
            }

            if (userID !== userChatMessages[i]?.recever) {
              const data: {
                name: string;
                photoURL: string;
                id: string;
              } | undefined = await Connector(userChatMessages[i]?.recever);

              if (data !== undefined) {
                info.push(data);
              }
            }
          }
          res.send(info);
        } else {
          res.status(404).send('User not found...');
        }
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
      } finally {

        // client.close();
      }
    });








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
