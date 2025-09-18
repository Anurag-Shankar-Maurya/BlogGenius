# BlogGenius: AI-Powered Blog Generator

BlogGenius is a modern, single-page web application that leverages the power of the Google Gemini API to automate the creation of blog content. Simply provide a topic, and BlogGenius will generate a complete, well-structured blog post with a relevant featured image.

---

## ✨ Features

*   **📝 AI Content Generation:** Enter any topic, and the app uses `gemini-2.5-flash` to generate a complete blog post, including a title, introduction, structured sections with headings, and a conclusion, all formatted in Markdown.
*   **🖼️ AI Image Generation:** Optionally, generate a high-quality, relevant featured image for each post using `imagen-4.0-generate-001`. The aspect ratio is automatically set to a blog-friendly 16:9.
*   **✏️ Full CMS Functionality:**
    *   **Create:** Generate new posts from the Admin dashboard.
    *   **Read:** View all posts on a beautifully designed, responsive blog grid. Click "Read More" to see the full post content.
    *   **Update:** Edit the title and content of any existing post using a simple Markdown editor.
*   **🔍 Powerful Browsing Tools:**
    *   **Live Search:** Instantly filter blog posts by title as you type.
    *   **Sorting Options:** Sort posts by newest, oldest, or alphabetically by title (A-Z, Z-A).
    *   **Pagination:** Easily navigate through a large number of posts.
*   **💅 Modern & Responsive UI:** Built with a sleek dark theme, the user interface is fully responsive and provides a great experience on both desktop and mobile devices.

---

## ⚙️ How It Works

The application is built entirely on the frontend using React and the `@google/genai` SDK.

1.  **User Input:** On the **Admin** page, the user enters a topic for a new blog post.
2.  **Text Generation:** The app sends a detailed prompt to the Gemini API (`gemini-2.5-flash`) asking for a blog post in Markdown format.
3.  **Image Generation (Optional):** If the user chooses to generate an image, a second API call is made to the Imagen API (`imagen-4.0-generate-001`) with a prompt derived from the generated post's title.
4.  **State Management:** The newly generated post (including title, content, and image URL) is added to the application's state in React.
5.  **Display & Management:** The post immediately appears on the **Blog** page, where it can be viewed, searched, sorted, and edited. Edits are saved to the local state.

---

## 🛠️ Tech Stack

*   **Frontend:** React
*   **AI Models:**
    *   Google Gemini 2.5 Flash (for text generation)
    *   Google Imagen 4.0 (for image generation)
*   **SDK:** `@google/genai` for JavaScript
*   **Styling:** Custom CSS with a dark mode theme and modern design principles.
*   **Fonts:** Google Fonts (Inter for sans-serif, Lora for serif content).

---

## 🚀 Getting Started

To run this project, you need a Google Gemini API key.

### Prerequisites

*   A modern web browser.
*   A Google Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Running

This project is designed to run in an environment where the API key is provided as an environment variable.

1.  **Set up the API Key:**
    The application is hard-coded to look for the API key in `process.env.API_KEY`. You must ensure this environment variable is set in the execution environment where you are running the app.

2.  **Open the Application:**
    Once the environment variable is set, simply open the `index.html` file in your web browser. The application will initialize and be ready to use.

---

## 📂 Project Structure

```
.
├── index.html       # The main HTML file, entry point of the app.
├── index.css        # All styles for the application.
├── index.tsx        # The core React application logic, including all components and API calls.
└── metadata.json    # Application metadata.
└── README.md        # Project documentation.
```

*   `index.tsx`: Contains all React components (`App`, `AdminPage`, `BlogPage`, etc.), state management logic, and interactions with the Google GenAI SDK.
*   `index.html`: Sets up the root container for the React app and uses an `importmap` to manage JavaScript module dependencies.
*   `index.css`: Defines the visual appearance, layout, and responsiveness of the application, including the dark theme.
