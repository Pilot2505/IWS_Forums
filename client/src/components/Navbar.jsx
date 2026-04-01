import { Link } from "react-router-dom";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function Navbar({ user, showCreatePost = true }) {
  return (
    <header className="h-[75px] bg-[#F6F6F6] flex items-center justify-between px-12">
      {/* Logo */}
      <Link to="/" className="text-[#163172] text-4xl font-semibold font-['Poppins']">
        Technical Forum
      </Link>

      {/* Navigation Items */}
      <div className="flex items-center gap-8">
        {/* shown on all pages except Create Post page */}
        {showCreatePost && (
          <Link to="/create-post" className="text-[#1E56A0] text-2xl font-medium hover:text-[#163172] transition-colors">
            Create Post
          </Link>
        )}

        {/* User Profile Avatar */}
        {user && (
          <Link 
            to={`/profile/${user.username}`} 
            className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform overflow-hidden"
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
    </header>
  );
}