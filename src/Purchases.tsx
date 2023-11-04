import { useSelector } from "react-redux";
import { customersSelector, productsSelector, purchasesSelector } from "./redux_nonsense";
import { useState } from "react";
import { Customer } from "./Customers";
function SearchBox(
	properties : {
		productId : number,
		customerId : number,
		dateSearchBox : string
	}
){
	const products = useSelector(productsSelector);
	const customers = useSelector(customersSelector);
	const purchases = useSelector(purchasesSelector);
	const selectProducts = (customer : Customer) => {
		const purchases_by_this_customer=purchases.filter(purchase=>
			customer.id == purchase.customer_id &&
			(
				properties.productId==purchase.product_id || 
				properties.productId==-1
			) &&
			new Date(purchase.date_of_purchase).toUTCString().includes(properties.dateSearchBox)
		);
		return <tr>
			<td>{customer.name}</td>
			<td>{purchases_by_this_customer.map(purchase=><>{products.find(product=>product.id===purchase.product_id)!!.name}<br/></>)}</td>
			<td>{purchases_by_this_customer.map(purchase=><>{new Date(purchase.date_of_purchase).toUTCString()}<br/></>)}</td>
		</tr>;

	};
	return <table>
	<thead><th>Name</th><th>Purchased Products</th><th>Date</th></thead>	
	<tbody>{(()=>{
	if (properties.customerId == -1){
		return customers.map(selectProducts);
	} else {
		return selectProducts(customers.find(customer=>customer.id==properties.customerId)!!);
	}
	})()}
	</tbody></table>;
}
export function PurchasesPage() {
	const products = useSelector(productsSelector);
	const customers = useSelector(customersSelector);
	const [productId,productIdSetter] = useState(-1);
	const [customerId,customerIdSetter] = useState(-1);
	const [dateSearchBox,dateSearchBoxSetter] = useState("");
	const [dateSearchBoxSearch,dateSearchBoxSearchSetter] = useState("");
	const [productIdSearch,productIdSearchSetter] = useState(-1);
	const [customerIdSearch,customerIdSearchSetter] = useState(-1);
	const [toSearch,toSearchSetter] = useState(false);
	
	return <>
		<select onChange={e=>productIdSetter(Number.parseInt(e.target.value))}>
			<option value={-1}>&nbsp;</option>
			{products.map(product=><option value={product.id}>{product._name}</option>)}
		</select>
		<select onChange={e=>customerIdSetter(Number.parseInt(e.target.value))}>
			<option value={-1}>&nbsp;</option>
			{customers.map(customer=><option value={customer.id}>{customer._name}</option>)}
		</select>
		<input onChange={e=>dateSearchBoxSetter(e.target.value)} type="text"/>
		<button
			onClick={()=>{
				toSearchSetter(true);
				productIdSearchSetter(productId);
				customerIdSearchSetter(customerId);
				dateSearchBoxSearchSetter(dateSearchBox);
			}}
		>Search</button><br/>
		{toSearch?<SearchBox
			productId={productIdSearch}
			customerId={customerIdSearch}
			dateSearchBox={dateSearchBoxSearch}
		/>:<></>}
	</>;
}

export function PurchasePanel(){
	const purchases = useSelector(purchasesSelector);
	const customers = useSelector(customersSelector);
	return <p>
		{purchases.map(
			purchase => <>
			{customers.find(customer=>customer.id==purchase.customer_id)!!.createLink()} <br/>
			{new Date(purchase.date_of_purchase).toUTCString()}
			<button>Add</button>
			</>
		)}
	</p>
}