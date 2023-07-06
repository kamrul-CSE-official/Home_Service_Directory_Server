import { Request, Response, NextFunction } from "express";
// import { createUserToDB, getUserFromDb,  getuserByIdFromDB,} from "./user.service";
import { getUserFromDb } from "./user.service";
/*
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;

  const user = await createUserToDB(data);
  res.status(200).json({
    status: "Success",
    data: user,
  });
};
*/
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const query = {};
  // const options = await databaseAndCollections().usersDetails

  res.status(200).json({
    status: "success",
    // data: users,
  });
};

/*
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const users = await getuserByIdFromDB(id);

  res.status(200).json({
    status: "success",
    data: users,
  });
};
*/
