import { Link } from "react-router-dom";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function Navbar({ user, showCreatePost = true }) {
  return (
    <header className="bg-[#F6F6F6] px-4 py-3 sm:px-6 lg:px-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Logo */}
      <Link to="/" className="text-2xl font-semibold text-[#163172] font-['Poppins'] sm:text-3xl lg:text-4xl">
        Technical Forum
      </Link>

      {/* Navigation Items */}
      <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto sm:gap-5 lg:gap-8">
        {/* shown on all pages except Create Post page */}
        {showCreatePost && (
          <Link to="/create-post" className="text-base font-medium text-[#1E56A0] transition-colors hover:text-[#163172] sm:text-lg lg:text-2xl">
            Create Post
          </Link>
        )}

        {/* User Profile Avatar */}
        {user && (
          <Link 
            to={`/profile/${user.username}`} 
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#D6E4F0] bg-[#21005D]/10 transition-transform hover:scale-105 sm:h-11 sm:w-11 sm:border-4"
          >
            {user?.avatar ? (
              <img src={user.avatar} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </Link>
        )}
        
        <LogoutButton />
      </div>
      </div>
    </header>
  );
}
