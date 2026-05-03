import { Routes, Route } from "react-router-dom";
import Index from "@/pages/home/Index";
import Register from "@/pages/auth/Register";
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Home from "@/pages/home/Home";
import PostDetail from "@/pages/posts/PostDetail";
import CreatePost from "@/pages/posts/CreatePost";
import Profile from "@/pages/profile/Profile";
import SearchResult from "@/pages/search/SearchResult";
import Bookmarks from "@/pages/bookmarks/Bookmarks";
import Notifications from "@/pages/notifications/Notifications";
import SelectCategories from "@/pages/onboarding/SelectCategories";
import ConfirmDeleteAccount from "@/pages/auth/ConfirmDeleteAccount";
import NotFound from "@/pages/errors/NotFound";

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
