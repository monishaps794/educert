import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";

export default function StudentProfile(){

const navigate = useNavigate();
const location = useLocation();

const usnFromLogin = location.state?.usn || localStorage.getItem("studentUSN") || "";

const[form,setForm]=useState({
name:"",
usn:usnFromLogin,
branch:"",
yearOfPassing:"",
email:"",
address:""
});

const submitProfile=async()=>{

if(!form.name||!form.usn||!form.branch||!form.yearOfPassing||!form.email||!form.address){
alert("All fields are required");
return;
}

await API.put(`/students/profile/${form.usn}`,form);
localStorage.setItem("studentProfile",JSON.stringify(form));
alert("Profile Updated Successfully");
navigate("/student/home",{state:{usn:form.usn}});
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
width:"420px",
boxShadow:"0 15px 35px rgba(0,0,0,0.25)",
textAlign:"center"
}}>

<h2 style={{color:"#4f46e5"}}>Student Profile</h2>

{Object.keys(form).map(key=>(
<input
key={key}
placeholder={key}
value={form[key]}
onChange={e=>setForm({...form,[key]:e.target.value})}
style={{
width:"100%",
padding:"12px",
marginTop:"12px",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>
))}

<button
onClick={submitProfile}
style={{
marginTop:"25px",
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
Submit
</button>

</div>
</div>
);
}
