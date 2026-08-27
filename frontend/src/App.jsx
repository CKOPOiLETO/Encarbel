import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Catalog from './pages/Catalog';
import CarDetail from './pages/CarDetail';
import Calculator from './pages/Calculator';
import About from './pages/About';
import History from './pages/History';

import Contacts from './pages/Contacts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Catalog />} />
          <Route path="car/:id" element={<CarDetail />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="about" element={<About />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="catalog/:make" element={<Catalog />} />              
          <Route path="catalog/:make/:model" element={<Catalog />} /> 
          <Route path="history" element={<History />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;