# Keeps Light

## Features

- **Create Notes**: Quickly capture thoughts with a title and content.
- **Pinning**: Pin important notes to the top of your list for easy access.
- **Color Coding**: Organize your notes visually by assigning different colors.
- **Rich UI**: A premium glassmorphism design with blur effects and smooth transitions.
- **Responsive Layout**: A masonry-style grid that adapts to different screen sizes.
- **Edit & Delete**: Easily modify or remove notes as needed.

## Tech Stack

### Frontend
- **HTML5**: Semantic structure.
- **CSS3**: Custom styling with CSS Variables, Flexbox, Grid, and Glassmorphism effects.
- **JavaScript (ES6+)**: Vanilla JS for DOM manipulation and API integration.
- **Fonts**: Google Fonts (Inter for UI, Roboto for content).
- **Icons**: Material Icons Outlined.

### Backend
- **Node.js**: Runtime environment.
- **Express.js**: Web framework for handling API requests.
- **MySQL**: Relational database for storing notes (AWS RDS in production).

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation & Setup

1.  **Clone the repository** (or download the source code):
    ```bash
    git clone git@github.com:tasbirul/Keeps-Light.git
    cd Keeps-Light
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Backend Server**:
    This will start the Express server on port 3000 and initialize the SQLite database.
    ```bash
    npm start
    ```

4.  **Run the Frontend**:
    Since this is a simple HTML/JS app, you can serve it using any static file server.
    
    Using Python (if installed):
    ```bash
    python3 -m http.server 8000
    ```
    
    Or simply open `index.html` in your browser (though some features might require a server context due to CORS/module policies).

5.  **Access the App**:
    Open your browser and navigate to `http://localhost:8000` (or whichever port your static server is running on).

## Project Structure

```
Keeps-Light/
├── public/             # Frontend files (served to users)
│   ├── index.html      # Main HTML file
│   ├── style.css       # Global styles and glassmorphism effects
│   └── app.js          # Frontend logic (API calls, DOM manipulation)
├── db.js               # Database connection setup
├── server.js           # Express backend server
├── init_db.js          # Database initialization script
├── schema.sql          # Database schema
├── package.json        # Project metadata and dependencies
├── .env.example        # Environment variables template
├── terraform/          # AWS infrastructure as code
└── README.md           # Project documentation
```

## API Endpoints

- `GET /api/notes`: Fetch all notes.
- `POST /api/notes`: Create a new note.
- `PUT /api/notes/:id`: Update an existing note.
- `DELETE /api/notes/:id`: Delete a note.

