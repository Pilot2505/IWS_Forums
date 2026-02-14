import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { User, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullname: "Minh Quan",
    email: "email@emai.com",
    username: "mquan2505",
    bio: "Computer Science undergraduate"
  });

  // Mock user data
  const profileData = {
    fullname: "Minh Quan",
    username: "@mquan2505",
    posts: 2,
    followers: 235,
    following: 7,
    bio: "Computer Science undergraduate",
    userPosts: [
      {
        id: 1,
        title: "Understanding Java exceptions",
        content: "Handling exceptions properly is crucial in Java programming. This post explains different types of exceptions and how to try-catch...",
        timeAgo: "1 day ago"
      },
      {
        id: 2,
        title: "Tips for React",
        content: "React is a powerful library, but beginners often struggle with structure and best practices. In this post, I share practical tips on organizing...",
        timeAgo: "2 days ago"
      }
    ]
  };

  const [posts, setPosts] = useState(profileData.userPosts);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/register");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleDeletePost = () => {
    setPosts(posts.filter(p => p.id !== deletePostId));
    toast.success("Post deleted!");
    setShowDeleteDialog(false);
    setDeletePostId(null);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success("Profile updated successfully!");
    setShowEditProfile(false);
  };

  if (!user) return null;

  const isOwnProfile = !username || username === user.username;

  return (
    <div className="min-h-screen bg-[#C8CFD8]">
      {/* Top Bar */}
      <header className="h-[75px] bg-[#F6F6F6] flex items-center justify-between px-12">
        <Link to="/home" className="text-[#163172] text-4xl font-semibold font-['Poppins']">
          Technical Forum
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/create-post" className="text-[#1E56A0] text-2xl font-medium">
            Create Post
          </Link>
          <Link to="/profile" className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center">
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="text-[#1E56A0] text-2xl font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-12 pt-12">
        {/* Profile Header */}
        <div className="bg-[#ACB8C9] rounded-t-lg p-8">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-black">{profileData.fullname}</h1>
                <p className="text-lg text-gray-700">{profileData.username}</p>
                <div className="flex gap-8 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{profileData.posts}</div>
                    <div className="text-sm text-gray-700">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{profileData.followers}</div>
                    <div className="text-sm text-gray-700">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{profileData.following}</div>
                    <div className="text-sm text-gray-700">Following</div>
                  </div>
                </div>
              </div>
            </div>
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditProfile(true)}
                className="bg-[#1E56A0] text-white px-6 py-2 rounded-md font-medium"
              >
                Edit Profile
              </button>
            ) : (
              <button className="bg-[#1E56A0] text-white px-8 py-2 rounded-md font-medium">
                Follow
              </button>
            )}
          </div>
          <p className="mt-4 text-black">{profileData.bio}</p>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-b-lg p-8">
          <h2 className="text-3xl font-semibold text-[#0C245E] mb-6">
            {isOwnProfile ? "Your Posts" : "My Posts"}
          </h2>

          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-2xl font-semibold text-black mb-3">{post.title}</h3>
                <p className="text-gray-700 mb-4">{post.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.timeAgo}</span>
                  <div className="flex gap-4">
                    <Link
                      to={`/post/${post.id}`}
                      className="text-[#1E56A0] font-medium"
                    >
                      Read More
                    </Link>
                    {isOwnProfile && (
                      <>
                        <button className="text-[#1E56A0] font-medium">
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletePostId(post.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-[#D6E4F0] flex items-center justify-center mb-4">
                  <User className="w-12 h-12" />
                </div>
                <button className="text-[#1E56A0] font-medium">Change</button>
              </div>
              <h2 className="text-3xl font-semibold mt-4">Edit Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                <label className="text-right font-medium">Fullname:</label>
                <input
                  type="text"
                  value={editFormData.fullname}
                  onChange={(e) => setEditFormData({ ...editFormData, fullname: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                <label className="text-right font-medium">Email:</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                <label className="text-right font-medium">Username:</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                <label className="text-right font-medium pt-2">Bio:</label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  rows="4"
                  className="px-4 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>

              <div className="flex gap-4 justify-center pt-6">
                <button
                  type="submit"
                  className="bg-[#1E56A0] text-white px-8 py-2 rounded-md font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="border border-gray-300 px-8 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">
                Are you sure you want to delete this post?
              </h3>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDeletePost}
                className="bg-red-600 text-white px-6 py-2 rounded-md font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
                className="border border-gray-300 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
