# GiveTrack - Frontend Only

This folder contains the frontend interface extracted from the supplied GiveTrack project.

## Included
- `index.html` - Login interface
- `dashboard.html` - Main application dashboard and views
- `css/style.css` - Styling
- `js/` - Frontend JavaScript

## Open the interface
For a visual preview, open `index.html` in a browser.

## Important: backend connection
This is the frontend layer only. The supplied JavaScript calls backend endpoints such as:
- `api/auth/login`
- `api/auth/me`
- other `api/...` endpoints for dashboard and management data

Therefore, login, session verification, and live database-backed features require the GiveTrack Java Servlet backend deployed on Tomcat. Opening the HTML file directly is only a static preview and will not provide working backend features.

## Run with the complete application
Deploy the complete GiveTrack WAR/project to Apache Tomcat 9, start Tomcat, then open:
`http://localhost:8080/GiveTrack/`
