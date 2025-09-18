import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

type BlogPost = {
  id: number;
  title: string;
  htmlContent: string;
  markdownContent: string;
  imageUrl: string;
  author: string;
  date: string;
};

type Route = 'admin' | 'blog' | 'edit' | 'postDetail';

// A simple markdown to HTML converter to format the blog post.
const parseMarkdown = (text: string) => {
    const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let html = sanitizedText
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/^\s*\*[ \t]+(.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/^\s*\d+\.[ \t]+(.*$)/gim, '<ol><li>$1</li></ol>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '');

    html = html.split('\n').map(line => {
        if (line.trim() === '') return '<br />';
        if (line.startsWith('<h') || line.startsWith('<li') || line.startsWith('<ul') || line.startsWith('<ol')) {
            return line;
        }
        return `<p>${line}</p>`;
    }).join('');
    
    html = html.replace(/<br \/>\s*<p>/g, '<p>').replace(/<\/p>\s*<br \/>/g, '</p>');
    
    return html;
};

const AdminPage = ({ onPostGenerated }: { onPostGenerated: (postData: Omit<BlogPost, 'id'>) => void }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [generateImage, setGenerateImage] = useState(true);
  const [generatedImagePreview, setGeneratedImagePreview] = useState<string | null>(null);

  const ai = React.useMemo(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }, []);

  if (!ai) {
    return <div className="error-message">API_KEY environment variable not set.</div>;
  }

  const handleGenerate = async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setError('');
    setNotification('');
    setGeneratedImagePreview(null);

    try {
      // Step 1: Generate blog post text
      const textPrompt = `Write a detailed and engaging blog post about "${prompt}". The post must start with a title formatted as a Markdown H1 (e.g., "# My Title"). Follow the title with an introduction, several well-structured sections with H2 headings, and a concluding summary. The entire response must be in Markdown format.`;
      
      const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: textPrompt,
      });
      
      const postMarkdown = textResponse.text;
      const titleMatch = postMarkdown.match(/^# (.*$)/m);
      const title = titleMatch ? titleMatch[1] : 'Untitled Post';
      const contentMarkdown = postMarkdown.replace(/^# (.*$)\n?/m, '');
      const contentHtml = parseMarkdown(contentMarkdown);

      let imageUrl = 'https://via.placeholder.com/800x400.png?text=No+Image';

      // Step 2: Generate image if requested
      if (generateImage) {
        setNotification('Text generated. Now creating image...');
        const imagePrompt = `A professional and visually appealing featured image for a blog post titled: "${title}". The image should be high-quality and relevant to the topic.`;
        
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
        imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        setGeneratedImagePreview(imageUrl);
      }
      
      const postData = {
          title,
          htmlContent: contentHtml,
          markdownContent: contentMarkdown,
          imageUrl,
          author: "AI Assistant",
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      };

      onPostGenerated(postData);
      setPrompt('');
      setNotification('Blog post and image generated successfully!');

    } catch (e) {
      console.error(e);
      setError('Failed to generate content. Please check the console and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="generator-form">
        <h2>Create a New Blog Post</h2>
        <textarea
          className="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., The future of renewable energy"
          disabled={isLoading}
          aria-label="Blog post topic"
        />
        <div className="form-options">
            <label>
                <input 
                    type="checkbox"
                    checked={generateImage}
                    onChange={(e) => setGenerateImage(e.target.checked)}
                    disabled={isLoading}
                />
                Generate a featured image
            </label>
        </div>
        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
        >
          {isLoading ? 'Generating...' : 'Generate Post'}
        </button>
      </div>
      {isLoading && <div className="loader-container"><div className="loader" aria-label="Loading content"></div></div>}
      {error && <p className="error-message">{error}</p>}
      {notification && <p className="notification-message">{notification}</p>}
      {generatedImagePreview && (
        <div className="image-preview">
            <h3>Generated Image Preview:</h3>
            <img src={generatedImagePreview} alt="AI generated preview" />
        </div>
      )}
    </div>
  );
};

const EditPostPage = ({ post, onSave, onCancel }: { post: BlogPost; onSave: (updatedPostData: { id: number, title: string, markdownContent: string }) => void; onCancel: () => void; }) => {
  const [title, setTitle] = useState(post.title);
  const [markdownContent, setMarkdownContent] = useState(post.markdownContent);

  const handleSave = () => {
    onSave({ id: post.id, title, markdownContent });
  };

  return (
    <div className="page-content">
      <div className="edit-post-form">
        <h2>Edit Blog Post</h2>
        {post.imageUrl && (
            <div className="edit-image-container">
                <img src={post.imageUrl} alt={post.title} />
            </div>
        )}
        <label htmlFor="edit-title">Title</label>
        <input
          id="edit-title"
          type="text"
          className="prompt-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor="edit-content">Content (Markdown)</label>
        <textarea
          id="edit-content"
          className="prompt-input"
          style={{ minHeight: '300px' }}
          value={markdownContent}
          onChange={(e) => setMarkdownContent(e.target.value)}
        />
        <div className="form-actions">
            <button
            className="cancel-button"
            onClick={onCancel}
            >
            Cancel
            </button>
            <button
            className="save-button"
            onClick={handleSave}
            >
            Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

const BlogPage = ({ posts, onEdit, onViewPost }: { posts: BlogPost[], onEdit: (post: BlogPost) => void, onViewPost: (post: BlogPost) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const POSTS_PER_PAGE = 6;
  
    // Memoize filtered and sorted posts for performance
    const filteredAndSortedPosts = React.useMemo(() => {
      let processedPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
      processedPosts.sort((a, b) => {
        switch (sortOrder) {
          case 'oldest':
            return a.id - b.id;
          case 'titleAsc':
            return a.title.localeCompare(b.title);
          case 'titleDesc':
            return b.title.localeCompare(a.title);
          case 'newest':
          default:
            return b.id - a.id;
        }
      });
  
      return processedPosts;
    }, [posts, searchQuery, sortOrder]);
  
    // Reset to page 1 when filters change
    React.useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, sortOrder]);
  
    // Pagination logic
    const indexOfLastPost = currentPage * POSTS_PER_PAGE;
    const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
    const currentPosts = filteredAndSortedPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE);
  
    const paginate = (pageNumber: number) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      setCurrentPage(pageNumber);
    };

  if (posts.length === 0) {
    return (
      <div className="page-content">
        <p className="placeholder-text">No blog posts yet. Go to the Admin page to create one!</p>
      </div>
    );
  }

  return (
    <div className="page-content">
        <div className="blog-controls">
            <input
                type="text"
                placeholder="Search posts by title..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search posts"
            />
            <select
                className="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                aria-label="Sort posts"
            >
                <option value="newest">Sort by: Newest</option>
                <option value="oldest">Sort by: Oldest</option>
                <option value="titleAsc">Sort by: Title (A-Z)</option>
                <option value="titleDesc">Sort by: Title (Z-A)</option>
            </select>
        </div>

        <h2>Latest Posts</h2>

        {filteredAndSortedPosts.length > 0 ? (
            <>
                <div className="blog-grid">
                {currentPosts.map(post => (
                    <article key={post.id} className="blog-card">
                        <img className="blog-card-image" src={post.imageUrl} alt={post.title} />
                        <div className="blog-card-content">
                            <h3 className="blog-card-title">{post.title}</h3>
                            <p className="blog-card-meta">By {post.author} on {post.date}</p>
                            <div className="blog-card-actions">
                                <button className="read-more-button" onClick={() => onViewPost(post)}>
                                    Read More
                                </button>
                                <button className="edit-button" onClick={() => onEdit(post)} aria-label={`Edit post titled ${post.title}`}>
                                    Edit
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-button"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            &larr; Previous
                        </button>
                        <span className="page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="pagination-button"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next &rarr;
                        </button>
                    </div>
                )}
            </>
        ) : (
            <p className="placeholder-text">No posts match your search criteria.</p>
        )}
    </div>
  );
};

const PostDetailPage = ({ post, onBack }: { post: BlogPost; onBack: () => void; }) => {
    return (
        <div className="page-content post-detail-page">
            <button className="back-button" onClick={onBack}>&larr; Back to Blog</button>
            <article className="post-detail-content">
                <h1 className="post-detail-title">{post.title}</h1>
                <p className="post-detail-meta">By {post.author} on {post.date}</p>
                <img className="post-detail-image" src={post.imageUrl} alt={post.title} />
                <div
                    className="blog-post-content"
                    dangerouslySetInnerHTML={{ __html: post.htmlContent }}
                />
            </article>
        </div>
    );
};


const App = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [route, setRoute] = useState<Route>('admin');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  
  // Logo from metadata.json
  const logo = "data:image/png;base64, ind9en"
  
  const handleAddPost = (postData: Omit<BlogPost, 'id'>) => {
    const newPost: BlogPost = { id: Date.now(), ...postData };
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setRoute('blog');
  };

  const handleStartEdit = (post: BlogPost) => {
    setEditingPost(post);
    setRoute('edit');
  };
  
  const handleViewPost = (post: BlogPost) => {
    setViewingPost(post);
    setRoute('postDetail');
  };
  
  const handleBackToBlog = () => {
      setViewingPost(null);
      setRoute('blog');
  }

  const handleCancelEdit = () => {
    setEditingPost(null);
    setRoute('blog');
  };

  const handleSavePost = (updatedPostData: { id: number, title: string, markdownContent: string }) => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === updatedPostData.id) {
        return {
          ...p,
          title: updatedPostData.title,
          markdownContent: updatedPostData.markdownContent,
          htmlContent: parseMarkdown(updatedPostData.markdownContent),
        };
      }
      return p;
    }));
    setEditingPost(null);
    setRoute('blog');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
            // <img src={logo} alt="Blog Logo" />
            <h1>AI-Powered Blog Generator</h1>
        </div>
        <nav className="main-nav">
          <button
            className={`nav-button ${route === 'admin' ? 'active' : ''}`}
            onClick={() => setRoute('admin')}
          >
            Admin
          </button>
          <button
            className={`nav-button ${route === 'blog' ? 'active' : ''}`}
            onClick={() => setRoute('blog')}
          >
            Blog
          </button>
        </nav>
      </header>
      <main>
        {route === 'admin' && <AdminPage onPostGenerated={handleAddPost} />}
        {route === 'blog' && <BlogPage posts={posts} onEdit={handleStartEdit} onViewPost={handleViewPost} />}
        {route === 'edit' && editingPost && <EditPostPage post={editingPost} onSave={handleSavePost} onCancel={handleCancelEdit} />}
        {route === 'postDetail' && viewingPost && <PostDetailPage post={viewingPost} onBack={handleBackToBlog} />}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);