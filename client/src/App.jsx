import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";

import Home from "./pages/Home";
import Learning from "./pages/Learning";
import InterviewPrep from "./pages/InterviewPrep";
import MyScore from "./pages/MyScore";
import Profile from "./pages/Profile";
import About from "./pages/About";
import StacksPage from "./pages/StacksPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/interview" element={<InterviewPrep />} />
        <Route path="/score" element={<MyScore />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
        <Route path="/learning/:fieldSlug" element={<StacksPage />} />
      </Route>
    </Routes>
  );
}

export default App;
