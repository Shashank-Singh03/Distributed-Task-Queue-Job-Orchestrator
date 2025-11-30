import { BrowserRouter } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Router from './router'

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Router />
      </AppShell>
    </BrowserRouter>
  )
}

export default App

