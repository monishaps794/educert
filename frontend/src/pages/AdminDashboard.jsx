import { useEffect,useState } from "react";
import API from "../api";

export default function AdminDashboard(){

const[requests,setRequests]=useState([]);
const[selected,setSelected]=useState(null);

useEffect(()=>{
API.get("/admin/requests").then(r=>setRequests(r.data));
},[]);

/* ================= DETAILS PAGE ================= */

if(selected){
return(

<div style={{padding:"40px",minHeight:"100vh",
background:"linear-gradient(135deg,#4f46e5,#06b6d4)"}}>

<div style={{
background:"white",
padding:"30px",
borderRadius:"12px",
boxShadow:"0 10px 25px rgba(0,0,0,0.2)",
maxWidth:"650px",
margin:"auto"
}}>

<h2 style={{color:"#4f46e5"}}>Request Details</h2>

<p><b>Name:</b> {selected.name}</p>
<p><b>USN:</b> {selected.usn}</p>
<p><b>Branch:</b> {selected.branch}</p>
<p><b>Year:</b> {selected.yearOfPassing}</p>
<p><b>Email:</b> {selected.email}</p>
<p><b>Address:</b> {selected.address}</p>

<p><b>Certificate:</b> {selected.certificate}</p>
<p><b>Document Type:</b> {selected.documentType}</p>
<p><b>No of Copies:</b> {selected.copies}</p>
<p><b>Status:</b> {selected.status}</p>

<br/>

{/* HARD COPY → EMAIL POSTED */}

{selected.documentType==="Hardcopy" ? (

<button
onClick={async()=>{
await API.put(`/admin/accept-hard/${selected._id}`);
alert("Posted email sent");
window.location.reload();
}}
style={{
padding:"10px 20px",
background:"#10b981",
color:"white",
border:"none",
borderRadius:"6px",
marginRight:"10px",
cursor:"pointer"
}}
>
Confirm Posted
</button>

):( 

<form onSubmit={async(e)=>{
e.preventDefault();
const f=new FormData(e.target);
await API.post(`/admin/upload/${selected._id}`,f);
alert("File uploaded & sent");
window.location.reload();
}}>

<input type="file" name="file" required style={{marginTop:"10px"}}/>

<br/><br/>

<button style={{
padding:"10px 20px",
background:"#4f46e5",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer"
}}>
Upload & Send
</button>

</form>

)}

<br/><br/>

<button
onClick={async()=>{
const reason=prompt("Enter rejection reason");
await API.put(`/admin/reject/${selected._id}`,{reason});
alert("Rejected");
window.location.reload();
}}
style={{
padding:"10px 20px",
background:"#ef4444",
color:"white",
border:"none",
borderRadius:"6px",
marginRight:"10px",
cursor:"pointer"
}}
>
Reject
</button>

<button
onClick={()=>setSelected(null)}
style={{
padding:"10px 20px",
background:"#6b7280",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer"
}}
>
Back
</button>

</div>
</div>
);
}

/* ================= LIST PAGE ================= */

return(

<div style={{
minHeight:"100vh",
background:"linear-gradient(135deg,#4f46e5,#06b6d4)",
padding:"40px"
}}>

<h1 style={{color:"white",textAlign:"center"}}>
Admin Dashboard
</h1>

{requests.map(r=>(

<div key={r._id}
onClick={()=>setSelected(r)}
style={{
background:"white",
margin:"20px auto",
padding:"20px",
maxWidth:"600px",
borderRadius:"10px",
cursor:"pointer",
boxShadow:"0 6px 15px rgba(0,0,0,0.25)"
}}>

<b>{r.name}</b> — {r.usn}
<br/>
{r.certificate}

</div>

))}

</div>
);
}
