import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/Auth'
import Public from './layouts/Public'
import Private from './layouts/Private'
import Login from './routes/Login'
import Register from './routes/Register'
import Teams from './routes/Teams'
import Team from './routes/Team'
// import reportWebVitals from './reportWebVitals'

const router = createBrowserRouter([
  {
    element: <Public />,
    children: [
      {
        path: '/register',
        element: <Register />
      },
      {
        path: '/login',
        element: <Login />
      },
    ]
  },
  {
    element: <Private />,
    children: [
      // {
      //   index: true,
      //   element: <Console />,
      // },
      {
        index: true,
        element: <Teams />,
      },
      {
        path: '/teams/:team_id',
        element: <Team />,
      }
    ]
  }
])

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
