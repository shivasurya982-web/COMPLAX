# COMPLAX

"Smart Complaints. Right Priority."

A modern, multi-organization complaint management and prioritization system powered by **Machine Learning** and **Data Structures**.

## 🚀 Key Features

- **Multi-Organization Architecture**: Supports Apartments, Hostels, Offices, and more.
- **AI-Powered Prioritization**: Uses a **TF-IDF + Decision Tree Classifier** to automatically predict if a complaint is High, Medium, or Low priority.
- **DSA Priority Queue**: Implements a Priority Queue (Heaps) to ensure critical issues are addressed first.
- **Real-Time Dataset Management**: Admins can edit the global training dataset and organization-specific datasets directly from the browser.
- **Modern Glassmorphism UI**: High-end responsive design for mobile, tablet, and desktop.
- **Organization Isolation**: Secure multi-tenant environment where data is strictly isolated between organizations.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Lucide React, Axios.
- **Backend**: Python (Flask), Flask-CORS.
- **Machine Learning**: Scikit-learn, Pandas, Joblib.
- **Database**: JSON-based persistent storage (for portability).

## 📁 Project Structure

- `backend/`: Flask API, ML Model logic, and data handling.
- `frontend/`: React Vite application with responsive glassmorphism theme.
- `dataset/`: Contains the master CSV for the global AI model.

## ⚙️ Setup and Installation

### 1. Backend Setup
1. Open your terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   - For Development: `python app.py`
   - For Production (Recommended for Demo): `python run_production.py`
   *Note: On first run, COMPLAX will automatically generate a 500-row seed dataset and train the initial AI model.*

### 2. Frontend Setup
1. Open your terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### ☁️ Cloud Deployment (Render.com)

#### 1. Backend (Web Service)
- **Connect GitHub Repository**
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn wsgi:app`
- **Environment Variables**: Add `PORT` (Render sets this automatically).

#### 2. Frontend (Static Site)
- **Connect GitHub Repository**
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: 
  - `VITE_API_URL`: Paste your Backend URL (e.g., `https://your-api.onrender.com/api`)

### Organization Admin
- Register via the "Organization" tab on the Login page.

### Resident/User
- Register via the "User" tab (Organization must be approved by Main Admin first).

## 📊 ML & DSA Highlights
- **Algorithm**: Decision Tree Classifier with TF-IDF Vectorization for text analysis.
- **Data Structure**: `heapq` based Priority Queue for efficient O(log n) insertions and prioritized retrieval.
