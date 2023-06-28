import express, { Application } from "express";
import cors from "cors";
import userRouter from "./app/module/user/user.route";

const app: Application = express();

//middle ware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
// app.get("/", (req: Request, res: Response, next: NextFunction) => {
//   res.send("Bismillah");
//   next();
// });

export default app;
