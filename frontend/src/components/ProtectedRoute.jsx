import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const isAuth = localStorage.getItem("isLoggedIn") === "true"; 


  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;