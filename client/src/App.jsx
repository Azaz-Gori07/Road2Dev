import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Learning from "./pages/Learning";
import InterviewPrep from "./pages/InterviewPrep";
import MyScore from "./pages/MyScore";
import Profile from "./pages/Profile";
import InterviewSession from "./pages/InterviewSession";
import InterviewHistory from "./pages/InterviewHistory";
import About from "./pages/About";
import StacksPage from "./pages/StacksPage";
import RoadMap from "./pages/Roadmap";
import ContentPage from "./pages/ContentPage";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/interview" element={<InterviewPrep />} />
        <Route
          path="/score"
          element={
            <ProtectedRoute>
              <MyScore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route
          path="/interview/session/:id"
          element={
            <ProtectedRoute>
              <InterviewSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/history"
          element={
            <ProtectedRoute>
              <InterviewHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/sessions"
          element={
            <ProtectedRoute>
              <InterviewHistory />
            </ProtectedRoute>
          }
        />
        <Route path="/learning/:fieldSlug" element={<StacksPage />} />
        <Route path="/learning/:fieldSlug/:stackSlug" element={<RoadMap />} />
        <Route path="/learning/:fieldSlug/:stackSlug/:techSlug" element={<ContentPage />} />
      </Route>
    </Routes>
  );
}

export default App;
