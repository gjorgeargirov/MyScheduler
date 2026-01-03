# FocusBoard - AI-Powered Daily Planner & Project Tracker

A modern, intelligent daily planner and project management application with AI-powered scheduling, calendar integration, and Kanban board functionality.

## Features

- 📅 **Smart Calendar View** - Visualize your day with meetings and scheduled tasks
- 🤖 **AI-Powered Scheduling** - Let AI organize your tasks based on priority and preferences
- 📋 **Kanban Board** - Manage tasks across Backlog, In Progress, and Done columns
- 🎯 **Project Management** - Organize tasks by projects with color coding
- 💬 **AI Assistant** - Chat with AI to set scheduling preferences and move tasks
- 📆 **Calendar Integration** - Import meetings from Outlook calendar
- 🔄 **Auto Rollover** - Incomplete tasks automatically roll over to the next day
- 🌓 **Dark Mode** - Beautiful dark and light themes
- 💾 **Local Storage** - All data persists locally in your browser
- 📤 **Export/Import** - Backup and restore your data

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here  # Optional
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **OpenAI API** - AI scheduling
- **Microsoft Graph API** - Calendar integration
- **Lucide React** - Icons
- **Vitest** - Testing

## Project Structure

```
src/
├── components/        # React components
│   ├── Calendar/     # Calendar components
│   ├── Chat/         # Chat bot components
│   ├── Common/       # Shared components
│   ├── Forms/        # Form modals
│   └── Kanban/       # Kanban board components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── tests/            # Unit tests
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code

## Features in Detail

### AI Scheduling
- Automatically schedules tasks based on priority (high → medium → low)
- Respects user preferences (e.g., "deep work in the morning")
- Avoids conflicts with existing meetings
- Preserves task durations

### Calendar Integration
- Import meetings from Outlook calendar
- Support for recurring meetings
- Visual conflict detection
- Drag-and-drop rescheduling

### Task Management
- Create tasks with duration, priority, due dates, and notes
- Organize by projects
- Track progress on Kanban board
- Auto-rollover incomplete tasks

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
