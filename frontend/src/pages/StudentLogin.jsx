import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function StudentLogin(){

const navigate = useNavigate();

const [usn,setUsn]=useState("");
const [password,setPassword]=useState("");

const login = async()=>{
try{
const res = await API.post("/students/login",{usn,password});
alert(res.data.message);
localStorage.setItem("studentUSN",usn);
navigate("/student/profile",{state:{usn}});
}
catch{
alert("Invalid USN or Password");
}
};

return(

<div style={{
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"linear-gradient(135deg,#4f46e5,#06b6d4)"
}}>

<div style={{
background:"white",
padding:"40px",
borderRadius:"14px",
width:"340px",
textAlign:"center",
boxShadow:"0 15px 35px rgba(0,0,0,0.25)"
}}>

<h1 style={{fontWeight:"bold",color:"#4f46e5"}}>
WELCOME TO CERTONE
</h1>

<h3 style={{marginBottom:"25px"}}>Student Login</h3>

<input
placeholder="USN"
value={usn}
onChange={(e)=>setUsn(e.target.value)}
style={{
width:"100%",
padding:"12px",
marginBottom:"15px",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

<input
type="password"
placeholder="Password (DOB)"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{
width:"100%",
padding:"12px",
marginBottom:"20px",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

<button
onClick={login}
style={{
width:"100%",
padding:"12px",
background:"#4f46e5",
color:"white",
border:"none",
borderRadius:"8px",
fontSize:"16px",
cursor:"pointer"
}}
>
Login
</button>

</div>
</div>

);
}
