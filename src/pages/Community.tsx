
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send, Users, ThumbsUp, MessageCircle, Search, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/Navbar';
import axios from 'axios';

interface Post {
    id: string;
    author: string;
    avatar?: string;
    title: string;
    content: string;
    tags: string[];
    likes: number;
    comments: {
        id: string;
        author: string;
        text: string;
        timestamp: string;
    }[];
    timestamp: string;
}

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
}

const Community = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("forum");
    const [posts, setPosts] = useState<Post[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Forum Inputs
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    // Chat Inputs
    const [chatInput, setChatInput] = useState("");
    const [username, setUsername] = useState(() => {
        return localStorage.getItem("agrisphere_username") || `Farmer_${Math.floor(Math.random() * 1000)}`;
    });
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 10000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'chat') {
            fetchChat();
            fetchOnlineUsers();
            const interval = setInterval(() => {
                fetchChat();
                fetchOnlineUsers();
            }, 3000); // Faster polling for chat

            // Heartbeat
            const heartbeat = setInterval(() => {
                axios.post(`${API_URL}/community/heartbeat`, { username });
            }, 10000);

            // Initial heartbeat
            axios.post(`${API_URL}/community/heartbeat`, { username });

            return () => {
                clearInterval(interval);
                clearInterval(heartbeat);
            };
        }
    }, [activeTab, username]);

    const fetchOnlineUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/community/online`);
            setOnlineUsers(res.data);
        } catch (e) {
            console.error("Error fetching online users", e);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`${API_URL}/community/posts`);
            setPosts(res.data);
            setError("");
        } catch (error) {
            console.error("Error fetching posts:", error);
            setError("Failed to load posts. Is the server running?");
        } finally {
            setLoading(false);
        }
    };

    const fetchChat = async () => {
        try {
            const res = await axios.get(`${API_URL}/community/chat`);
            setChatMessages(res.data);
        } catch (error) {
            console.error("Error fetching chat:", error);
        }
    };

    const handlePostReply = async (postId: string) => {
        if (!replyText.trim()) return;

        try {
            await axios.post(`${API_URL}/community/posts/${postId}/comments`, {
                author: "Me (Farmer)",
                text: replyText
            });
            setReplyText("");
            toast({ title: "Success", description: "Reply added!" });
            fetchPosts(); // Refresh to show new comment
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to add reply", variant: "destructive" });
        }
    };

    const handleCreatePost = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }

        setIsPosting(true);
        try {
            const newPost = {
                author: "Me (Farmer)", // In a real app, use auth user
                title: newPostTitle,
                content: newPostContent,
                tags: ["General"],
            };

            await axios.post(`${API_URL}/community/posts`, newPost);

            setNewPostTitle("");
            setNewPostContent("");
            toast({ title: "Success", description: "Question posted to the forum!" });
            fetchPosts();
        } catch (error) {
            toast({ title: "Error", description: "Failed to post question", variant: "destructive" });
        } finally {
            setIsPosting(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        try {
            const msg = {
                sender: username, // Use dynamic username
                text: chatInput
            };

            await axios.post(`${API_URL}/community/chat`, msg);
            setChatInput("");
            fetchChat();
        } catch (error) {
            console.error("Failed to send message");
        }
    };

    const handleTranslate = async (msgId: string, text: string) => {
        // Simple mock translation for demo purposes since we don't have a live translation API key configured for the frontend
        // In production, this would call Google Translate API or the backend
        const hindiMock = "यह एक अनुवादित संदेश है (This is a translated message)";

        setChatMessages(prev => prev.map(msg =>
            msg.id === msgId
                ? { ...msg, text: msg.text.includes(" (HI)") ? msg.text.split(" (HI)")[0] : `${msg.text} (HI): ${hindiMock}` }
                : msg
        ));
        toast({ title: "Translation", description: "Message translated to Hindi" });
    };

    return (
        <div className="min-h-screen bg-black/95 text-white">
            <Navbar />

            <main className="container mx-auto px-4 py-8 pt-24">
                {/* ... existing header ... */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                            Check Community
                        </h1>
                        <p className="text-slate-400 mt-2">Connect, share, and learn from other farmers.</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1">
                        <TabsTrigger value="forum" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400">
                            <MessageSquare className="w-4 h-4 mr-2" /> Global Forum
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                            <MessageCircle className="w-4 h-4 mr-2" /> Live Farmer Chat
                        </TabsTrigger>
                    </TabsList>

                    {/* FORUM TAB */}
                    <TabsContent value="forum" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Post List */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input placeholder="Search discussions..." className="pl-10 bg-slate-900 border-slate-800 text-white" />
                                    </div>
                                    <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">Filter</Button>
                                </div>

                                {loading ? (
                                    <div className="text-center py-12 text-slate-500">Loading community discussions...</div>
                                ) : error ? (
                                    <div className="text-center py-12 text-red-400 border border-red-900/50 rounded-lg bg-red-900/20">
                                        {error}
                                        <Button variant="link" className="text-red-300 block mx-auto mt-2" onClick={fetchPosts}>Try Again</Button>
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
                                        <p className="text-slate-500">No discussions yet. Be the first to ask!</p>
                                    </div>
                                ) : (
                                    posts.map((post) => (
                                        <Card key={post.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group">
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-10 w-10 border border-slate-700">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}`} />
                                                        <AvatarFallback><User /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start" onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}>
                                                            <div>
                                                                <h3 className="font-semibold text-lg text-white group-hover:text-green-400 transition-colors">{post.title}</h3>
                                                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{post.content}</p>
                                                            </div>
                                                            <Badge variant="outline" className="border-slate-700 text-slate-400">{post.tags[0]}</Badge>
                                                        </div>

                                                        <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                                                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likes} Likes</span>
                                                            <button
                                                                className="flex items-center gap-1 hover:text-green-400 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedPostId(expandedPostId === post.id ? null : post.id);
                                                                }}
                                                            >
                                                                <MessageSquare className="w-3 h-3" /> {post.comments?.length || 0} Replies
                                                            </button>
                                                            <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
                                                        </div>

                                                        {/* Expanded Comments Section */}
                                                        {expandedPostId === post.id && (
                                                            <div className="mt-6 pt-4 border-t border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                                                                <h4 className="text-sm font-semibold text-slate-300 mb-4">Replies</h4>
                                                                <div className="space-y-4 mb-4">
                                                                    {post.comments && post.comments.length > 0 ? (
                                                                        post.comments.map((comment, idx) => (
                                                                            <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                                                                                <div className="flex justify-between items-center mb-1">
                                                                                    <span className="text-xs font-semibold text-green-400">{comment.author}</span>
                                                                                    <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
                                                                                </div>
                                                                                <p className="text-sm text-slate-200">{comment.text}</p>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-slate-500 italic">No replies yet. Be the first!</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Write a reply..."
                                                                        className="bg-slate-800 border-slate-700 h-9 text-sm"
                                                                        value={replyText}
                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.stopPropagation();
                                                                                handlePostReply(post.id);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 h-9"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handlePostReply(post.id);
                                                                        }}
                                                                    >
                                                                        Reply
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Ask Question Sidebar */}
                            <div className="md:col-span-1">
                                <Card className="bg-slate-900 border-slate-800 sticky top-24">
                                    <CardHeader>
                                        <CardTitle className="text-white">Ask the Community</CardTitle>
                                        <CardDescription className="text-slate-400">Get answers from experts and fellow farmers.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-300">Question Title</label>
                                            <Input
                                                placeholder="What's wrong with my tomato plants?"
                                                className="bg-black/50 border-slate-700 text-white"
                                                value={newPostTitle}
                                                onChange={(e) => setNewPostTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-300">Details</label>
                                            <Textarea
                                                placeholder="Describe the issue in detail..."
                                                className="bg-black/50 border-slate-700 text-white min-h-[120px]"
                                                value={newPostContent}
                                                onChange={(e) => setNewPostContent(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                                            onClick={handleCreatePost}
                                            disabled={isPosting}
                                        >
                                            {isPosting ? "Posting..." : "Post Question"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* LIVE CHAT TAB */}
                    <TabsContent value="chat" className="h-[600px] flex gap-4">
                        <Card className="flex-1 bg-slate-900 border-slate-800 flex flex-col">
                            {/* ... header ... */}
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Live Farmers Chat
                                </CardTitle>
                            </CardHeader>
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center text-slate-500 mt-20">Start the conversation!</div>
                                    ) : (
                                        chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex gap-3 ${msg.sender === username ? 'flex-row-reverse' : ''}`}>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-slate-800 text-slate-300">{msg.sender[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className={`rounded-lg p-3 max-w-[80%] group relative ${msg.sender === username ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                                    <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                                        <span>{msg.sender}</span>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm">{msg.text}</p>
                                                    {msg.sender !== username && (
                                                        <button
                                                            onClick={() => handleTranslate(msg.id, msg.text)}
                                                            className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:text-white"
                                                            title="Translate to Hindi"
                                                        >
                                                            <div className="w-4 h-4">A/अ</div>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                            {/* ... input ... */}
                            <div className="p-4 border-t border-slate-800 bg-black/20">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        className="bg-slate-800 border-slate-700 text-white"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700" onClick={handleSendMessage}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                        {/* ... sidebar ... */}
                        <Card className="w-64 bg-slate-900 border-slate-800 hidden md:flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">Online Farmers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {onlineUsers.map((name, i) => (
                                        <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                            <div className="relative">
                                                <Avatar className="h-8 w-8 border border-slate-700">
                                                    <AvatarFallback>{name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                                            </div>
                                            <span className="text-sm text-slate-300">{name} {name === username && '(You)'}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Community;
