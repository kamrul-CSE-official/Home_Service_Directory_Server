import express, { Application } from "express";
import cors from "cors";
import userRouter from "./app/module/user/user.route";

const app: Application = express();

//middle ware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);

export default app;
