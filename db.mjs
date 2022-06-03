import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

export default await MongoClient.connect(process.env.MONGO_URI)
