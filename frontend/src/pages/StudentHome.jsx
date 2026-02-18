import { useState } from "react";
import API from "../api";

export default function StudentHome(){

const profile=JSON.parse(localStorage.getItem("studentProfile"));

const[form,setForm]=useState({
certificate:"",
reason:"",
documentType:"",
copies:1,
others:""
});

const submitRequest=async()=>{

if(!profile){
alert("Profile not loaded. Please login again.");
return;
}

const fullData={...profile,...form};
await API.post("/students/request",fullData);
alert("Application Submitted Successfully");

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
width:"500px",
boxShadow:"0 15px 35px rgba(0,0,0,0.25)",
textAlign:"center"
}}>

<h2 style={{color:"#4f46e5"}}>Certificate Request</h2>

<select style={{width:"100%",padding:"12px",marginTop:"15px"}}
onChange={e=>setForm({...form,certificate:e.target.value})}>
<option>Select Certificate</option>
<option>Duplicate Marks Card</option>
<option>Transcript</option>
<option>Course Complete Certificate</option>
<option>Grade Correction</option>
<option>No Backlog Certificate</option>
<option>Backlog Summary Certificate</option>
<option>Grade to Percentage Conversion Certificate</option>
</select>

<textarea style={{width:"100%",padding:"12px",marginTop:"15px"}}
placeholder="Reason"
onChange={e=>setForm({...form,reason:e.target.value})}/>

<select style={{width:"100%",padding:"12px",marginTop:"15px"}}
onChange={e=>setForm({...form,documentType:e.target.value})}>
<option>Hardcopy</option>
<option>Softcopy</option>
<option>Hardcopy + Softcopy</option>
</select>

<select style={{width:"100%",padding:"12px",marginTop:"15px"}}
onChange={e=>setForm({...form,copies:e.target.value})}>
<option>1</option>
<option>2</option>
<option>3</option>
</select>

<textarea style={{width:"100%",padding:"12px",marginTop:"15px"}}
placeholder="Others"
onChange={e=>setForm({...form,others:e.target.value})}/>

<button
onClick={submitRequest}
style={{
marginTop:"20px",
width:"100%",
padding:"12px",
background:"#4f46e5",
color:"white",
border:"none",
borderRadius:"8px",
fontSize:"16px",
cursor:"pointer"
}}>
Make Payment & Submit
</button>

</div>
</div>
);
}
