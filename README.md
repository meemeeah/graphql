# GraphQL Profile Application

A modern web application that displays your school profile using GraphQL queries with authentication and interactive data visualization.

## 🚀 Features

- **Authentication**: Secure JWT-based login with username/email + password
- **Profile Data**: Three main sections (Basic Info, XP & Progress, Skills & Achievements)
- **Charts**: Four SVG-based charts for data visualization
- **Responsive**: Modern UI that works on all devices
- **Real-time**: Live data fetching from GraphQL endpoints



## 🛠️ Setup & Usage

### 1. Configure Domain
Edit `js/config.js` and replace `((DOMAIN))` with your school domain:

```javascript
GRAPHQL_ENDPOINT: 'https://YOUR_DOMAIN/api/graphql-engine/v1/graphql',
SIGNIN_ENDPOINT: 'https://YOUR_DOMAIN/api/auth/signin',
```

### 2. Run Locally
```bash
# Install dependencies (optional)
npm install

# Start development server
npm run dev

# Open http://localhost:8080
```

### 2b. Run with Go (Static File) Server
If you have Go installed, you can serve the app without npm:

```bash
# Run the Go server (serves all files in this folder)
go run .  
# if it not work u can use 
go run main.go
```

- Open [http://localhost:8080](http://localhost:8080) in your browser.
- To access from another device on your network, use your computer's local IP address (e.g., `http://192.168.1.100:8080`).

### 3. Deploy
Upload all files to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)

## 🔧 Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT with Basic Auth
- **Data**: GraphQL queries (normal, nested, with arguments)
- **Charts**: Pure SVG (no external libraries)
- **Styling**: Modern CSS Grid & Flexbox

## 📊 GraphQL Queries

The app uses three types of queries as required:

### Normal Query
```graphql
{
  user {
    id
    login
    createdAt
  }
}
```

### Nested Query
```graphql
{
  transaction {
    id
    amount
    object {
      name
      type
    }
  }
}
```

### Query with Arguments
```graphql
{
  object(where: { id: { _eq: 3323 }}) {
    name
    type
  }
}
```

## 📈 Charts & Statistics

1. **XP Progress Over Time** - Line chart showing cumulative XP
2. **Project Success Rate** - Pie chart of pass/fail ratio
3. **Audit Distribution** - Donut chart of audit statistics
4. **XP by Projects** - Bar chart of top projects

## 🎨 UI/UX Best Practices

- **Modern Design**: Clean interface with gradients and shadows
- **Responsive**: Mobile-first approach
- **Accessibility**: High contrast and keyboard navigation
- **Performance**: Optimized loading and caching
- **Error Handling**: Comprehensive error management

## 🔒 Security Features

- JWT token management with expiry handling
- Automatic logout on token expiration
- Secure credential transmission
- Error handling for authentication failures

## 🚀 Deployment

Works with any static hosting:

- **GitHub Pages**: Push to repository and enable Pages
- **Netlify**: Connect repository and deploy
- **Vercel**: Import repository and deploy
- **Traditional Hosting**: Upload files to web server

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers

## 🐛 Troubleshooting

**Login Issues**: Check domain configuration in `config.js`
**CORS Errors**: Use development server with `npm run dev`
**Chart Issues**: Verify data is loading in browser console

## 📄 License

MIT License

---

**Important**: Update the domain configuration before deployment!
