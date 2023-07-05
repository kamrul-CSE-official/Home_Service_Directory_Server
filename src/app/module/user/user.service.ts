import { Collection, Db } from "mongodb";
import { db } from "../../../server";
// import { IUser } from "./user.interface";
// import User from "./user.model";

/*
//user create
export async function createUserToDB(payload: IUser): Promise<IUser> {
  const user = new User(payload);
  await user.save();
  return user;
}
*/

//get all user
export const getUserFromDb = async () => {
  console.log("getUserFromDB called");
  console.log("DB: ", db);

  const collection: Collection = db.collection("users"); // Specify the collection name

  const users = await collection.find().toArray();
  console.log("USERS: ", users);
  return users;
};
// export const getUsersFormDB = async (): Promise<IUser[]> => {
//   const users = await User.find();
//   return users;
// };

/*
//get user by id
export const getuserByIdFromDB = async (
  payload: string
): Promise<IUser | null> => {
  const user = await User.findOne(
    { id: payload },
    { name: 1, contactNumber: 1 }
  );

  return user;
};
*/

//get all user Test
export const getUserFromDbTest = async (database: Db) => {
  const collection: Collection = database.collection("users"); // Specify the collection name

  const users = await collection.find().toArray();
  console.log("TEST: ", users);
  return users;
};
