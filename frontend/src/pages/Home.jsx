import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to CertOne</h1>

      <button onClick={() => navigate("/student")}>
        Student Login
      </button>

      <button onClick={() => navigate("/admin")}>
        Admin Login
      </button>
    </div>
  );
}
