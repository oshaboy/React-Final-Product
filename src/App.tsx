import {BrowserRouter, Routes, Route } from 'react-router-dom';
import {MenuPage} from './Menu.tsx';
import {ProductsPage,EditProductPage} from './Products.tsx';
import {PurchasesPage} from './Purchases.tsx';
import { StoreData, store } from './redux_nonsense.tsx';
import { Provider } from 'react-redux';
import { CustomersPage, EditCustomerPage } from './Customers.tsx';
import { downloadFirebase, syncFirebase } from './firebase_nonsense.ts';
import { useEffect } from 'react';

import { useSelector } from 'react-redux';
const Router=()=>{
  const isvalid = useSelector((store_data : StoreData)=>store_data.isvalid);
  if (isvalid) {
    return <BrowserRouter>
      <Routes>  
        <Route path='' element={<MenuPage />} />
        <Route path='/products' element={<ProductsPage />} />
        <Route path='/products/:id' element={<EditProductPage />} />
        <Route path='/purchases' element={<PurchasesPage />} />
        <Route path='/customers' element={<CustomersPage />} />
        <Route path='/customers/:id' element={<EditCustomerPage />} />
        <Route path='*' element={<> Page does not exist </>} />
      </Routes>
    </BrowserRouter>;
  } else return <h1>Loading</h1>;
}
function App() {
  useEffect(
    ()=>{
      downloadFirebase();
      setInterval(syncFirebase, 5000);
    },[]
  );
  return <Provider store={store}>
    <Router/>
  </Provider>;

}

export default App
