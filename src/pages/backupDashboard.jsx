import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import TypewriterMessage from '../components/TypewriterMessage'
import ImageMessage from '../components/ImageMessage'
import { sendMessage } from '../lib/openrouter'
import ExcelProcessor from '../components/ExcelProcessor'
import * as XLSX from 'xlsx'
import { analyzeSentiment } from '../lib/nlp';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, coy } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Tesseract from 'tesseract.js';

export default function Dashboard() {
  const { session } = useAuth()
  const [userEmail, setUserEmail] = useState('')
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedModel, setSelectedModel] = useState('DeepSeek-R1')
  const [editingTitle, setEditingTitle] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [excelFile, setExcelFile] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const excelInputRef = useRef(null)
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20; // Number of messages to load per page

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email)
      loadConversations()
    }
  }, [session])

  useEffect(() => {
    if (currentConversationId) {
      setMessages([]); // Clear previous messages
      setOffset(0); // Reset offset
      setHasMore(true); // Reset hasMore
      loadMessages(currentConversationId, 0, limit);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      setConversations(data)
      if (data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id)
      }
    } catch (error) {
      toast.error('Error loading conversations')
      console.error('Error:', error)
    }
  }

  const loadMessages = async (conversationId, offset = 0, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
  
      if (error) throw error;
  
      setMessages(prev => [...prev, ...data]);
    } catch (error) {
      toast.error('Error loading messages');
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/login')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return;
  
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
  
      const { error: uploadError } = await supabase.storage
        .from('message-images')
        .upload(filePath, file);
  
      if (uploadError) throw uploadError;
  
      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath);
  
      const response = await fetch(publicUrl);
      const blob = await response.blob();
  
      const img = new Image();
      img.src = URL.createObjectURL(blob);
  
      await new Promise((resolve) => {
        img.onload = resolve;
      });
  
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
  
      ctx.drawImage(img, 0, 0);
  
      // Improved preprocessing (with adaptive thresholding or alternative methods)
      preprocessImage(ctx, canvas.width, canvas.height);
  
      const preprocessedImageUrl = canvas.toDataURL('image/png');
  
      const { data: { text } } = await Tesseract.recognize(preprocessedImageUrl, 'eng', {
        logger: (m) => console.log(m),
        tessedit_char_whitelist: '0123456789+-=?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+[]{}|;:,.<>~', // Include '?'
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Use automatic page segmentation
      });
  
      // Post-processing (error correction for common misinterpretations)
      const correctedText = text.replace(/7/g, '?'); // Replace '7' with '?', adjust if needed
  
      return { publicUrl, text: correctedText };
    } catch (error) {
      toast.error('Error uploading image');
      console.error('Error:', error);
      return null;
    }
  };
  
  
  // Additional Image Preprocessing Steps
  const preprocessImage = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
  
    // Grayscale conversion (you already have this)
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
    }
  
    // Thresholding (convert to black & white)
    for (let i = 0; i < data.length; i += 4) {
      const avg = data[i];
      const threshold = avg > 128 ? 255 : 0;
      data[i] = threshold; // Red
      data[i + 1] = threshold; // Green
      data[i + 2] = threshold; // Blue
    }
  
    ctx.putImageData(imageData, 0, 0);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !isProcessing) {
      setIsProcessing(true);
      const newOffset = offset + limit;
      loadMessages(currentConversationId, newOffset, limit).then(() => {
        setOffset(newOffset);
        setIsProcessing(false);
        if (messages.length < limit) {
          setHasMore(false);
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !imageFile) || isProcessing || !currentConversationId) return;
  
    setIsProcessing(true);
    try {
      let messageContent = input;
      let imageUrl = null;
      let ocrText = '';
  
      if (imageFile) {
        const uploadResult = await handleImageUpload(imageFile);
        if (!uploadResult) {
          setIsProcessing(false);
          return;
        }
        imageUrl = uploadResult.publicUrl;
        ocrText = uploadResult.text;
        messageContent = JSON.stringify({ text: input, image: imageUrl, ocr: ocrText });
      }
  
      const sentiment = analyzeSentiment(messageContent);
      console.log('Sentiment:', sentiment);
  
      const userMessage = {
        role: 'user',
        content: messageContent,
        conversation_id: currentConversationId,
      };
  
      const { data: userMessageData, error: userMessageError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single();
  
      if (userMessageError) throw userMessageError;
  
      setInput('');
      setImageFile(null);
      setMessages((prev) => [...prev, userMessageData]);
  
      // Get previous messages for context
      const conversationMessages = messages.slice(-5); // Last 5 messages for context
      conversationMessages.push(userMessageData);
  
      // Get AI response from OpenRouter
      const aiResponse = await sendMessage(conversationMessages);
  
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        conversation_id: currentConversationId,
      };
  
      const { data: assistantMessageData, error: assistantMessageError } = await supabase
        .from('messages')
        .insert(assistantMessage)
        .select()
        .single();
  
      if (assistantMessageError) throw assistantMessageError;
  
      setMessages((prev) => [...prev, assistantMessageData]);
    } catch (error) {
      toast.error('Error sending message');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      setImageFile(file)
      setExcelFile(null)
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'text/csv' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv')
    ) {
      setExcelFile(file)
      setImageFile(null)
    } else {
      toast.error('Please select a valid image or spreadsheet file')
    }
  }

  const handleExcelAnalysis = async (analysis) => {
    const summary = `Excel Analysis Results:\n\n` +
      `File: ${excelFile.name}\n` +
      `Rows: ${analysis.rowCount}\n` +
      `Columns: ${analysis.columnCount}\n\n` +
      `Columns: ${analysis.columns.join(', ')}\n\n` +
      `Numeric Column Statistics:\n` +
      Object.entries(analysis.summary)
        .map(([col, stats]) => 
          `${col}:\n` +
          `  Mean: ${stats.mean.toFixed(2)}\n` +
          `  Min: ${stats.min.toFixed(2)}\n` +
          `  Max: ${stats.max.toFixed(2)}\n` +
          `  Std Dev: ${stats.std.toFixed(2)}`
        )
        .join('\n\n') +
      '\n\nData Preview:\n' +
      JSON.stringify(analysis.preview, null, 2)

    setInput(summary)
    setExcelFile(null)
  }

  const deleteMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(prev => prev.filter(message => message.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      toast.error('Error deleting message')
      console.error('Error:', error)
    }
  }

  const renderMessageContent = (message) => {
    try {
      const content = JSON.parse(message.content);
      if (content.image) {
        return (
          <div className="space-y-2">
            {content.text && <p className="mb-2">{content.text}</p>}
            <ImageMessage 
              imageUrl={content.image}
              onOCRComplete={(text) => {
                console.log('OCR Text:', text);
                // Optionally save the OCR result here
              }}
            />
            {content.ocr && <p className="mt-2 text-sm text-gray-500">OCR Text: {content.ocr}</p>}
          </div>
        );
      }
    } catch {
      const codeBlockRegex = /```([\s\S]*?)```/g;
      const parts = message.content.split(codeBlockRegex);
  
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <SyntaxHighlighter 
              key={index} 
              language="javascript" 
              style={isDarkMode ? atomDark : coy}
            >
              {part}
            </SyntaxHighlighter>
          );
        }
        return <span key={index}>{part}</span>;
      });
    }
  };

  const startNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: session.user.id,
          title: 'New Chat'
        })
        .select()
        .single()

      if (error) throw error

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          role: 'assistant',
          content: 'Hello! How can I help you today?'
        })

      if (messageError) throw messageError

      await loadConversations()
      setCurrentConversationId(data.id)
      toast.success('New chat started')
    } catch (error) {
      toast.error('Error creating new chat')
      console.error('Error:', error)
    }
  }

  const selectConversation = (conversationId) => {
    setCurrentConversationId(conversationId)
    setEditingTitle(null)
  }

  const updateConversationTitle = async (id) => {
    if (!newTitle.trim()) return
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', id)

      if (error) throw error

      setEditingTitle(null)
      loadConversations()
    } catch (error) {
      toast.error('Error updating title')
    }
  }

  const deleteConversation = async (id) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Conversation deleted')
      loadConversations()
      if (id === currentConversationId) {
        setCurrentConversationId(null)
        setMessages([])
      }
    } catch (error) {
      toast.error('Error deleting conversation')
    }
  }

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
        <div className="p-4">
          <button
            onClick={startNewChat}
            className={`w-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg p-3 flex items-center gap-2 transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-2 hover:bg-opacity-50 ${
                currentConversationId === conversation.id ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-200') : ''
              }`}
            >
              {editingTitle === conversation.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateConversationTitle(conversation.id)}
                    className={`flex-1 px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'}`}
                    autoFocus
                  />
                  <button
                    onClick={() => updateConversationTitle(conversation.id)}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => selectConversation(conversation.id)}
                    className="flex-1 text-left truncate"
                  >
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {conversation.title}
                    </span>
                  </button>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTitle(conversation.id)
                        setNewTitle(conversation.title)
                      }}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteConversation(conversation.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Settings</div>
          <div className="space-y-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`w-full p-2 rounded-lg outline-none ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
              }`}
            >
              <option value="DeepSeek-R1">DeepSeek-R1 72B</option>
              <option value="GPT-3.5">GPT-3.5</option>
              <option value="GPT-4">GPT-4</option>
            </select>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full p-2 rounded-lg ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
              }`}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {userEmail}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`p-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className={isDarkMode ? 'text-white' : 'text-gray-900'}>My AI Coding Assistant</div>
          <div className="w-6"></div>
        </header>

        {/* Chat Messages */}
        <div
  className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
  onScroll={handleScroll}
>
  {messages.map((message, index) => (
    <div
      key={message.id || `temp-${index}`}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className="group relative flex items-start gap-2">
        {message.role !== 'user' && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            AI
          </div>
        )}
        <div
          className={`max-w-[80%] p-4 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-600 text-white'
              : isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
          }`}
        >
          {renderMessageContent(message)}
          <div className="text-xs text-gray-400 mt-2">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
        {message.role === 'user' && (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
            U
          </div>
        )}
        {message.id && (
          <button
            onClick={() => deleteMessage(message.id)}
            className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  ))}
  {isProcessing && (
    <div className="flex justify-start">
      <div className={`p-4 rounded-lg flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
        <div className="animate-pulse">Loading...</div>
      </div>
    </div>
  )}
  <div ref={messagesEndRef} />
</div>

        {/* Input Form */}
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
      </div>
    </div>
  )
}