const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const multer = require("multer");
const nodemailer = require("nodemailer");

const Admin = require("./models/Admin");
const Student = require("./models/Student");
const Request = require("./models/Request");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB Connected"))
  .catch(err=>console.log(err));

/* ================= EMAIL SETUP ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= FILE UPLOAD ================= */

const storage = multer.diskStorage({
  destination:"uploads/",
  filename:(req,file,cb)=>{
    cb(null,Date.now()+"-"+file.originalname);
  }
});
const upload = multer({storage});

/* ================= ADMIN ================= */

// LOGIN
app.post("/api/admin/login", async(req,res)=>{
  const {email,password}=req.body;
  const admin=await Admin.findOne({email,password});
  if(!admin) return res.status(401).json({message:"Invalid"});
  res.json({message:"Login Success"});
});

// GET ALL REQUESTS
app.get("/api/admin/requests", async(req,res)=>{
  const data=await Request.find().sort({createdAt:-1});
  res.json(data);
});

// GET SINGLE REQUEST
app.get("/api/admin/request/:id", async(req,res)=>{
  const r=await Request.findById(req.params.id);
  res.json(r);
});

// REJECT REQUEST
app.put("/api/admin/reject/:id", async(req,res)=>{
  const {reason}=req.body;

  const r=await Request.findByIdAndUpdate(
    req.params.id,
    {status:"Rejected",rejectionReason:reason},
    {new:true}
  );

  // SEND EMAIL ONLY IF STUDENT EMAIL EXISTS
  if(r && r.email){
    await transporter.sendMail({
      to:r.email,
      subject:"Certificate Request Rejected",
      text:`Reason: ${reason}`
    });
  }

  res.json({message:"Rejected"});
});

// ACCEPT HARD COPY → SEND POSTED EMAIL ONLY
app.put("/api/admin/accept-hard/:id", async(req,res)=>{

  const r=await Request.findByIdAndUpdate(
    req.params.id,
    {status:"Posted"},
    {new:true}
  );

  if(r && r.email){
    await transporter.sendMail({
      to:r.email,
      subject:"Certificate Posted",
      text:"Your certificate has been posted successfully."
    });
  }

  res.json({message:"Posted email sent"});
});

// ACCEPT SOFT COPY → UPLOAD FILE + EMAIL
app.post("/api/admin/upload/:id",upload.single("file"),async(req,res)=>{

  const r=await Request.findByIdAndUpdate(
    req.params.id,
    {status:"Completed",filePath:req.file?.path},
    {new:true}
  );

  if(r && r.email && req.file){
    await transporter.sendMail({
      to:r.email,
      subject:"Certificate Attached",
      text:"Your certificate attached.",
      attachments:[{path:req.file.path}]
    });
  }

  res.json({message:"File sent"});
});

/* ================= STUDENT ================= */

// LOGIN
app.post("/api/students/login", async(req,res)=>{
  const {usn,password}=req.body;
  let s=await Student.findOne({usn});
  if(!s) s=await Student.create({usn,password});
  if(s.password!==password)
    return res.status(401).json({message:"Invalid"});
  res.json({message:"Login success",student:s});
});

// UPDATE PROFILE
app.put("/api/students/profile/:usn", async(req,res)=>{
  await Student.findOneAndUpdate({usn:req.params.usn},req.body);
  res.json({message:"Profile updated"});
});

// CREATE REQUEST
app.post("/api/students/request", async(req,res)=>{

  const r=await Request.create(req.body);

  // SEND EMAIL TO ADMIN ONLY IF EXISTS
  if(process.env.ADMIN_EMAIL){
    await transporter.sendMail({
      to:process.env.ADMIN_EMAIL,
      subject:"New Certificate Request",
      text:`New request from ${r.name || "Unknown"} (${r.usn || ""})`
    });
  }

  res.json({message:"Submitted"});
});

app.listen(process.env.PORT,()=>console.log("Server running"));
