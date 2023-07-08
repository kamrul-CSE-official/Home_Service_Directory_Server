import express, { Application } from "express";
import cors from "cors";
import userRouter from "./app/module/user/user.route";
import test from "./test";

const app: Application = express();

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/api/v1/user", userRouter);
app.get("/api/v1/user", test);

export default app;
