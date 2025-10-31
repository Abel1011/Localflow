# Local Flow

A privacy-focused AI workflow builder created for the **Google Chrome Built-in AI Challenge 2025**. Build powerful AI pipelines using Chrome's built-in AI APIs without external servers, API keys, or cloud dependencies.

## Overview

Local Flow is a Next.js application that leverages Chrome's experimental on-device AI capabilities to provide a visual workflow builder for AI-powered text processing. All AI operations run entirely in your browser, ensuring complete data privacy and security.

## Features

- **100% Local Processing**: All AI operations execute on-device using Chrome's built-in AI models
- **Visual Workflow Builder**: Drag-and-drop interface powered by React Flow for creating complex AI pipelines
- **Multiple AI Operations**: Access to various AI capabilities including:
  - Prompt API (Custom AI prompts)
  - Writer API (Content generation)
  - Rewriter API (Text transformation)
  - Summarizer API (Text summarization)
  - Proofreader API (Grammar and style correction)
  - Translator API (Language translation)
- **Multi-format Input Support**: Process text, PDF documents, images, and audio files
- **Workflow Persistence**: Save and load workflows locally in your browser
- **Batch Processing**: Execute workflows on multiple inputs simultaneously
- **No API Keys Required**: Powered entirely by Chrome's built-in AI capabilities
- **Privacy-First**: Your data never leaves your device

## Prerequisites

- **Chrome 131 or later** (Canary, Dev, or Beta channels recommended)
- Node.js 18+ and npm

## Chrome Setup

Before using Local Flow, you need to enable Chrome's experimental AI features:

1. Navigate to `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
2. Enable the flag and restart Chrome
3. Verify model availability at `chrome://on-device-internals`
4. Download required AI models through the application's Model Management interface

Note: Model downloads require user interaction and may take several minutes depending on your internet connection. Once downloaded, models are cached locally.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/hackaton-chrome.git
cd hackaton-chrome
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome to access the application.

## Building for Production

Create an optimized production build:

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── flows/             # Workflow management pages
│   ├── prompt/            # Prompt API playground
│   ├── writer/            # Writer API playground
│   ├── rewriter/          # Rewriter API playground
│   ├── summarizer/        # Summarizer API playground
│   ├── proofreader/       # Proofreader API playground
│   └── translator/        # Translator API playground
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── workflow/         # Workflow-specific components
└── lib/                  # Utility libraries
    ├── workflowEngine.js # Workflow execution engine
    └── workflowStorage.js # Local storage management
```

## How It Works

### Workflow Builder

1. Create workflow nodes for different AI operations
2. Define input sources (text, PDF, images, audio)
3. Connect nodes to create processing pipelines
4. Configure each node with specific parameters
5. Execute the workflow and view results in real-time

### Supported Node Types

- **Input Node**: Provide text input or upload files
- **PDF Input Node**: Extract text from PDF documents
- **Image Input Node**: Process images (requires multimodal support)
- **Audio Input Node**: Transcribe audio files
- **Prompt Node**: Execute custom AI prompts
- **Writer Node**: Generate content with specific tone and length
- **Rewriter Node**: Transform text with different styles
- **Summarizer Node**: Create summaries with configurable length and format
- **Proofreader Node**: Check and correct grammar and style
- **Translator Node**: Translate text between languages

### Variable System

Nodes can reference outputs from previous nodes using the `{{nodeId}}` syntax, enabling dynamic data flow through the workflow.

## Technology Stack

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **React Flow**: Visual workflow builder
- **Tailwind CSS 4**: Utility-first styling
- **Lucide React**: Icon library
- **PDF.js**: PDF parsing
- **PapaParse**: CSV processing
- **Marked**: Markdown rendering

## Browser API Usage

This project utilizes Chrome's experimental AI APIs:

- `window.ai.languageModel` - Prompt API
- `window.ai.writer` - Writer API
- `window.ai.rewriter` - Rewriter API
- `window.ai.summarizer` - Summarizer API
- `window.translation` - Translation API

These APIs are currently experimental and subject to change.

## Limitations

- Requires Chrome 131+ with experimental flags enabled
- AI models must be downloaded before use (one-time process)
- Model availability depends on Chrome version and system resources
- Some APIs may not be available on all systems
- Multimodal features (image/audio) require additional flags

## Contributing

This project was created for the Google Chrome Built-in AI Challenge 2025. Contributions, issues, and feature requests are welcome.

## License

This project is licensed under the MIT License.

## Acknowledgments

Created for the Google Chrome Built-in AI Challenge 2025, showcasing the potential of privacy-preserving, on-device AI processing.
