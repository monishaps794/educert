import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

export default function RequestDetails() {
  const {id}=useParams();
  const [req,setReq]=useState({});
  const [reason,setReason]=useState("");

  useEffect(()=>{
    API.get("/requests").then(res=>{
      setReq(res.data.find(r=>r._id===id));
    });
  },[]);

  const update = async status => {
    await API.put(`/requests/${id}`,{status,rejectionReason:reason});
    toast.success(`Request ${status}`);
  };

  return req?.student && (
    <div className="p-6">
      <p>Name: {req.student.name}</p>
      <p>USN: {req.student.usn}</p>
      <p>Certificate: {req.certificate}</p>

      <textarea placeholder="Rejection Reason (if any)" onChange={e=>setReason(e.target.value)}/>
      <button onClick={()=>update("Accepted")} className="bg-green-600 text-white p-2">Accept</button>
      <button onClick={()=>update("Rejected")} className="bg-red-600 text-white p-2 ml-2">Reject</button>
    </div>
  );
}
