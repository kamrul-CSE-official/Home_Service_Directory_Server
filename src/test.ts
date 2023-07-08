// test.ts
import { Request, Response } from "express";
import { usersDetails } from "./server";

async function test(req: Request, res: Response) {
  try {
    const query = {};
    const options = await usersDetails.find(query).toArray();
    console.log("TEST::", options);
    res.send(options);
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to fetch user details from the database.");
  }
}

export default test;
