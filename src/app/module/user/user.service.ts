import { IUser } from "./user.interface";
import User from "./user.model";

//user create
export async function createUserToDB(payload: IUser): Promise<IUser> {
  const user = new User(payload);
  await user.save();
  return user;
}

//get all user
export const getUsersFormDB = async (): Promise<IUser[]> => {
  const users = await User.find();
  return users;
};

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
