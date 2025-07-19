# WhatsApp Community Analytics

A simple web application that allows community managers to upload WhatsApp group chat exports and gain insights into member engagement, resources shared, and community activity patterns.

## Features

- **File Upload Interface**: Drag-and-drop WhatsApp chat export (.txt) files
- **Member Directory**: Searchable member list with activity metrics and engagement patterns
- **AI-Powered Recap**: GPT-4 powered insights for different time ranges with key topics and decisions
- **Resource Hub**: Automatically extracted and categorized links, tools, and documents
- **Analytics Dashboard**: Interactive charts showing message volume, hourly patterns, and top contributors
- **Data Export**: Download analysis results as JSON

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Exporting WhatsApp Chat

1. Open your WhatsApp group chat
2. Tap the group name at the top
3. Scroll down and tap "Export Chat"
4. Choose "Without Media" for faster processing
5. Save the .txt file

### Using the Application

1. **Upload**: Drag and drop your WhatsApp export file or click to browse
2. **Processing**: Wait 30-60 seconds for analysis to complete
3. **Explore**: Use the tabbed interface to view different insights:
   - **Analytics**: Overview metrics and interactive charts
   - **Member Directory**: Detailed member profiles and activity
   - **AI Recap**: AI-generated insights for different time periods
   - **Resource Hub**: Extracted links, tools, and documents

## File Format Support

The application supports standard WhatsApp export format:
```
[MM/DD/YY, HH:MM:SS AM/PM] Name: Message content
```

Handles various message types:
- Text messages
- Attachments (images, videos, documents)
- System messages (member joins/leaves, etc.)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI recap features | Yes |

## Privacy & Security

- **No Data Persistence**: All analysis is done in-memory and browser storage
- **Client-Side Processing**: Chat parsing happens in the browser
- **Ephemeral Sessions**: Data is cleared when you start a new analysis
- **No File Storage**: Uploaded files are processed and discarded immediately

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add the `OPENAI_API_KEY` environment variable in Vercel dashboard
4. Deploy
