import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connection } from "./src/config/redis.js";
import { emailWorker } from "./src/worker/email.worker.js";

const app = express();
app.use(cors());
app.use(express.json());
connection;
emailWorker;

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:5001`);
});
