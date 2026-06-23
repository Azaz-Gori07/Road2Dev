import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

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
import LearningLab from "./pages/LearningLab";
import LearningHistory from "./pages/LearningHistory";
import SandboxHistory from "./pages/SandboxHistory";
import LearningAnalytics from "./pages/LearningAnalytics";
import IntelligenceDashboard from "./pages/IntelligenceDashboard";
import MentorMemoryViewer from "./pages/MentorMemoryViewer";

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/learning-lab" element={
          <ProtectedRoute>
            <LearningLab />
          </ProtectedRoute>
        } />
        <Route path="/learning-lab/session/:sessionId" element={
          <ProtectedRoute>
            <LearningLab />
          </ProtectedRoute>
        } />
        <Route path="/learning-lab/project-defense/:sessionId" element={
          <ProtectedRoute>
            <LearningLab />
          </ProtectedRoute>
        } />
        <Route path="/learning-lab/sandbox/:sessionId" element={
          <ProtectedRoute>
            <LearningLab />
          </ProtectedRoute>
        } />
        <Route path="/learning-lab/career-coach/:sessionId" element={
          <ProtectedRoute>
            <LearningLab />
          </ProtectedRoute>
        } />
        <Route path="/learning-lab/knowledge-gap/:sessionId" element={
          <ProtectedRoute>
            <LearningLab />
          </ProtectedRoute>
        } />
        <Route path="/interview" element={<InterviewPrep />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />
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
        <Route
          path="/learning/history"
          element={
            <ProtectedRoute>
              <LearningHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sandbox/history"
          element={
            <ProtectedRoute>
              <SandboxHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning/analytics"
          element={
            <ProtectedRoute>
              <LearningAnalytics />
            </ProtectedRoute>
          }
        />
        <Route path="/learning/:fieldSlug" element={<StacksPage />} />
        <Route path="/learning/:fieldSlug/:stackSlug" element={<RoadMap />} />
        <Route path="/learning/:fieldSlug/:stackSlug/:techSlug" element={<ContentPage />} />
        <Route
          path="/intelligence"
          element={
            <ProtectedRoute>
              <IntelligenceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memory"
          element={
            <ProtectedRoute>
              <MentorMemoryViewer />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
