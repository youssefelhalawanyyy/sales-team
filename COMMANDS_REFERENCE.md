# Command Reference & Development Guide

## 🚀 Essential Commands

### Development
```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Deploy (if using Firebase)
firebase deploy
```

### Installation & Setup
```bash
# Install all dependencies
npm install

# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update dependencies
npm update
```

### Cleanup & Maintenance
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📁 File Structure Reference

```
src/
├── firebase.js           # Firebase config (don't expose API keys in production)
├── App.js                # Main app routing
├── App.css               # App styles
├── index.js              # React entry point
│
├── contexts/
│   └── AuthContext.js    # All auth logic here
│
├── components/
│   ├── Navigation.js     # Navbar component
│   └── ProtectedRoute.js # Route guard
│
└── pages/
    ├── LoginPage.js      # /login route
    ├── Dashboard.js      # /dashboard route
    ├── AdminUsersPage.js # /admin/users route
    ├── FinancePage.js    # /finance route
    ├── SalesDealsPage.js # /sales/deals route
    ├── AchievementsPage.js # /sales/achievements route
    └── TeamManagementPage.js # /sales/teams route
```

## 🔗 Route Map

```
/login                    # Login page
/dashboard                # Main dashboard (all roles)
/admin/users              # Admin only - User management
/finance                  # Finance manager/Admin only
/sales/deals              # Sales operations
/sales/achievements       # Member achievements
/sales/teams              # Team management
```

## 🔐 User Roles Reference

```javascript
const ROLES = {
  admin: "Full access",
  finance_manager: "Finance operations only",
  sales_manager: "All sales operations",
  team_leader: "Team operations",
  sales_member: "Individual operations"
}
```

## 💾 Firebase Collections

### Users
```
/users/{uid}
  - email
  - firstName
  - lastName
  - role
  - isActive
  - createdAt
```

### Finance
```
/finances/data/incomes/{id}
/finances/data/expenses/{id}
/finances/data/transfers/{id}
```

### Sales
```
/sales/deals/records/{id}
/finance/deals/pending/{id}
```

### Teams
```
/teams/{id}
/teamMembers/{id}
```

## 🛠️ Common Development Tasks

### Add a New Page

1. Create file: `src/pages/NewPage.js`
```javascript
export const NewPage = () => {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
};
```

2. Import in `App.js`:
```javascript
import { NewPage } from './pages/NewPage';
```

3. Add route in `App.js`:
```javascript
<Route
  path="/new-page"
  element={
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewPage />
      </div>
    </ProtectedRoute>
  }
/>
```

4. Add to navigation in `Navigation.js`:
```javascript
{ label: 'New Page', path: '/new-page' }
```

### Modify Styling

1. Update `tailwind.config.js` for theme changes
2. Add custom CSS in component or `App.css`
3. Use Tailwind classes in JSX

### Add Database Collection

1. Create in Firebase Console
2. Add to component:
```javascript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const fetchData = async () => {
  const snapshot = await getDocs(collection(db, 'collection-name'));
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### Add Form Input

```javascript
const [formData, setFormData] = useState({
  fieldName: ''
});

<input
  type="text"
  value={formData.fieldName}
  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

## 🎨 Tailwind CSS Common Classes

```javascript
// Layout
className="flex flex-col md:flex-row"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Spacing
className="p-6 mb-4"      // padding & margin-bottom
className="px-4 py-2"     // horizontal & vertical padding

// Colors
className="bg-blue-600 text-white"
className="text-red-500"
className="border border-gray-300"

// Responsive
className="hidden md:block"   // hidden on mobile
className="text-sm md:text-lg" // responsive text

// Hover
className="hover:bg-blue-700 transition"
```

## 📊 Data Manipulation Examples

### Create Document
```javascript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'collection-name'), {
  field1: 'value',
  field2: 123,
  createdAt: serverTimestamp()
});
```

### Read Documents
```javascript
import { getDocs, collection } from 'firebase/firestore';

const snapshot = await getDocs(collection(db, 'collection-name'));
const data = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Query Documents
```javascript
import { query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'collection'),
  where('field', '==', 'value')
);
const snapshot = await getDocs(q);
```

### Update Document
```javascript
import { updateDoc, doc } from 'firebase/firestore';

await updateDoc(doc(db, 'collection', 'doc-id'), {
  field: 'new-value'
});
```

### Delete Document
```javascript
import { deleteDoc, doc } from 'firebase/firestore';

await deleteDoc(doc(db, 'collection', 'doc-id'));
```

## 🔍 Debugging

### Console Logging
```javascript
console.log('Debug:', data);
console.error('Error:', error);
console.warn('Warning:', message);
```

### Browser DevTools
```
F12                  # Open DevTools
Ctrl+Shift+I         # Open DevTools
→ Console tab        # View logs
→ Network tab        # View requests
→ Application tab    # View stored data
```

### React DevTools
- Install: React Developer Tools extension
- Inspect components and state
- Check props and context

## 🧪 Testing Scenarios

### Test Login Flow
1. Go to /login
2. Enter: admin@sales.com / Demo@123
3. Should redirect to /dashboard

### Test Role Access
1. Login as different users
2. Check navigation menu changes
3. Try accessing restricted routes

### Test Data Creation
1. Create deal as sales member
2. Check Firestore database
3. Verify data appears in table

### Test Calculations
1. Create deal with price $1000
2. Close deal
3. Verify 20% commission ($200) is calculated

## 📦 Dependencies Installed

```json
{
  "firebase": "^12.8.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^7.13.0",
  "react-scripts": "5.0.1",
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x",
  "date-fns": "^latest",
  "recharts": "^latest",
  "lucide-react": "^latest"
}
```

## 🔧 Environment Variables

Create `.env.local` (not in git):
```
REACT_APP_FIREBASE_API_KEY=your_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

**Note**: Currently hardcoded in `firebase.js`

## 📱 Mobile Development

Test responsive design:
```
Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
Select device from dropdown
Test touch interactions
```

## 🚀 Performance Tips

1. **Lazy Loading**: Use React.lazy() for routes
2. **Image Optimization**: Use SVG icons (Lucide)
3. **Bundle Analysis**: npm install webpack-bundle-analyzer
4. **Database Queries**: Add indexes in Firestore
5. **Caching**: Use React.memo for components

## 🔒 Security Best Practices

1. ✅ Never expose API keys in code
2. ✅ Use environment variables
3. ✅ Validate user input
4. ✅ Check roles server-side
5. ✅ Use HTTPS for production
6. ✅ Enable Firestore security rules

## 🎓 Learning Resources

- React: https://react.dev
- Firebase: https://firebase.google.com/docs
- Tailwind: https://tailwindcss.com/docs
- React Router: https://reactrouter.com/docs

## 🐛 Troubleshooting Commands

```bash
# Clear everything and start fresh
rm -rf node_modules build .cache
npm install
npm start

# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest
```

## 📝 Code Style

- Use camelCase for variables
- Use PascalCase for React components
- Use arrow functions
- Add comments for complex logic
- Keep components under 300 lines
- Use meaningful variable names

## ✨ Best Practices

1. DRY (Don't Repeat Yourself)
2. KISS (Keep It Simple, Stupid)
3. Single Responsibility Principle
4. Consistent formatting
5. Clear naming conventions
6. Error handling
7. Loading states
8. User feedback

---

**Remember**: Always test changes before pushing to production!

For more details, see the full documentation files.
