"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { fetchAPI } from "@/lib/api";
import {
  MessageSquare,
  Heart,
  Send,
  Loader2,
  AlertCircle,
  X,
  MessageCircle,
  Image as ImageIcon,
  Trash2
} from "lucide-react";

// Resize & compress image to base64 (max 900px, quality 0.82)
function resizeAndConvertToBase64(file: File, maxWidth = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface Post {
  id: string;
  Id?: string;       // PascalCase fallback
  userId?: string;
  UserId?: string;   // PascalCase fallback
  user_id?: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  Id?: string;       // PascalCase fallback
  userId?: string;
  UserId?: string;   // PascalCase fallback
  user_id?: string;
  parentId?: string;
  parent_id?: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
}

interface CurrentUser {
  id: string;
  role: string;
  username?: string;
  userId?: string; // alias
}

// Normalize UUID for comparison (handles uppercase/lowercase differences)
function normalizeId(id?: string): string {
  return (id ?? "").toLowerCase();
}

export default function TenantFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Post Image State
  const [postImage, setPostImage] = useState("");

  // My Profile Avatar info
  const [myAvatar, setMyAvatar] = useState("");
  const [myInitials, setMyInitials] = useState("ME");

  // Comments state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Current user – initialized lazily from localStorage (no useEffect needed)
  const [currentUser] = useState<CurrentUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem("user");
      return saved ? (JSON.parse(saved) as CurrentUser) : null;
    } catch {
      return null;
    }
  });

  // Comment Image State
  const [commentImage, setCommentImage] = useState("");
  const [postImageLoading, setPostImageLoading] = useState(false);
  const [commentImageLoading, setCommentImageLoading] = useState(false);

  // Refs for hidden file inputs
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  // Handle post image file selection
  const handlePostImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Vui lòng chọn file ảnh."); return; }
    try {
      setPostImageLoading(true);
      const base64 = await resizeAndConvertToBase64(file);
      setPostImage(base64);
    } catch {
      alert("Không thể đọc file ảnh. Vui lòng thử lại.");
    } finally {
      setPostImageLoading(false);
      // Reset input so same file can be re-selected
      if (postFileInputRef.current) postFileInputRef.current.value = "";
    }
  };

  // Handle comment image file selection
  const handleCommentImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Vui lòng chọn file ảnh."); return; }
    try {
      setCommentImageLoading(true);
      const base64 = await resizeAndConvertToBase64(file);
      setCommentImage(base64);
    } catch {
      alert("Không thể đọc file ảnh. Vui lòng thử lại.");
    } finally {
      setCommentImageLoading(false);
      if (commentFileInputRef.current) commentFileInputRef.current.value = "";
    }
  };

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/posts");
      if (res.success && Array.isArray(res.data)) {
        setPosts(res.data as Post[]);
      } else {
        setError("Không thể tải bảng tin KTX.");
      }
    } catch (err: unknown) {
      console.error("Lỗi tải bài viết:", err);
      setError("Không thể kết nối máy chủ để tải bảng tin.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load – define async inside effect to satisfy react-hooks/set-state-in-effect
  useEffect(() => {
    const initFeed = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetchAPI("/posts");
        if (res.success && Array.isArray(res.data)) {
          setPosts(res.data as Post[]);
        } else {
          setError("Không thể tải bảng tin KTX.");
        }
      } catch (err: unknown) {
        console.error("Lỗi tải bài viết:", err);
        setError("Không thể kết nối máy chủ để tải bảng tin.");
      } finally {
        setLoading(false);
      }
    };

    const initProfile = async () => {
      try {
        const res = await fetchAPI("/tenants/me");
        if (res.success && res.data) {
          if (res.data.avatar_url) {
            setMyAvatar(res.data.avatar_url as string);
          }
          if (res.data.fullName) {
            setMyInitials((res.data.fullName as string).substring(0, 2).toUpperCase());
          }
        }
      } catch (err) {
        console.error("Lỗi tải profile cá nhân:", err);
      }
    };

    void initFeed();
    void initProfile();
  }, []);


  const handleCreatePost = async () => {
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError("");
      const res = await fetchAPI("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: postImage.trim() || null
        })
      });

      if (res.success && res.data) {
        setPosts((prev) => [res.data, ...prev]);
        setContent("");
        setPostImage("");
      } else {
        setError(res.message || "Lỗi khi đăng bài.");
      }
    } catch (err: unknown) {
      console.error("Lỗi đăng bài viết:", err);
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng bài.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.is_liked;
          return {
            ...post,
            is_liked: isLiked,
            likes_count: isLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1)
          };
        }
        return post;
      })
    );

    try {
      const res = await fetchAPI(`/posts/${postId}/like`, {
        method: "POST"
      });
      if (!res.success) {
        loadFeed();
      }
    } catch (err) {
      console.error("Lỗi thích bài viết:", err);
      loadFeed();
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setComments([]);
    setCommentContent("");
    setReplyingTo(null);

    try {
      setCommentsLoading(true);
      const res = await fetchAPI(`/posts/${post.id}/comments`);
      if (res.success && Array.isArray(res.data)) {
        setComments(res.data as Comment[]);
      }
    } catch (err) {
      console.error("Lỗi tải bình luận:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentContent.trim() || !selectedPost) return;

    try {
      setCommentSubmitting(true);
      const res = await fetchAPI(`/posts/${selectedPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: commentContent.trim(),
          parentId: replyingTo ? replyingTo.id : null,
          imageUrl: commentImage.trim() || null
        })
      });

      if (res.success && res.data) {
        setComments((prev) => [...prev, res.data as Comment]);

        // Update comments count in posts list
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === selectedPost.id) {
              return { ...post, comments_count: post.comments_count + 1 };
            }
            return post;
          })
        );

        setCommentContent("");
        setCommentImage("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err);
      alert("Không thể gửi bình luận.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    console.log('Attempting to delete post with id:', postId);
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
      console.log('Delete post cancelled by user');
      return;
    }

    try {
      const res = await fetchAPI(`/posts/${postId}`, {
        method: "DELETE"
      });
      console.log('Delete post response:', res);

      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost && selectedPost.id === postId) {
          setShowCommentsModal(false);
          setSelectedPost(null);
        }
        console.log('Post deleted successfully');
      } else {
        console.warn('Failed to delete post:', res.message);
        alert(res.message || "Không thể xóa bài viết.");
      }
    } catch (err: unknown) {
      console.error("Lỗi xóa bài viết:", err);
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa bài viết.";
      alert(message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log('Attempting to delete comment with id:', commentId);
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) {
      console.log('Delete comment cancelled by user');
      return;
    }

    try {
      const res = await fetchAPI(`/posts/comments/${commentId}`, {
        method: "DELETE"
      });
      console.log('Delete comment response:', res);

      if (res.success) {
        // Tự động đếm và xóa bình luận cùng tất cả các câu trả lời con (nếu có)
        // để cập nhật UI đồng nhất
        setComments((prev) => {
          const toDelete = new Set<string>();
          toDelete.add(commentId);
          
          // Tìm bình luận con (reply) có parent_id là commentId
          prev.forEach((c) => {
            if (c.parent_id === commentId || c.parentId === commentId) {
              toDelete.add(c.id);
            }
          });

          // Cập nhật posts list count
          const deletedCount = toDelete.size;
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (selectedPost && post.id === selectedPost.id) {
                return { ...post, comments_count: Math.max(0, post.comments_count - deletedCount) };
              }
              return post;
            })
          );

          return prev.filter((c) => !toDelete.has(c.id));
        });
        console.log('Comment deleted successfully');
      } else {
        console.warn('Failed to delete comment:', res.message);
        alert(res.message || "Không thể xóa bình luận.");
      }
    } catch (err: unknown) {
      console.error("Lỗi xóa bình luận:", err);
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa bình luận.";
      alert(message);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Optimistic UI update for comments list
    setComments((prevComments) =>
      prevComments.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.is_liked;
          return {
            ...c,
            is_liked: isLiked,
            likes_count: isLiked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1)
          };
        }
        return c;
      })
    );

    try {
      const res = await fetchAPI(`/posts/comments/${commentId}/like`, {
        method: "POST"
      });
      if (!res.success && selectedPost) {
        // Rollback comments
        const refresh = await fetchAPI(`/posts/${selectedPost.id}/comments`);
        if (refresh.success && Array.isArray(refresh.data)) {
          setComments(refresh.data);
        }
      }
    } catch (err) {
      console.error("Lỗi thích bình luận:", err);
    }
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    // Chèn tag tên viết liền dạng @Tên_Tác_Giả vào đầu ô nhập liệu
    const mention = `@${comment.author_name.replace(/\s+/g, "_")} `;
    if (!commentContent.includes(mention)) {
      setCommentContent(mention + commentContent);
    }
  };

  const toggleExpandComment = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHr < 24) return `${diffHr} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  // Helper to highlight @mentions in text
  const renderContentWithMentions = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(@[\w_À-ỹ]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-blue-600 font-bold hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải bản tin...</p>
      </div>
    );
  }

  // Filter root comments and replies for modal rendering
  const rootComments = comments.filter((c) => !c.parent_id && !c.parentId);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24 text-gray-800 dark:text-zinc-200">
      
      {/* Title */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            💬 Bản tin KTX
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Kết nối & chia sẻ cùng các bạn sinh viên</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Soạn bài viết */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800 space-y-3">
        <div className="flex gap-3">
          {/* Avatar đại diện */}
          {myAvatar ? (
            <Image src={myAvatar} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0" unoptimized />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {myInitials}
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì? Chia sẻ ngay..."
            maxLength={280}
            rows={3}
            className="flex-1 w-full text-sm outline-none resize-none placeholder-gray-400 dark:placeholder-zinc-500 py-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
          />
        </div>

        {/* Preview ảnh đính kèm */}
        {postImage && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100 mt-1">
            <Image src={postImage} alt="Preview" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => setPostImage("")}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition shadow-sm"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Hidden file input for post image */}
        <input
          ref={postFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePostImageFile}
        />

        <div className="flex justify-between items-center border-t pt-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => postFileInputRef.current?.click()}
              disabled={postImageLoading}
              className={`p-1.5 rounded-lg transition-colors ${
                postImage ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-blue-600 hover:bg-gray-50"
              } disabled:opacity-50`}
              title="Đính kèm ảnh từ máy tính"
            >
              {postImageLoading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            </button>
            <span className="text-[11px] text-gray-400">
              {content.length}/280 ký tự
            </span>
          </div>
          <button
            onClick={handleCreatePost}
            disabled={!content.trim() || submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Chia sẻ
          </button>
        </div>
      </div>

      {/* Feed list */}
      <div className="space-y-3">
        {posts.length > 0 ? (
          posts.map((post) => {
            const myId = normalizeId(currentUser?.id);
            const postAuthorId = normalizeId(post.userId ?? post.UserId ?? post.user_id);
            const isPostAuthor = !!currentUser && myId !== "" && myId === postAuthorId;
            const isPostDeletable = !!currentUser && (
              currentUser.role?.toUpperCase() === "ADMIN" ||
              currentUser.role?.toUpperCase() === "MANAGER" ||
              isPostAuthor
            );

            return (
              <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800 flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              {/* Author Avatar */}
              {post.author_avatar ? (
              <Image src={post.author_avatar} alt={post.author_name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-zinc-800 shrink-0" unoptimized />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                  {post.author_name ? post.author_name.substring(0, 2).toUpperCase() : "SV"}
                </div>
              )}

              {/* Thread Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900 dark:text-zinc-50 truncate">{post.author_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">{formatRelativeTime(post.created_at)}</span>
                    {isPostDeletable && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                        title="Xóa bài viết"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                  {renderContentWithMentions(post.content)}
                </p>

                {/* Render Post Image if exists */}
                {post.image_url && (
                  <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-xs mt-2">
                    <Image src={post.image_url} alt="Post Attachment" fill className="object-cover" unoptimized />
                  </div>
                )}

                {/* Interactions Row */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-50 dark:border-zinc-800 mt-1.5">
                  
                  {/* Like Button */}
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                      post.is_liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <Heart size={15} fill={post.is_liked ? "currentColor" : "none"} />
                    <span>{post.likes_count}</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => handleOpenComments(post)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 font-medium transition-colors"
                  >
                    <MessageSquare size={15} />
                    <span>{post.comments_count}</span>
                  </button>

                </div>
              </div>

            </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-12 border border-gray-100 dark:border-zinc-800 text-center text-gray-400 dark:text-zinc-500">
            <MessageCircle className="mx-auto mb-2 text-gray-200 dark:text-zinc-700" size={48} />
            <p className="text-sm">Bản tin trống. Hãy là người đầu tiên chia sẻ!</p>
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl text-gray-800 dark:text-zinc-100 border border-gray-100 dark:border-zinc-800 relative max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-50">Bình luận bài viết</h3>
                <p className="text-[10px] text-gray-400">Đăng bởi {selectedPost.author_name}</p>
              </div>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of Comments */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-[220px]">
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                </div>
              ) : rootComments.length > 0 ? (
                rootComments.map((c) => {
                  const childReplies = comments.filter((child) => child.parent_id === c.id || child.parentId === c.id);
                  const isExpanded = !!expandedComments[c.id];
                  const myId = normalizeId(currentUser?.id);
                  const commentAuthorId = normalizeId(c.userId ?? c.UserId ?? c.user_id);
                  const isCommentAuthor = !!currentUser && myId !== "" && myId === commentAuthorId;
                  const isCommentDeletable = !!currentUser && (
                    currentUser.role?.toUpperCase() === "ADMIN" ||
                    currentUser.role?.toUpperCase() === "MANAGER" ||
                    isCommentAuthor
                  );

                  return (
                    <div key={c.id} className="space-y-1">
                      {/* Root Comment Row */}
                      <div className="flex gap-3 items-stretch text-xs">
                        {/* Left column: Avatar and thread line */}
                        <div className="flex flex-col items-center shrink-0 w-8">
                          {c.author_avatar ? (
                            <Image src={c.author_avatar} alt={c.author_name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-zinc-800" unoptimized />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-[10px]">
                              {c.author_name ? c.author_name.substring(0, 2).toUpperCase() : "SV"}
                            </div>
                          )}
                          {childReplies.length > 0 && isExpanded && (
                            <div className="w-0.5 bg-gray-200 dark:bg-zinc-800 flex-1 my-1"></div>
                          )}
                        </div>

                        {/* Right column: Content */}
                        <div className="flex-1 min-w-0 pb-3">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-semibold text-gray-900 dark:text-zinc-50">{c.author_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-400 dark:text-zinc-500">{formatRelativeTime(c.created_at)}</span>
                              {isCommentDeletable && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                                  title="Xóa bình luận"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-zinc-300 break-words leading-relaxed">
                            {renderContentWithMentions(c.content)}
                          </p>
                          {c.image_url && (
                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-xs mt-1.5">
                              <Image src={c.image_url} alt="Comment Attachment" fill className="object-cover" unoptimized />
                            </div>
                          )}
                          <div className="flex items-center gap-4 pt-1.5 mt-0.5">
                            {/* Like Comment */}
                            <button
                              onClick={() => handleLikeComment(c.id)}
                              className={`flex items-center gap-1 text-[10px] transition-colors ${
                                c.is_liked ? "text-red-500 font-semibold" : "text-gray-400 hover:text-red-500"
                              }`}
                            >
                              <Heart size={12} fill={c.is_liked ? "currentColor" : "none"} />
                              <span>{c.likes_count}</span>
                            </button>
                            {/* Reply Comment */}
                            <button
                              onClick={() => handleReplyClick(c)}
                              className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors font-semibold"
                            >
                              Trả lời
                            </button>
                          </div>

                          {/* Collapsible toggle button */}
                          {childReplies.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandComment(c.id)}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold mt-1.5 transition-colors block hover:underline"
                            >
                              {isExpanded ? "Thu gọn phản hồi" : `Xem ${childReplies.length} câu trả lời`}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Child Replies Row (Nested but Aligned) */}
                      {childReplies.length > 0 && isExpanded && (
                        <div className="space-y-1">
                          {childReplies.map((child, childIndex) => {
                            const isLastChild = childIndex === childReplies.length - 1;
                            const myId = normalizeId(currentUser?.id);
                            const childAuthorId = normalizeId(child.userId ?? child.UserId ?? child.user_id);
                            const isChildAuthor = !!currentUser && myId !== "" && myId === childAuthorId;
                            const isChildDeletable = !!currentUser && (
                              currentUser.role?.toUpperCase() === "ADMIN" ||
                              currentUser.role?.toUpperCase() === "MANAGER" ||
                              isChildAuthor
                            );

                            return (
                              <div key={child.id} className="flex gap-3 items-stretch text-xs">
                                {/* Left column: Connector line and child avatar */}
                                <div className="flex flex-col items-center shrink-0 w-8">
                                  <div className="w-0.5 bg-gray-200 dark:bg-zinc-800 h-2"></div>
                                  {child.author_avatar ? (
                                    <Image src={child.author_avatar} alt={child.author_name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-zinc-800" unoptimized />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center font-bold text-gray-500 dark:text-zinc-500 text-[10px]">
                                      {child.author_name ? child.author_name.substring(0, 2).toUpperCase() : "SV"}
                                    </div>
                                  )}
                                  {!isLastChild && (
                                    <div className="w-0.5 bg-gray-200 dark:bg-zinc-800 flex-1 my-1"></div>
                                  )}
                                </div>

                                {/* Right column: Child content */}
                                <div className="flex-1 min-w-0 pb-3">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-semibold text-gray-900 dark:text-zinc-50">{child.author_name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-gray-400 dark:text-zinc-500">{formatRelativeTime(child.created_at)}</span>
                                      {isChildDeletable && (
                                        <button
                                          onClick={() => handleDeleteComment(child.id)}
                                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                                          title="Xóa phản hồi"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-gray-700 dark:text-zinc-300 break-words leading-relaxed">
                                    {renderContentWithMentions(child.content)}
                                  </p>
                                  {child.image_url && (
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-xs mt-1.5">
                                      <Image src={child.image_url} alt="Reply Attachment" fill className="object-cover" unoptimized />
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 pt-1.5 mt-0.5">
                                    {/* Like Reply */}
                                    <button
                                      onClick={() => handleLikeComment(child.id)}
                                      className={`flex items-center gap-1 text-[10px] transition-colors ${
                                        child.is_liked ? "text-red-500 font-semibold" : "text-gray-400 hover:text-red-500"
                                      }`}
                                    >
                                      <Heart size={11} fill={child.is_liked ? "currentColor" : "none"} />
                                      <span>{child.likes_count}</span>
                                    </button>
                                    {/* Reply trigger referencing parent c */}
                                    <button
                                      onClick={() => handleReplyClick(c)}
                                      className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors font-semibold"
                                    >
                                      Trả lời
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Chưa có bình luận nào. Hãy bình luận đầu tiên!
                </div>
              )}
            </div>

            {/* Replying banner indicator */}
            {replyingTo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-t-xl text-[10px] flex justify-between items-center border-b border-blue-100 dark:border-blue-900 shrink-0">
                <span>Đang trả lời <strong>@{replyingTo.author_name}</strong></span>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    const mention = `@${replyingTo.author_name.replace(/\s+/g, "_")} `;
                    if (commentContent.startsWith(mention)) {
                      setCommentContent(commentContent.substring(mention.length));
                    }
                  }}
                  className="text-blue-500 hover:text-blue-700 p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Preview ảnh bình luận */}
            {commentImage && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 mt-1 shrink-0">
                <Image src={commentImage} alt="Comment Preview" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setCommentImage("")}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition shadow-sm"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Hidden file input for comment image */}
            <input
              ref={commentFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCommentImageFile}
            />

            {/* Send Comment Input */}
            <div className={`border-t dark:border-zinc-800 flex gap-2 shrink-0 items-center ${replyingTo ? "pt-2" : "pt-3"}`}>
              <button
                type="button"
                onClick={() => commentFileInputRef.current?.click()}
                disabled={commentImageLoading}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  commentImage ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
                } disabled:opacity-50`}
                title="Đính kèm ảnh từ máy tính"
              >
                {commentImageLoading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              </button>
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              />
              <button
                onClick={handleSendComment}
                disabled={!commentContent.trim() || commentSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition shrink-0"
              >
                {commentSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
