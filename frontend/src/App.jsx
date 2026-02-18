import { BrowserRouter,Routes,Route,Navigate } from "react-router-dom";

import StudentLogin from "./pages/StudentLogin";
import AdminLogin from "./pages/AdminLogin";
import StudentProfile from "./pages/StudentProfile";
import StudentHome from "./pages/StudentHome";
import AdminDashboard from "./pages/AdminDashboard";

export default function App(){

return(

<BrowserRouter>

<Routes>

{/* DEFAULT → REDIRECT TO STUDENT LOGIN */}
<Route path="/" element={<Navigate to="/student-login"/>}/>

{/* STUDENT */}
<Route path="/student-login" element={<StudentLogin/>}/>
<Route path="/student/profile" element={<StudentProfile/>}/>
<Route path="/student/home" element={<StudentHome/>}/>

{/* ADMIN */}
<Route path="/admin-login" element={<AdminLogin/>}/>
<Route path="/admin/dashboard" element={<AdminDashboard/>}/>

</Routes>

</BrowserRouter>

);

}
