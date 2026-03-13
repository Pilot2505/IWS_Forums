import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { User, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updatePost, deletePost } from "../services/postService";
import LogoutButton from "../components/LogoutButton";
import FollowButton from "../components/FollowButton";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const isOwnProfile = user && (!username || username === user.username);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [errors, setErrors] = useState({});

  const [profileUser, setProfileUser] = useState(null);
  const targetUserId = profileUser?.id;

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [editFormData, setEditFormData] = useState("");

  const [posts, setPosts] = useState([]);

  // Load current user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/register");
    } else {
      const loggedUser = JSON.parse(storedUser);
      setUser(loggedUser);
    }
  }, [navigate]);

  // Fetch profile user ID based on username
  useEffect(() => {
    if (!username) return;

    const fetchProfileUser = async () => {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();

      setProfileUser(data);
    };

    fetchProfileUser();
  }, [username]);

  // Fetch followers/following counts
  useEffect(() => {
    if (!targetUserId) return;

    const fetchFollowCounts = async () => {
      const res = await fetch(`/api/follow/follow-count/${targetUserId}`);
      const data = await res.json();
      setFollowersCount(data.followers);
      setFollowingCount(data.following);
    };

    fetchFollowCounts();
  }, [targetUserId]);

  // Load posts for this profile
  useEffect(() => {
    if (!username) return;

    const fetchPosts = async () => {
      const res = await fetch(`/api/posts/user/${username}`);

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", text);
        return;
      }
      
      const data = await res.json();
      setPosts(data);
    };

    fetchPosts();
  }, [username]);

  // Mark posts as seen when visiting profile
  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) return;

    fetch("/api/follow/seen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerId: user.id,
        followingId: targetUserId
      })
    }).catch(err => console.error("Failed to mark as seen:", err));

  }, [user, targetUserId, isOwnProfile]);

  useEffect(() => {
    if (showEditProfile && user) {
      setEditFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || ""
      });

      setErrors({});
    }
  }, [showEditProfile, user]);

  const refetchFollowCounts = async () => {
    if (!targetUserId) return;

    const res = await fetch(`/api/follow/follow-count/${targetUserId}`);
    const data = await res.json();
    setFollowersCount(data.followers);
    setFollowingCount(data.following);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let avatarUrl = user.avatar;

      if (selectedImage) {
        const formData = new FormData();
        formData.append("avatar", selectedImage);
        formData.append("userId", user.id);

        const uploadRes = await fetch("/api/users/upload-avatar", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.avatar;
      }

      const res = await fetch("/api/users/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          ...editFormData,
          avatar: avatarUrl
        }),
      });

      const updatedUser = await res.json();

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileUser(updatedUser);
      navigate(`/profile/${updatedUser.username}`);

      toast.success("Profile updated successfully!");
      setShowEditProfile(false);

    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editFormData.fullname.trim()) {
      newErrors.fullname = "Fullname is required";
    }

    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(editFormData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!editFormData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (editFormData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (editFormData.bio.length > 150) {
      newErrors.bio = "Bio must be less than 150 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      await deletePost(deletePostId);

      toast.success("Post deleted successfully!");

      setPosts(prev => prev.filter(p => p.id !== deletePostId));

      setShowDeleteDialog(false);
      setDeletePostId(null);

    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      await updatePost(editingPost, editTitle, editContent);

      setPosts(prev =>
        prev.map(p =>
          p.id === editingPost
            ? { ...p, title: editTitle, content: editContent }
            : p
        )
      );

      setEditingPost(null);
      setEditTitle("");
      setEditContent("");

      toast.success("Post updated!");

    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!user) return null;

  const displayUser = isOwnProfile ? profileUser || user : profileUser;
  if (!displayUser) return null;

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
          <Link to={`/profile/${user.username}`} className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-12 pt-12">
        {/* Profile Header */}
        <div className="bg-[#ACB8C9] rounded-t-lg p-8">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <div
                to={isOwnProfile ? "/profile" : `/profile/${username}`}
                className="w-24 h-24 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] overflow-hidden flex items-center justify-center"
              >
                  {displayUser?.avatar ? (
                  <img
                    src={displayUser.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-black">{displayUser?.fullname}</h1>
                <p className="text-lg text-gray-700">{displayUser?.username}</p>
                <div className="flex gap-8 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{posts.length}</div>
                    <div className="text-sm text-gray-700">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{followersCount}</div>
                    <div className="text-sm text-gray-700">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{followingCount}</div>
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
              <FollowButton
                currentUserId={user.id}
                targetUserId={profileUser?.id}
                onChange={() => refetchFollowCounts()}
              />
            )}
          </div>
          <p className="mt-4 text-black">{displayUser?.bio || "No bio yet"}</p>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-b-lg p-8">
          <h2 className="text-3xl font-semibold text-[#0C245E] mb-6">
            {isOwnProfile ? "Your Posts" : `${username}'s Posts`}
          </h2>

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center text-gray-500 py-10 text-lg">
                No posts yet.
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-6">
                  {editingPost === post.id ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full border p-2 mb-2 rounded"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full border p-2 mb-2 rounded"
                        rows="4"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleUpdatePost}
                          className="bg-[#1E56A0] text-white px-4 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="border px-4 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-semibold text-black mb-3">
                        {post.title}
                      </h3>
                      <p className="text-gray-700 mb-4">
                        {post.content}
                      </p>
                    </>
                  )}
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
                          <button
                          className="text-[#1E56A0] font-medium"
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditTitle(post.title);
                            setEditContent(post.content);
                          }}>
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
              ))
            )}
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
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      className="w-full h-full object-cover"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 m-auto" />
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatarUpload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedImage(file);
                      setPreviewImage(URL.createObjectURL(file));
                    }
                  }}
                />

                <label
                  htmlFor="avatarUpload"
                  className="text-[#1E56A0] font-medium cursor-pointer"
                >
                  Change Image
                </label>
              </div>
              <h2 className="text-3xl font-semibold mt-4">Edit Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                <label className="text-right font-medium pt-2">Fullname:</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.fullname}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, fullname: e.target.value });
                      setErrors({ ...errors, fullname: "" });
                    }}
                    className={`px-4 py-2 border rounded-md w-full ${
                      errors.fullname ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.fullname && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                <label className="text-right font-medium pt-2">Email:</label>
                <div className="w-full">
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, email: e.target.value });
                      setErrors({ ...errors, email: "" });
                    }}
                    className={`px-4 py-2 border rounded-md w-full ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                <label className="text-right font-medium pt-2">Username:</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, username: e.target.value });
                      setErrors({ ...errors, username:""})
                    }}
                    className={`px-4 py-2 border rounded-md w-full ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                <label className="text-right font-medium pt-2">Bio:</label>
                <div className="w-full">
                  <textarea
                    value={editFormData.bio}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, bio: e.target.value });
                      setErrors({ ...errors, bio:""})
                    }}
                    rows="4"
                    className={`px-4 py-2 border rounded-md w-full resize-none ${
                      errors.bio ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
                  )}
                </div>
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
