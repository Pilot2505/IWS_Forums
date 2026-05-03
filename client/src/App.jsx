import "./global.css";
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

const App = () => (
  <>
    <Toaster />
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </>
);

export default App;
