# AI Assistant Web Application

This project is a web-based AI assistant application built using React, Vite, and Supabase. It features user authentication, chat functionality, and the ability to process and analyze images and Excel files.

## Reason for Building

I built this AI assistant to help myself with coding tasks. As someone who feels shy about using AI tools in front of other developers, I wanted to create my own AI assistant to provide the support I need without feeling self-conscious. This project allows me to leverage AI capabilities in a personalized and private manner.

This project is a web-based AI assistant application built using React, Vite, and Supabase. It features user authentication, chat functionality, and the ability to process and analyze images and Excel files.

## Project Structure

The project is organized into several directories and files:

- **Root Directory**: Contains configuration files like `.env`, `package.json`, `vite.config.js`, and `tailwind.config.js`.
- **src**: Main source directory containing the application code.
  - **components**: Contains reusable React components like `ExcelProcessor`, `ImageMessage`, and `TypewriterMessage`.
  - **context**: Contains context providers like `AuthContext` for managing authentication state.
  - **lib**: Contains utility functions and API clients like `supabase.js`, `openrouter.js`, and `nlp.js`.
  - **pages**: Contains main page components like `Dashboard`, `Login`, and `Signup`.
  - **index.css**: Contains global CSS styles using Tailwind CSS.
  - **main.jsx**: Entry point of the React application.

## Key Components and Functionality

### Authentication

- Managed using Supabase's authentication service.
- `AuthContext` provides authentication state and session management.
- `Login` and `Signup` pages handle user login and registration.

### Chat Functionality

- `Dashboard` component is the main chat interface.
- Users can start new conversations, send messages, and view message history.
- Messages are stored in Supabase and retrieved using the `supabase` client.

### File Processing

- `ExcelProcessor` component processes and analyzes Excel files using the `xlsx` library.
- `ImageMessage` component processes images and performs OCR using the `tesseract.js` library.

### AI Integration

- `openrouter.js` handles communication with the OpenRouter AI API for generating AI responses.
- `nlp.js` provides text processing and sentiment analysis using the `compromise` and `sentiment` libraries.

```markdown
# AI Assistant Web Application

This project is a web-based AI assistant application built using React, Vite, and Supabase. It features user authentication, chat functionality, and the ability to process and analyze images and Excel files.

## Project Structure

The project is organized into several directories and files:

- **Root Directory**: Contains configuration files like `.env`, `package.json`, `vite.config.js`, and `tailwind.config.js`.
- **src**: Main source directory containing the application code.
  - **components**: Contains reusable React components like `ExcelProcessor`, `ImageMessage`, and `TypewriterMessage`.
  - **context**: Contains context providers like `AuthContext` for managing authentication state.
  - **lib**: Contains utility functions and API clients like `supabase.js`, `openrouter.js`, and `nlp.js`.
  - **pages**: Contains main page components like `Dashboard`, `Login`, and `Signup`.
  - **index.css**: Contains global CSS styles using Tailwind CSS.
  - **main.jsx**: Entry point of the React application.

## Key Components and Functionality

### Authentication

- Managed using Supabase's authentication service.
- `AuthContext` provides authentication state and session management.
- `Login` and `Signup` pages handle user login and registration.

### Chat Functionality

- `Dashboard` component is the main chat interface.
- Users can start new conversations, send messages, and view message history.
- Messages are stored in Supabase and retrieved using the `supabase` client.

### File Processing

- `ExcelProcessor` component processes and analyzes Excel files using the `xlsx` library.
- `ImageMessage` component processes images and performs OCR using the `tesseract.js` library.

### AI Integration

- `openrouter.js` handles communication with the OpenRouter AI API for generating AI responses.
- `nlp.js` provides text processing and sentiment analysis using the `compromise` and `sentiment` libraries.

## Example Code Analysis

The `Dashboard` component is a key part of the application, providing the chat interface and handling various functionalities like message sending, file uploads, and conversation management. Here is an analysis of the relevant code excerpt:

```jsx
// Input Form
<div className={`border-t p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="flex gap-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className={`flex-1 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDarkMode 
            ? 'bg-gray-700 text-white placeholder-gray-400' 
            : 'bg-gray-100 text-gray-900 placeholder-gray-500'
        }`}
        disabled={isProcessing || !currentConversationId}
      />
      <button
        type="submit"
        disabled={isProcessing || (!input.trim() && !imageFile && !excelFile) || !currentConversationId}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </div>

    {imageFile && (
      <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
        <span className="text-sm text-gray-300">{imageFile.name}</span>
        <button
          type="button"
          onClick={() => setImageFile(null)}
          className="text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>
    )}

    {excelFile && (
      <ExcelProcessor
        file={excelFile}
        onProcessed={handleExcelAnalysis}
      />
    )}

    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => {
            fileInputRef.current.accept = 'image/*';
            fileInputRef.current.click();
          }}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          Attach Image
        </button>
        <button
          type="button"
          onClick={() => {
            fileInputRef.current.accept = '.xlsx,.xls,.csv';
            fileInputRef.current.click();
          }}
          className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          Upload Spreadsheet
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  </form>
</div>
```

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/ai-assistant.git
   cd ai-assistant
   ```

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

3. Create a .env file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Running the Application

1. Start the development server:
   ```sh
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser and navigate to `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
```


Similar code found with 2 license types