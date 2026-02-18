import { useNavigate } from "react-router-dom";

export default function Landing(){

const navigate = useNavigate();

return(

<div style={{textAlign:"center",marginTop:"120px"}}>

<h1 style={{fontWeight:"bold",fontSize:"36px"}}>
WELCOME TO CERTONE
</h1>

<br/><br/>

<button
style={{padding:"15px 40px",margin:"10px"}}
onClick={()=>navigate("/student-login")}
>
Student Login
</button>

<br/>

<button
style={{padding:"15px 40px",margin:"10px"}}
onClick={()=>navigate("/admin-login")}
>
Admin Login
</button>

</div>

);

}
