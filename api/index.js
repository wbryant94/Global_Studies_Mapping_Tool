import express from 'express'
import resourceRoutes from './routes/resources.mjs' 
import authRoutes from './routes/auth.mjs'
import cookieParser from 'cookie-parser';
import cors from "cors"
import multer from "multer";

const app = express()
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));


/* const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../client/public/upload");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({ storage });



app.post("/api/upload", upload.single("file"), function (req, res) {
  const file = req.file;
  res.status(200).json(file.filename);
});

 */

app.use("/api/resources", resourceRoutes) 
app.use("/api/auth", authRoutes);



app.listen(8800, ()=>{
    console.log('connected')
})
