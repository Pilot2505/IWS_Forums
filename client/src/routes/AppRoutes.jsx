import { Routes, Route } from "react-router-dom";
import Index from "@/features/home/pages/Index";
import Register from "@/features/auth/pages/Register";
import Login from "@/features/auth/pages/Login";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import Home from "@/features/home/pages/Home";
import PostDetail from "@/features/posts/pages/PostDetail";
import CreatePost from "@/features/posts/pages/CreatePost";
import Profile from "@/features/profile/pages/Profile";
import SearchResult from "@/features/search/pages/SearchResult";
import Bookmarks from "@/features/bookmarks/pages/Bookmarks";
import Notifications from "@/features/notifications/pages/Notifications";
import SelectCategories from "@/features/onboarding/pages/SelectCategories";
import ConfirmDeleteAccount from "@/features/auth/pages/ConfirmDeleteAccount";
import NotFound from "@/features/errors/pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<Home />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/search" element={<SearchResult />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/select-categories" element={<SelectCategories />} />
      <Route path="/confirm-delete-account" element={<ConfirmDeleteAccount />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
